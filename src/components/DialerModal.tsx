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
import { CallLog, CallOutcome } from "@/types/call";
import { useCallStore } from "@/store/supabaseCallStore";
import { Progress } from "@/components/ui/progress";

interface DialerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onCallComplete: () => void;
}

interface DialerClient {
  client: Client;
  callStatus: CallOutcome | 'waiting' | 'calling' | 'skipped';
  notes: string;
}

export const DialerModal = ({ open, onOpenChange, clients, onCallComplete }: DialerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialerClients, setDialerClients] = useState<DialerClient[]>([]);
  const [notes, setNotes] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { makeCall, hangupCall, isCallInProgress, activeCall, callDuration } = useTwilioStore();
  const { addCall } = useCallStore();
  const { toast } = useToast();

  const prevIsCallInProgress = useRef(isCallInProgress);

  const startNextCall = useCallback(() => {
    if (isPaused || currentIndex >= dialerClients.length || isCallInProgress || isProcessing) return;
    
    const clientToCall = dialerClients[currentIndex]?.client;
    if (clientToCall) {
      setIsProcessing(true);
      console.log(`📞 Calling next client: ${clientToCall.full_name}`);
      makeCall({
        phoneNumber: clientToCall.phone,
        clientId: clientToCall.id,
        clientName: clientToCall.full_name,
      }).finally(() => {
        setIsProcessing(false);
      });
    }
  }, [currentIndex, dialerClients, isPaused, makeCall, isCallInProgress, isProcessing]);

  const handleSmartNext = useCallback(async (force = false) => {
    if (isProcessing && !force) return;
    
    setIsProcessing(true);
    
    if (isCallInProgress) {
      console.log('📞 Ending active call before moving to next...');
      hangupCall();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (currentIndex < dialerClients.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setNotes(""); // Clear notes for next client
    } else {
      toast({ title: "Dialer Finished", description: "All clients have been contacted." });
      onOpenChange(false);
      onCallComplete();
    }
    
    setIsProcessing(false);
  }, [isProcessing, isCallInProgress, hangupCall, currentIndex, dialerClients.length, onOpenChange, onCallComplete, toast]);

  const markCallComplete = useCallback(async (status: CallOutcome | 'skipped') => {
    const client = dialerClients[currentIndex]?.client;
    if (!client) return;

    if (status !== 'skipped') {
        const callLog: Omit<CallLog, 'id' | 'created_at'> = {
            client_id: client.id,
            outcome: status,
            notes: notes,
            duration: callDuration,
            call_sid: activeCall?.parameters.CallSid || null,
            user_id: '' // This should be populated from the session
        };
        await addCall(callLog);
    }
    
    setDialerClients(prev => prev.map((c, i) => i === currentIndex ? { ...c, callStatus: status } : c));
    
    toast({ title: "Call Marked", description: `Status set to ${status}` });
    
    handleSmartNext();
  }, [currentIndex, dialerClients, notes, callDuration, activeCall, addCall, toast, handleSmartNext]);

  useEffect(() => {
    if (open) {
      const initialClients = clients.map(c => ({ client: c, callStatus: 'waiting' as const, notes: '' }));
      setDialerClients(initialClients);
      setCurrentIndex(0);
      setIsPaused(false);
      setNotes("");
    }
  }, [open, clients]);

  useEffect(() => {
    if (open && !isPaused && !isCallInProgress && prevIsCallInProgress.current) {
        handleSmartNext();
    }
    prevIsCallInProgress.current = isCallInProgress;
  }, [isCallInProgress, open, isPaused, handleSmartNext]);
  
  useEffect(() => {
    if (open && !isPaused && !isCallInProgress && !isProcessing) {
        const currentStatus = dialerClients[currentIndex]?.callStatus;
        if (currentStatus === 'waiting') {
            const timer = setTimeout(startNextCall, 1500);
            return () => clearTimeout(timer);
        }
    }
  }, [currentIndex, open, isPaused, isCallInProgress, isProcessing, dialerClients, startNextCall]);
  
  const currentClient = dialerClients[currentIndex]?.client;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Dialer</DialogTitle>
          <DialogDescription>
            Calling {currentIndex + 1} of {clients.length} clients.
          </DialogDescription>
          <Progress value={((currentIndex + 1) / clients.length) * 100} className="mt-2" />
        </DialogHeader>
        
        {currentClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>{currentClient.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Phone:</strong> {currentClient.phone}</p>
                <p><strong>Email:</strong> {currentClient.email}</p>
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
                <Button onClick={() => markCallComplete('skipped')} variant="secondary">Skip</Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex-shrink-0">
            <Button onClick={() => handleSmartNext(true)} variant="destructive" disabled={isProcessing}>
                {isCallInProgress ? 'End Call & Next' : 'Skip to Next'}
            </Button>
            <Button onClick={() => setIsPaused(!isPaused)} variant="secondary">
                {isPaused ? 'Resume Dialer' : 'Pause Dialer'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};