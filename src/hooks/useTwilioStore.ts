import { create } from 'zustand';
import { Device, Call } from '@twilio/voice-sdk';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CallOptions {
  phoneNumber: string;
  clientName?: string;
  clientId?: string;
}

interface TwilioStore {
  device: Device | null;
  isReady: boolean;
  isConnecting: boolean;
  activeCall: Call | null;
  error: string | null;
  callDuration: number;
  isMuted: boolean;
  isInitializing: boolean;
  audioUnlocked: boolean;
  
  // Computed properties
  currentCall: Call | null;
  callStatus: 'idle' | 'calling' | 'connected';
  isCallInProgress: boolean;
  
  // Actions
  fetchTwilioToken: () => Promise<string>;
  unlockAudio: () => void;
  initializeDevice: () => Promise<void>;
  makeCall: (options: CallOptions) => Promise<void>;
  hangupCall: () => void;
  endCall: () => void;
  muteCall: () => void;
  unmuteCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  destroyDevice: () => void;
  setupCallEventHandlers: (call: Call) => void;
  handleIncomingCall: (call: Call) => void;
}

export const useTwilioStore = create<TwilioStore>((set, get) => ({
  // Initial state
  device: null,
  isReady: false,
  isConnecting: false,
  activeCall: null,
  error: null,
  callDuration: 0,
  isMuted: false,
  isInitializing: false,
  audioUnlocked: false,
  
  // Computed properties
  get currentCall() { return get().activeCall; },
  get callStatus() { 
    const { activeCall, isConnecting } = get();
    return activeCall ? 'connected' : isConnecting ? 'calling' : 'idle';
  },
  get isCallInProgress() { 
    const { activeCall, isConnecting } = get();
    return !!activeCall || isConnecting;
  },

  // Actions
  fetchTwilioToken: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      console.log('🔄 Fetching Twilio token...');
      
      const { data, error } = await supabase.functions.invoke('get-twilio-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Token fetch error:', error);
        throw new Error(`Failed to get token: ${error.message}`);
      }
      
      if (!data?.token) {
        throw new Error('No token returned from server');
      }
      
      console.log('✅ Twilio token received');
      return data.token;
    } catch (err: any) {
      console.error('❌ Error fetching Twilio token:', err);
      throw err;
    }
  },

  unlockAudio: async () => {
    const { audioUnlocked } = get();
    if (!audioUnlocked) {
      console.log('🔓 Unlocking audio context...');
      
      try {
        // Request microphone permissions explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone permission granted');
        
        // Stop the stream immediately since we just needed permissions
        stream.getTracks().forEach(track => track.stop());
        
        set({ audioUnlocked: true });
        console.log('🔓 Audio unlocked state set to true');
        toast({
          title: "Audio Unlocked",
          description: "Microphone access granted. Ready to make calls.",
        });
      } catch (error) {
        console.error('❌ Microphone permission denied:', error);
        set({ 
          audioUnlocked: false,
          error: 'Microphone permission required for calls' 
        });
        toast({
          title: "Microphone Permission Required",
          description: "Please allow microphone access to make calls.",
          variant: "destructive",
        });
        throw error;
      }
    } else {
      console.log('🔓 Audio already unlocked');
    }
  },

  initializeDevice: async () => {
    const { isInitializing, device, audioUnlocked } = get();
    
    // Prevent multiple simultaneous initializations
    if (isInitializing || device) {
      console.log('⚠️ Device already initializing or initialized, skipping...');
      return;
    }

    if (!audioUnlocked) {
      try {
        console.log('🔓 Audio not unlocked. Requesting permissions...');
        await get().unlockAudio();
      } catch (error) {
        console.error('❌ Failed to unlock audio:', error);
        set({ error: 'Microphone permission required for calling. Please click the unlock audio button.' });
        return;
      }
    }

    try {
      console.log('🔄 Initializing Twilio device...');
      set({ isInitializing: true, error: null });
      
      const token = await get().fetchTwilioToken();
      
      // Create Twilio device with standard configuration
      const newDevice = new Device(token, {
        logLevel: 1,
        edge: ['sydney', 'ashburn'],
      });

      // Set a timeout for device registration
      const registrationTimeout = setTimeout(() => {
        console.error('⏰ Device registration timeout');
        set({ 
          error: 'Device registration timeout. Please check your Twilio configuration.',
          isReady: false,
          isInitializing: false 
        });
        toast({
          title: "Registration Failed",
          description: "Device registration timeout. Please check your Twilio configuration.",
          variant: "destructive",
        });
      }, 10000);

      // Set up device event handlers
      newDevice.on('registered', () => {
        clearTimeout(registrationTimeout);
        console.log('✅ Twilio device registered successfully');
        set({ 
          device: newDevice,
          isReady: true,
          isInitializing: false 
        });
        toast({
          title: "Twilio Ready",
          description: "Twilio device is ready to make real calls",
        });
      });

      newDevice.on('error', (error) => {
        clearTimeout(registrationTimeout);
        console.error('❌ Device error:', error);
        set({ 
          error: `Device error: ${error.message || error}`,
          isReady: false,
          isInitializing: false 
        });
        toast({
          title: "Device Error",
          description: "Twilio device error occurred. Please check your configuration.",
          variant: "destructive",
        });
      });

      newDevice.on('incoming', (call) => {
        console.log('📞 Incoming call:', call.parameters.From);
        get().handleIncomingCall(call);
      });

      // Register the device
      await newDevice.register();
      
    } catch (err: any) {
      console.error('❌ Failed to initialize Twilio device:', err);
      
      set({ 
        error: `Initialization failed: ${err.message || err}`,
        isReady: false,
        isInitializing: false 
      });
      
      toast({
        title: "Initialization Failed",
        description: "Twilio initialization failed. Please check your configuration.",
        variant: "destructive",
      });
    }
  },

  handleIncomingCall: (call: Call) => {
    set({ activeCall: call });
    get().setupCallEventHandlers(call);
    
    toast({
      title: "Incoming Call",
      description: `Call from ${call.parameters.From}`,
    });
  },

  setupCallEventHandlers: (call: Call) => {
    call.on('accept', () => {
      console.log('✅ Call accepted');
      set({ isConnecting: false });
      toast({
        title: "Call Connected",
        description: "Call is now active",
      });
    });

    call.on('disconnect', () => {
      console.log('📞 Call disconnected');
      set({ 
        activeCall: null,
        isConnecting: false,
        callDuration: 0,
        isMuted: false 
      });
      toast({
        title: "Call Ended",
        description: "Call has been disconnected",
      });
    });

    call.on('cancel', () => {
      console.log('📞 Call cancelled');
      set({ 
        activeCall: null,
        isConnecting: false,
        callDuration: 0 
      });
      toast({
        title: "Call Cancelled",
        description: "Call was cancelled",
      });
    });

    call.on('reject', () => {
      console.log('📞 Call rejected');
      set({ 
        activeCall: null,
        isConnecting: false,
        callDuration: 0 
      });
      toast({
        title: "Call Rejected",
        description: "Call was rejected",
      });
    });

    call.on('error', (error) => {
      console.error('❌ Call error:', error);
      
      // Handle all call errors
      set({ 
        activeCall: null,
        isConnecting: false,
        callDuration: 0,
        error: error.message || 'Call error occurred' 
      });
      
      toast({
        title: "Call Error",
        description: error.message || 'An error occurred during the call',
        variant: "destructive",
      });
    });

    call.on('mute', (isMuted) => {
      set({ isMuted });
      console.log(`🔇 Call ${isMuted ? 'muted' : 'unmuted'}`);
    });
  },

  makeCall: async ({ phoneNumber, clientName, clientId }: CallOptions) => {
    const { isReady, error, activeCall, device } = get();
    
    console.log('🚀 makeCall called with:', { phoneNumber, clientName, clientId, isReady, error });
    
    if (!isReady) {
      const errorMsg = 'Calling device not ready. Please wait for initialization.';
      console.log('❌ Device not ready:', errorMsg);
      set({ error: errorMsg });
      toast({
        title: "Device Not Ready",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber) {
      const errorMsg = 'Phone number is required';
      set({ error: errorMsg });
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (activeCall) {
      const errorMsg = 'Another call is already in progress';
      set({ error: errorMsg });
      toast({
        title: "Call In Progress",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      set({ 
        error: null,
        isConnecting: true,
        callDuration: 0 
      });
      
      console.log(`📞 Making call to ${phoneNumber} for client: ${clientName || 'Unknown'}`);
      
      // Clean phone number
      let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      if (!cleanNumber.startsWith('+')) {
        cleanNumber = '+1' + cleanNumber;
      }

      // Check if we have a real Twilio device or are in demo mode
      if (device && !error?.includes('Demo Mode')) {
        // Real Twilio call
        try {
          console.log('🔄 Attempting real Twilio call...');
          
          // Ensure audio permissions are granted before making the call
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            });
            console.log('🎤 Audio permissions confirmed for call');
            // Stop the stream immediately since Twilio will acquire its own
            stream.getTracks().forEach(track => track.stop());
          } catch (audioError) {
            console.error('❌ Audio permission error before call:', audioError);
            throw new Error(`Microphone access required: ${audioError.message}`);
          }
          
          const call = await device.connect({
            params: {
              To: cleanNumber,
              ClientName: clientName || 'Unknown Client',
              ClientId: clientId || 'unknown'
            }
          });

          set({ activeCall: call });
          get().setupCallEventHandlers(call);

          toast({
            title: "Call Initiated",
            description: `Making Twilio call to ${clientName || phoneNumber}`,
          });

          console.log('✅ Real Twilio call initiated successfully:', call.parameters?.CallSid || 'unknown');
        } catch (twilioError: any) {
          console.error('❌ Real Twilio call failed:', twilioError.message);
          throw new Error(`Call failed: ${twilioError.message}`);
        }
      } else {
        // No device available - throw error instead of demo mode
        throw new Error('Twilio device not available. Please wait for initialization or check configuration.');
      }
      
    } catch (err: any) {
      console.error('❌ Call failed:', err);
      set({ 
        error: err.message || 'Failed to make call',
        isConnecting: false 
      });
      
      toast({
        title: "Call Failed",
        description: err.message || 'Failed to initiate call',
        variant: "destructive",
      });
    }
  },



  hangupCall: () => {
    const { activeCall } = get();
    if (activeCall) {
      console.log('📞 Ending call...');
      activeCall.disconnect();
    }
  },

  endCall: () => get().hangupCall(),

  muteCall: () => {
    const { activeCall, isMuted } = get();
    if (activeCall && !isMuted) {
      activeCall.mute(true);
    }
  },

  unmuteCall: () => {
    const { activeCall, isMuted } = get();
    if (activeCall && isMuted) {
      activeCall.mute(false);
    }
  },

  acceptCall: () => {
    const { activeCall } = get();
    if (activeCall) {
      activeCall.accept();
    }
  },

  rejectCall: () => {
    const { activeCall } = get();
    if (activeCall) {
      activeCall.reject();
    }
  },

  destroyDevice: () => {
    const { device } = get();
    if (device) {
      console.log('🔧 Destroying Twilio device...');
      try {
        device.destroy();
        set({ 
          device: null,
          isReady: false,
          activeCall: null,
          isConnecting: false,
          callDuration: 0,
          isMuted: false,
          error: null,
          isInitializing: false 
        });
      } catch (err) {
        console.error('Error destroying device:', err);
      }
    }
  },
}));
