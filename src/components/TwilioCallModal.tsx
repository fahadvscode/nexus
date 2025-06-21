import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneOff, Clock, AlertCircle, Phone, Mic, MicOff } from 'lucide-react';
import { useTwilioStore } from '@/hooks/useTwilioStore';
import { CallLog } from '@/types/call';
import { useToast } from '@/hooks/use-toast';

interface TwilioCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: {
    clientId: string;
    clientName: string;
    phoneNumber: string;
    preparationNotes: string;
    createdBy: string;
  } | null;
  onCallComplete: () => void;
}

export const TwilioCallModal = ({ open, onOpenChange, callData, onCallComplete }: TwilioCallModalProps) => {
  const { 
    makeCall, 
    hangupCall, 
    muteCall, 
    unmuteCall, 
    isReady, 
    isConnecting, 
    activeCall, 
    callDuration, 
    isMuted,
    error 
  } = useTwilioStore();
  const { toast } = useToast();
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Auto-initiate call when modal opens
  useEffect(() => {
    if (open && callData && isReady && !isConnecting && !activeCall) {
      console.log('🔄 Auto-initiating Twilio call...');
      setCallStartTime(new Date());
      makeCall({ 
        phoneNumber: callData.phoneNumber,
        clientName: callData.clientName,
        clientId: callData.clientId
      });
    }
  }, [open, callData, isReady, isConnecting, activeCall, makeCall]);

  // Handle call end and show outcome modal
  useEffect(() => {
    if (callStartTime && !activeCall && !isConnecting && open) {
      // Call has ended, show outcome modal
      handleCallComplete('connected');
    }
  }, [activeCall, isConnecting, callStartTime, open]);

  const handleEndCall = () => {
    if (activeCall) {
      hangupCall();
    } else {
      // If no active call, just close modal
      handleCallComplete('failed');
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      unmuteCall();
    } else {
      muteCall();
    }
  };

  const handleCallComplete = (outcome: CallLog['outcome'] = 'connected') => {
    if (!callData) return;

    const endTime = new Date();
    const startTime = callStartTime || new Date(endTime.getTime() - callDuration * 1000);

    // Create call log data
    const callLogData = {
      clientId: callData.clientId,
      clientName: callData.clientName,
      phoneNumber: callData.phoneNumber,
      startTime,
      endTime,
      duration: callDuration,
      outcome,
      notes: callData.preparationNotes || '',
      followUpRequired: outcome !== 'connected',
      followUpDate: null,
      tags: ['twilio-call'],
      createdBy: callData.createdBy,
      twilioCallSid: activeCall?.parameters?.CallSid || undefined,
    };

    // Reset state
    setCallStartTime(null);
    
    // Close modal and trigger completion
    onOpenChange(false);
    onCallComplete();

    // Show outcome modal with call data
    setTimeout(() => {
      const event = new CustomEvent('showCallOutcome', { 
        detail: { callData: callLogData } 
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { statusText, statusColor } = useMemo(() => {
    if (!isReady) return { statusText: 'INITIALIZING', statusColor: 'bg-gray-100 text-gray-800' };
    if (error) return { statusText: 'ERROR', statusColor: 'bg-red-100 text-red-800' };
    if (isConnecting) return { statusText: 'CONNECTING', statusColor: 'bg-blue-100 text-blue-800' };
    if (activeCall) return { statusText: 'CONNECTED', statusColor: 'bg-green-100 text-green-800' };
    return { statusText: 'READY', statusColor: 'bg-yellow-100 text-yellow-800' };
  }, [isReady, isConnecting, activeCall, error]);

  if (!callData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Twilio Call - {callData.clientName}</span>
          </DialogTitle>
          <DialogDescription>
            Making a call through Twilio to {callData.clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{callData.clientName}</p>
                  <p className="text-sm text-muted-foreground">{callData.phoneNumber}</p>
                  {activeCall?.parameters?.CallSid && (
                    <p className="text-xs text-gray-500 mt-1">
                      Call ID: {activeCall.parameters.CallSid}
                    </p>
                  )}
                </div>
                <Badge className={statusColor}>{statusText}</Badge>
              </div>
              
              {callData.preparationNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Preparation Notes:</p>
                  <p className="text-sm text-blue-700 mt-1">{callData.preparationNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-4xl font-mono">
              <Clock className="w-8 h-8" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {activeCall && (
              <Button 
                variant={isMuted ? "default" : "outline"}
                size="lg" 
                onClick={handleMuteToggle}
                className="flex-1"
              >
                {isMuted ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="lg" 
              onClick={handleEndCall}
              className="flex-1"
              disabled={!isReady && !activeCall}
            >
              <PhoneOff className="mr-2 h-5 w-5" /> 
              End Call
            </Button>
          </div>

          {error && (
            <div className="flex items-center text-red-600 p-3 bg-red-50 rounded-md">
              <AlertCircle className="mr-2 h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isReady && !error && (
            <div className="flex items-center text-yellow-600 p-3 bg-yellow-50 rounded-md">
              <AlertCircle className="mr-2 h-4 w-4" />
              <p className="text-sm">Initializing Twilio device. Please wait...</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>🎯 Calling through Twilio Voice</p>
            <p>Audio will play through your computer speakers/headset</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};