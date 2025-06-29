import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTwilioStore } from "@/hooks/useTwilioStore";
import { Client } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { useCallStore } from "@/hooks/useCallStore";
import { CallLog } from "@/types/call";

interface DialerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClientIds: string[];
  clients: Client[];
  onCallComplete: () => void;
}

type CallStatus = 'waiting' | 'calling' | 'connected' | 'no-answer' | 'busy' | 'failed' | 'skipped';

interface DialerClient {
  client: Client;
  callStatus: CallStatus;
  attemptCount: number;
  lastAttempt: Date | null;
  notes: string;
  twilioCallSid?: string;
}

// ENHANCED BULK DIALER - FIXED NAVIGATION & CALL CONTROLS
export const DialerModal = ({ open, onOpenChange, clients, onCallComplete }: DialerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialerClients, setDialerClients] = useState<DialerClient[]>([]);
  const [notes, setNotes] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [quickNotes, setQuickNotes] = useState<Record<number, string>>({});
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCallControls, setShowCallControls] = useState(false);

  const { makeCall, endCall, isCallInProgress, callStatus } = useTwilioStore();
  const { addCall } = useCallStore();
  const { toast } = useToast();
  
  // Debounce timeout ref
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize clients only once
  useEffect(() => {
    if (open && clients.length > 0) {
      console.log('🔄 Initializing dialer with', clients.length, 'clients');
      
      const initialClients = clients.map(client => ({
        client,
        callStatus: 'waiting' as CallStatus,
        attemptCount: 0,
        lastAttempt: null,
        notes: ''
      }));
      
      setDialerClients(initialClients);
      setCurrentIndex(0);
      setNotes("");
      setIsPaused(false);
      setIsOnBreak(false);
      setIsProcessing(false);
      setShowCallControls(false);
      setQuickNotes({});
    }
  }, [open, clients.length]);

  // Monitor call status changes
  useEffect(() => {
    if (isCallInProgress) {
      setShowCallControls(true);
    } else {
      // Keep controls visible for a short time after call ends
      const timer = setTimeout(() => {
        setShowCallControls(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCallInProgress]);

  // Safe end call function with proper error handling and forced state reset
  const safeEndCall = useCallback(async (force = false) => {
    if (isCallInProgress || force) {
      console.log('📞 Ending active call (force:', force, ')');
      try {
        await endCall();
        console.log('✅ Call ended successfully');
        toast({
          title: 'Call Ended',
          description: 'Call ended successfully.'
        });
        setIsProcessing(false);
        return true;
      } catch (error) {
        console.error('❌ Error ending call:', error);
        toast({
          title: 'Error Ending Call',
          description: 'Could not end call. Forcing state reset.',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return false;
      }
    }
    setIsProcessing(false);
    return true;
  }, [isCallInProgress, endCall, toast]);

  // Debounced action wrapper
  const debounceAction = useCallback((action: () => void, delay = 500) => {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    actionTimeoutRef.current = setTimeout(() => {
      action();
    }, delay);
  }, []);

  // Enhanced jump to client with proper call handling
  const jumpToClient = useCallback(async (index: number) => {
    if (isProcessing) {
      console.log('⚠️ Already processing, ignoring jump request');
      return;
    }
    
    if (index < 0 || index >= dialerClients.length) {
      console.log('⚠️ Invalid index:', index);
      return;
    }

    setIsProcessing(true);
    
    console.log(`🎯 Jumping to client ${index + 1}: ${dialerClients[index]?.client.name}`);
    
    // Always end call first
    await safeEndCall();
    
    // Save current notes
    if (notes.trim()) {
      setQuickNotes(prev => ({
        ...prev,
        [currentIndex]: notes
      }));
    }
    
    // Update index and load notes
    setCurrentIndex(index);
    setNotes(quickNotes[index] || "");
    
    toast({
      title: "📍 Jumped to Client",
      description: `Now on client ${index + 1}: ${dialerClients[index]?.client.name}`,
    });
    
    setIsProcessing(false);
  }, [isProcessing, dialerClients, currentIndex, notes, quickNotes, safeEndCall, toast]);

  // Navigation functions
  const jumpBack = useCallback(() => {
    if (currentIndex > 0) {
      debounceAction(() => jumpToClient(currentIndex - 1));
    } else {
      toast({
        title: "⚠️ At First Client",
        description: "Already at the first client",
      });
    }
  }, [currentIndex, jumpToClient, debounceAction, toast]);

  // Enhanced next client function with fallback
  const nextClient = useCallback(async (force = false) => {
    if (isProcessing && !force) {
      toast({
        title: '⏳ Please Wait',
        description: 'Still processing previous action. Use Force Next if stuck.',
        variant: 'destructive',
      });
      return;
    }
    setIsProcessing(true);
    // End current call if active
    if (isCallInProgress || force) {
      await safeEndCall(force);
      toast({
        title: '📞 Call Ended',
        description: 'Moving to next client...',
      });
    }
    // Save current notes
    if (notes.trim()) {
      setQuickNotes(prev => ({
        ...prev,
        [currentIndex]: notes
      }));
    }
    // Move to next client
    if (currentIndex < dialerClients.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setNotes(quickNotes[currentIndex + 1] || "");
      toast({
        title: '➡️ Next Client',
        description: `Now on client ${currentIndex + 2}: ${dialerClients[currentIndex + 1]?.client.name}`,
      });
    } else {
      toast({
        title: '✅ All Clients Complete',
        description: "You've reached the end of the client list",
      });
      onCallComplete();
    }
    setIsProcessing(false);
  }, [isProcessing, isCallInProgress, safeEndCall, notes, currentIndex, quickNotes, dialerClients, toast, onCallComplete]);

  // Enhanced call current client with better state management
  const callCurrentClient = useCallback(async () => {
    if (isProcessing) {
      console.log('⚠️ Already processing, ignoring call request');
      return;
    }
    
    const currentClient = dialerClients[currentIndex]?.client;
    if (!currentClient || isPaused || isOnBreak) {
      console.log('⚠️ Cannot call:', { currentClient: !!currentClient, isPaused, isOnBreak });
      return;
    }

    if (isCallInProgress) {
      toast({
        title: "⚠️ Call Already Active",
        description: "Please hang up the current call first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCallStartTime(new Date());
    setShowCallControls(true);
    
    console.log(`📞 Calling ${currentClient.name} at ${currentClient.phone}`);
    
    // Update attempt count and status
    setDialerClients(prev => prev.map((dialerClient, i) =>
      i === currentIndex
        ? { 
            ...dialerClient, 
            callStatus: 'calling',
            attemptCount: (dialerClient.attemptCount || 0) + 1,
            lastAttempt: new Date()
          }
        : dialerClient
    ));

    try {
      await makeCall({
        phoneNumber: currentClient.phone,
        clientId: currentClient.id,
        clientName: currentClient.name,
      });
      
      toast({
        title: "📞 Call Initiated",
        description: `Calling ${currentClient.name} at ${currentClient.phone}`,
      });
    } catch (error) {
      console.error('❌ Call failed:', error);
      
      // Update status to failed
      setDialerClients(prev => prev.map((dialerClient, i) =>
        i === currentIndex
          ? { ...dialerClient, callStatus: 'failed' }
          : dialerClient
      ));
      
      toast({
        title: "❌ Call Failed",
        description: `Failed to call ${currentClient.name}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, dialerClients, currentIndex, isPaused, isOnBreak, isCallInProgress, makeCall, toast]);

  // Enhanced hang up function with fallback
  const hangUpCall = useCallback(async (force = false) => {
    console.log('📞 Hang up requested (force:', force, ')');
    if (isCallInProgress || force) {
      await safeEndCall(force);
      setDialerClients(prev => prev.map((dialerClient, i) =>
        i === currentIndex
          ? { ...dialerClient, callStatus: 'failed' }
          : dialerClient
      ));
      toast({
        title: '📞 Call Ended',
        description: 'Call has been hung up',
      });
    } else {
      toast({
        title: 'ℹ️ No Active Call',
        description: 'There is no call to hang up',
      });
    }
    setIsProcessing(false);
  }, [isCallInProgress, safeEndCall, currentIndex, toast]);

  // Retry with attempt limit
  const retryCurrentClient = useCallback(() => {
    const currentClient = dialerClients[currentIndex];
    if (currentClient?.attemptCount >= 3) {
      toast({
        title: "🚫 Max Attempts Reached",
        description: "This client has been called 3 times already. Please mark the status.",
        variant: "destructive",
      });
      return;
    }
    debounceAction(() => callCurrentClient());
  }, [dialerClients, currentIndex, callCurrentClient, debounceAction, toast]);

  // Break toggle with proper call handling
  const toggleBreak = useCallback(async () => {
    console.log(`🛑 ${isOnBreak ? 'Ending' : 'Starting'} break`);
    
    // End call if active
    await safeEndCall();
    
    setIsOnBreak(!isOnBreak);
    
    toast({
      title: isOnBreak ? "🟢 Break Ended" : "🛑 Taking Break",
      description: isOnBreak ? "Back to calling!" : "Paused for break - all calls stopped",
    });
  }, [isOnBreak, safeEndCall, toast]);

  // Enhanced quick mark with proper call handling
  const quickMark = useCallback(async (status: CallStatus, autoAdvance = true) => {
    if (isProcessing) {
      console.log('⚠️ Already processing, ignoring mark request');
      return;
    }
    
    setIsProcessing(true);
    
    console.log(`✅ Marking client ${currentIndex + 1} as: ${status}`);
    
    // End call first
    await safeEndCall();

    // Save current notes
    setQuickNotes(prev => ({
      ...prev,
      [currentIndex]: notes
    }));

    // Update client status
    setDialerClients(prev => prev.map((dialerClient, i) =>
      i === currentIndex
        ? { 
            ...dialerClient, 
            callStatus: status, 
            notes: notes || `Marked as ${status}`,
          }
        : dialerClient
    ));

    // Log the call
    const currentClient = dialerClients[currentIndex]?.client;
    if (currentClient) {
      const callLog: Omit<CallLog, 'id'> = {
        clientId: currentClient.id,
        clientName: currentClient.name,
        phoneNumber: currentClient.phone,
        startTime: callStartTime || new Date(),
        endTime: new Date(),
        duration: callStartTime ? Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000) : 0,
        outcome: status === 'connected' ? 'connected' : 
                status === 'no-answer' ? 'no-answer' : 
                status === 'busy' ? 'busy' : 'failed',
        notes: notes || `Dialer: ${status}`,
        followUpRequired: status !== 'connected',
        createdBy: 'current-user',
        tags: ['dialer'],
      };
      addCall(callLog);
    }

    toast({
      title: `✅ Marked as ${status}`,
      description: autoAdvance ? "Moving to next client..." : "Staying on current client",
    });

    setIsProcessing(false);

    // Auto-advance if enabled
    if (autoAdvance) {
      debounceAction(() => nextClient(), 1000);
    }
  }, [isProcessing, currentIndex, notes, dialerClients, callStartTime, addCall, toast, safeEndCall, nextClient, debounceAction]);

  // Bulk actions
  const markAllRemaining = useCallback((status: CallStatus) => {
    const remainingIndexes = dialerClients
      .map((client, index) => ({ client, index }))
      .filter(({ client, index }) => index >= currentIndex && client.callStatus === 'waiting')
      .map(({ index }) => index);

    setDialerClients(prev => prev.map((dialerClient, i) =>
      remainingIndexes.includes(i)
        ? { ...dialerClient, callStatus: status, notes: `Bulk marked as ${status}` }
        : dialerClient
    ));

    toast({
      title: "📋 Bulk Action Complete",
      description: `Marked ${remainingIndexes.length} remaining clients as ${status}`,
    });
  }, [dialerClients, currentIndex, toast]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      
      // Don't trigger if modal is closed
      if (!open) return;
      
      switch (e.key.toLowerCase()) {
        case ' ': // Space to call
          e.preventDefault();
          callCurrentClient();
          break;
        case 'h': // H to hang up
        case 'escape':
          e.preventDefault();
          hangUpCall();
          break;
        case 'arrowright': // Right arrow for next
        case 'n': // N for next
          e.preventDefault();
          nextClient();
          break;
        case 'arrowleft': // Left arrow for previous
        case 'p': // P for previous
          e.preventDefault();
          jumpBack();
          break;
        case 'c': // C for connected
          e.preventDefault();
          quickMark('connected');
          break;
        case 'a': // A for no answer
          e.preventDefault();
          quickMark('no-answer');
          break;
        case 'b': // B for busy
          e.preventDefault();
          quickMark('busy');
          break;
        case 'f': // F for failed
          e.preventDefault();
          quickMark('failed');
          break;
        case 's': // S for skip
          e.preventDefault();
          quickMark('skipped');
          break;
        case 'r': // R for retry
          e.preventDefault();
          retryCurrentClient();
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [open, callCurrentClient, hangUpCall, nextClient, jumpBack, quickMark, retryCurrentClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);

  // Navigation helpers
  const getCompletedCount = () => dialerClients.filter(c => c.callStatus !== 'waiting').length;
  const getRemainingCount = () => dialerClients.filter(c => c.callStatus === 'waiting').length;
  const getConnectedCount = () => dialerClients.filter(c => c.callStatus === 'connected').length;

  const currentClient = dialerClients[currentIndex]?.client;
  const currentDialerClient = dialerClients[currentIndex];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>📞 Bulk Dialer</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isOnBreak ? "destructive" : isPaused ? "secondary" : "default"}>
                {isOnBreak ? "🛑 On Break" : isPaused ? "⏸️ Paused" : "🟢 Active"}
              </Badge>
              <Badge variant="outline">
                {currentIndex + 1} / {dialerClients.length}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            📊 Completed: {getCompletedCount()} | ✅ Connected: {getConnectedCount()} | 📋 Remaining: {getRemainingCount()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Client Card */}
          {currentClient && (
            <Card className={`border-2 ${isOnBreak ? 'border-red-300 bg-red-50' : isPaused ? 'border-yellow-300 bg-yellow-50' : 'border-blue-300 bg-blue-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span className="text-xl">{currentClient.name}</span>
                    <Badge className="ml-2 text-xs">
                      {currentDialerClient?.callStatus?.toUpperCase() || 'WAITING'}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {currentDialerClient?.attemptCount > 0 && (
                      <div>Attempts: {currentDialerClient.attemptCount}</div>
                    )}
                    {currentDialerClient?.lastAttempt && (
                      <div>Last: {currentDialerClient.lastAttempt.toLocaleTimeString()}</div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-lg">{currentClient.phone}</p>
                    <p className="text-sm text-gray-600">{currentClient.email}</p>
                    <p className="text-sm text-gray-600">{currentClient.address}</p>
                  </div>
                  <div>
                    <Label>Quick Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Quick notes for this call..."
                      rows={3}
                      className="mt-1"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Action Buttons - ALWAYS VISIBLE */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Primary Actions */}
                <div className="flex justify-center space-x-3">
                  <Button
                    onClick={callCurrentClient}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 px-8"
                    disabled={!currentClient || isPaused || isOnBreak || isCallInProgress || isProcessing}
                  >
                    📞 Call {currentDialerClient?.attemptCount > 0 ? 'Again' : 'Now'}
                  </Button>
                  
                  <Button
                    onClick={hangUpCall}
                    size="lg"
                    variant="destructive"
                    disabled={!isCallInProgress || isProcessing}
                  >
                    📞 Hang Up
                  </Button>
                  
                  <Button
                    onClick={toggleBreak}
                    size="lg"
                    variant={isOnBreak ? "default" : "secondary"}
                    className={isOnBreak ? "bg-green-500 hover:bg-green-600" : ""}
                    disabled={isProcessing}
                  >
                    {isOnBreak ? "🟢 End Break" : "🛑 Take Break"}
                  </Button>
                </div>

                {/* Navigation - ALWAYS VISIBLE */}
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={jumpBack}
                    variant="outline"
                    disabled={currentIndex === 0}
                  >
                    ⬅️ Previous
                  </Button>
                  <Button
                    onClick={() => setIsPaused(!isPaused)}
                    variant="outline"
                    className={isPaused ? "bg-yellow-100" : ""}
                  >
                    {isPaused ? "▶️ Resume" : "⏸️ Pause"}
                  </Button>
                  <Button
                    onClick={() => nextClient(false)}
                    variant="outline"
                    disabled={currentIndex >= dialerClients.length - 1}
                  >
                    Next ➡️
                  </Button>
                  <Button
                    onClick={retryCurrentClient}
                    variant="outline"
                    disabled={!currentClient || currentDialerClient?.attemptCount >= 3}
                  >
                    🔄 Retry
                  </Button>
                  <Button
                    onClick={() => nextClient(true)}
                    variant="destructive"
                    className="ml-2"
                  >
                    🚨 Force Next
                  </Button>
                </div>

                {/* Quick Status Buttons */}
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={() => quickMark('connected')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={isProcessing}
                  >
                    ✅ Connected
                  </Button>
                  
                  <Button
                    onClick={() => quickMark('no-answer')}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600"
                    disabled={isProcessing}
                  >
                    📵 No Answer
                  </Button>
                  
                  <Button
                    onClick={() => quickMark('busy')}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={isProcessing}
                  >
                    📞 Busy
                  </Button>
                  
                  <Button
                    onClick={() => quickMark('failed')}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                    disabled={isProcessing}
                  >
                    ❌ Failed
                  </Button>
                  
                  <Button
                    onClick={() => quickMark('skipped')}
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                  >
                    ⏭️ Skip
                  </Button>
                </div>

                {/* Advanced Actions */}
                <div className="flex justify-center space-x-2 pt-2 border-t">
                  <Button
                    onClick={() => quickMark('no-answer', false)}
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                  >
                    📧 Voicemail (Stay)
                  </Button>
                  
                  <Button
                    onClick={() => markAllRemaining('no-answer')}
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    disabled={isProcessing}
                  >
                    🚫 Mark All No-Answer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Jump Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Jump to Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {dialerClients.map((dialerClient, index) => (
                  <Button
                    key={index}
                    onClick={() => jumpToClient(index)}
                    size="sm"
                    variant={index === currentIndex ? "default" : "outline"}
                    className={`text-xs ${index === currentIndex ? 'bg-blue-500 text-white' : ''}`}
                    disabled={isProcessing}
                  >
                    {index + 1}
                    <Badge className="ml-1 text-xs" variant="secondary">
                      {dialerClient.callStatus === 'waiting' ? '⏳' :
                       dialerClient.callStatus === 'calling' ? '📞' :
                       dialerClient.callStatus === 'connected' ? '✅' :
                       dialerClient.callStatus === 'no-answer' ? '📵' :
                       dialerClient.callStatus === 'busy' ? '📞' :
                       dialerClient.callStatus === 'failed' ? '❌' :
                       dialerClient.callStatus === 'skipped' ? '⏭️' : '⏳'}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Keyboard Shortcuts Info */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium mb-2">🎯 Enhanced Keyboard Shortcuts:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><kbd>Space</kbd> - Call Current</div>
                  <div><kbd>H/Esc</kbd> - Hang Up</div>
                  <div><kbd>→/N</kbd> - Next Client</div>
                  <div><kbd>←/P</kbd> - Previous Client</div>
                  <div><kbd>C</kbd> - Connected</div>
                  <div><kbd>A</kbd> - No Answer</div>
                  <div><kbd>B</kbd> - Busy</div>
                  <div><kbd>F</kbd> - Failed</div>
                  <div><kbd>S</kbd> - Skip</div>
                  <div><kbd>R</kbd> - Retry</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
