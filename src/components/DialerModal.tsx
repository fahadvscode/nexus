import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTwilioStore } from "@/hooks/useTwilioStore";
import { Client } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { CallLog } from "@/types/call";
import { useCallStore } from "@/hooks/useCallStore";
import { Progress } from "@/components/ui/progress";

interface DialerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onCallComplete: () => void;
}

type DialerStatus = CallLog['outcome'] | 'waiting' | 'calling' | 'skipped';

interface DialerClient {
  client: Client;
  callStatus: DialerStatus;
  notes: string;
}

export const DialerModal = ({ open, onOpenChange, clients, onCallComplete }: DialerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialerClients, setDialerClients] = useState<DialerClient[]>([]);
  const [notes, setNotes] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const { makeCall, hangupCall, isCallInProgress, activeCall, callDuration, isReady, error } = useTwilioStore();
  const { addCall } = useCallStore();
  const { toast } = useToast();
  const prevIsCallInProgress = useRef(isCallInProgress);

  const endCurrentCall = useCallback(() => {
    console.log(`📞 Attempting to end call. isCallInProgress: ${isCallInProgress}`);
    if (isCallInProgress) {
      hangupCall();
    } else {
      toast({ title: "No Active Call", description: "There is no active call to end.", variant: "destructive" });
    }
  }, [isCallInProgress, hangupCall, toast]);

  const handleNext = useCallback(async (isSkipping = false) => {
    if (currentIndex < dialerClients.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setNotes("");
    } else {
      toast({ title: "Dialer Finished", description: "All clients have been called." });
      onOpenChange(false);
      onCallComplete();
    }
  }, [currentIndex, dialerClients.length, onOpenChange, onCallComplete, toast]);

  const markCallComplete = useCallback(async (status: CallLog['outcome']) => {
    const client = dialerClients[currentIndex]?.client;
    if (!client) return;

    const callLog: Omit<CallLog, 'id'> = {
        clientId: client.id,
        clientName: client.name,
        phoneNumber: client.phone,
        startTime: new Date(Date.now() - (callDuration * 1000)),
        endTime: new Date(),
        outcome: status,
        notes: notes,
        duration: callDuration,
        twilioCallSid: activeCall?.parameters.CallSid || undefined,
        followUpRequired: false,
        createdBy: 'user_id_placeholder', // Replace with actual user ID
    };
    addCall(callLog);
    
    if (isCallInProgress) {
      hangupCall();
      // Wait for the call to actually terminate before moving on
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setDialerClients(prev => prev.map((c, i) => i === currentIndex ? { ...c, callStatus: status } : c));
    toast({ title: "Call Marked", description: `Status set to ${status}` });
    handleNext();
  }, [currentIndex, dialerClients, notes, callDuration, activeCall, addCall, toast, handleNext, isCallInProgress, hangupCall]);

  const startCall = useCallback(() => {
    const clientToCall = dialerClients[currentIndex]?.client;
    if (clientToCall && !isCallInProgress && !isPaused) {
      makeCall({
        phoneNumber: clientToCall.phone,
        clientId: clientToCall.id,
        clientName: clientToCall.name, // Corrected field name
      });
    }
  }, [dialerClients, currentIndex, isCallInProgress, isPaused, makeCall]);
  
  // This effect runs when the modal opens to initialize the dialer
  useEffect(() => {
    if (open) {
      const initialClients = clients.map(c => ({ client: c, callStatus: 'waiting' as const, notes: '' }));
      setDialerClients(initialClients);
      setCurrentIndex(0);
      setIsPaused(false);
      setNotes("");
    }
  }, [open, clients]);

  // This effect handles auto-advancing when a call ends
  useEffect(() => {
    if (open && !isPaused && !isCallInProgress && prevIsCallInProgress.current) {
        handleNext();
    }
    prevIsCallInProgress.current = isCallInProgress;
  }, [isCallInProgress, open, isPaused, handleNext]);
  
  // This effect handles auto-starting the next call
  useEffect(() => {
    if (open && !isPaused && !isCallInProgress && dialerClients[currentIndex]?.callStatus === 'waiting') {
        const timer = setTimeout(startCall, 1000); // 1-second delay before auto-dialing
        return () => clearTimeout(timer);
    }
  }, [currentIndex, open, isPaused, isCallInProgress, dialerClients, startCall]);
  
  const currentClient = dialerClients[currentIndex]?.client;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <div className="text-xs p-2 bg-gray-100 rounded">
          Twilio Status: {isReady ? 'Ready' : 'Not Ready'} | Error: {error || 'None'}
        </div>
        <DialogHeader>
          <DialogTitle>Enhanced Bulk Dialer</DialogTitle>
          <DialogDescription>
            Progress: {currentIndex + 1} of {clients.length}
          </DialogDescription>
          <Progress value={((currentIndex + 1) / clients.length) * 100} className="mt-2" />
        </DialogHeader>
        
        {currentClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-y-auto p-1">
            <Card>
              <CardHeader>
                <CardTitle>{currentClient.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Phone:</strong> {currentClient.phone}</p>
                <p><strong>Status:</strong> <Badge>{dialerClients[currentIndex]?.callStatus}</Badge></p>
                <p><strong>Call Duration:</strong> {callDuration}s</p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              <Label htmlFor="notes">Call Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Button onClick={() => markCallComplete('connected')}>Connected</Button>
                <Button onClick={() => markCallComplete('no-answer')} variant="outline">No Answer</Button>
                <Button onClick={() => markCallComplete('busy')} variant="outline">Busy</Button>
                <Button onClick={() => markCallComplete('voicemail')} variant="outline">Voicemail</Button>
                <Button onClick={() => markCallComplete('failed')} variant="destructive">Failed</Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex-shrink-0">
            <Button 
              onClick={isCallInProgress ? endCurrentCall : () => handleNext(true)} 
              variant="destructive"
              disabled={!isReady && isCallInProgress}
            >
                {isCallInProgress ? 'End Call' : 'Skip Client'}
            </Button>
            <Button onClick={() => handleNext(false)} disabled={isCallInProgress}>
              Next Client
            </Button>
            <Button onClick={() => setIsPaused(!isPaused)} variant="secondary">
                {isPaused ? 'Resume Dialer' : 'Pause Dialer'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};