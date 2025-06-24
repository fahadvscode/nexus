import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  PhoneOff, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  SkipForward,
  Pause,
  Play,
  Settings
} from "lucide-react";
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

type CallStatus = 'waiting' | 'calling' | 'connected' | 'no-answer' | 'busy' | 'failed' | 'completed' | 'skipped';

interface DialerClient {
  client: Client;
  callStatus: CallStatus;
  notes?: string;
  attemptTime?: Date;
  twilioCallSid?: string;
}

export const DialerModal = ({ 
  open, 
  onOpenChange, 
  selectedClientIds, 
  clients, 
  onCallComplete 
}: DialerModalProps) => {
  const { makeCall, endCall, isCallInProgress, currentCall, callDuration, callStatus } = useTwilioStore();
  const { addCall } = useCallStore();
  const { toast } = useToast();

  const [dialerClients, setDialerClients] = useState<DialerClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDialerActive, setIsDialerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notes, setNotes] = useState("");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [callDelay, setCallDelay] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    if (currentCall && dialerClients[currentIndex]?.callStatus === 'calling') {
      setDialerClients(prev => prev.map((dialerClient, i) =>
        i === currentIndex
          ? { ...dialerClient, twilioCallSid: currentCall.parameters.CallSid }
          : dialerClient
      ));
    }
  }, [currentCall, currentIndex, dialerClients]);

  useEffect(() => {
    if (open && clients.length > 0) {
      const initialClients = clients.map(client => ({
        client,
        callStatus: 'waiting' as CallStatus
      }));
      setDialerClients(initialClients);
      setCurrentIndex(0);
      setIsDialerActive(false);
      setIsPaused(false);
      setNotes("");
    }
  }, [open, clients]);

  const updateClientStatus = useCallback((index: number, status: CallStatus, notes?: string) => {
    setDialerClients(prev => prev.map((dialerClient, i) => 
      i === index 
        ? { ...dialerClient, callStatus: status, attemptTime: new Date(), notes: notes || dialerClient.notes }
        : dialerClient
    ));
  }, []);

  const moveToNextClient = useCallback(() => {
    if (currentIndex < dialerClients.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDialerActive(false);
      toast({
        title: "Dialer Completed",
        description: `All ${dialerClients.length} clients have been processed.`,
      });
    }
  }, [currentIndex, dialerClients.length, toast]);

  const handleCallEnd = useCallback((finalStatus: CallStatus) => {
    const currentDialerClient = dialerClients[currentIndex];
    if (!currentDialerClient) return;

    const outcomeMap: Partial<Record<CallStatus, "connected" | "no-answer" | "busy" | "failed" | "voicemail" | "declined" | "initiated">> = {
      'connected': 'connected',
      'completed': 'connected',
      'no-answer': 'no-answer',
      'busy': 'busy',
      'failed': 'failed',
    };
    const logOutcome = outcomeMap[finalStatus];

    if (logOutcome) {
      const callLog: Omit<CallLog, 'id'> = {
        clientId: currentDialerClient.client.id,
        clientName: currentDialerClient.client.name,
        phoneNumber: currentDialerClient.client.phone,
        startTime: new Date(Date.now() - callDuration * 1000),
        endTime: new Date(),
        duration: callDuration,
        outcome: logOutcome,
        notes: notes || `Dialer call - ${finalStatus}`,
        followUpRequired: finalStatus !== 'completed' && finalStatus !== 'connected',
        createdBy: 'current-user', // Replace with actual user
        tags: ['dialer'],
        twilioCallSid: currentDialerClient.twilioCallSid,
      };

      addCall(callLog);
      toast({ title: "Call Logged", description: `Call to ${currentDialerClient.client.name} ended with status: ${finalStatus}` });
    }

    updateClientStatus(currentIndex, finalStatus, notes);

    if (autoAdvance) {
      setTimeout(moveToNextClient, callDelay * 1000);
    } else if (!isCallInProgress) {
      // If not auto-advancing, but the call is over, still need to potentially move to the next one if the user wants.
      // For now, we do nothing and let the user manually click next.
    }
  }, [dialerClients, currentIndex, callDuration, notes, addCall, updateClientStatus, toast, autoAdvance, moveToNextClient, isCallInProgress]);

  useEffect(() => {
    // This effect handles the case where a call ends unexpectedly (e.g., the other party hangs up).
    if (callStatus === 'idle' && dialerClients[currentIndex]?.callStatus === 'calling') {
      handleCallEnd('failed');
    }
  }, [callStatus, currentIndex, dialerClients, handleCallEnd]);


  const makeNextCall = useCallback(async () => {
    if (currentIndex >= dialerClients.length || isPaused || isCallInProgress) {
      return;
    }

    const currentDialerClient = dialerClients[currentIndex];
    const currentClient = currentDialerClient.client;
    
    updateClientStatus(currentIndex, 'calling');
    setNotes("");

    await makeCall({
      phoneNumber: currentClient.phone,
      clientId: currentClient.id,
      clientName: currentClient.name,
    });
  }, [currentIndex, dialerClients, isPaused, isCallInProgress, makeCall, updateClientStatus]);

  useEffect(() => {
    if (isDialerActive && !isPaused && !isCallInProgress) {
      makeNextCall();
    }
  }, [isDialerActive, isPaused, isCallInProgress, currentIndex, makeNextCall]);

  const startDialer = () => {
    setIsDialerActive(true);
    setIsPaused(false);
  };

  const pauseDialer = () => {
    setIsPaused(true);
    if (isCallInProgress) {
      endCall();
    }
  };

  const stopDialer = () => {
    setIsDialerActive(false);
    if (isCallInProgress) {
      endCall();
    }
    onOpenChange(false);
  };

  const skipCurrentCall = () => {
    updateClientStatus(currentIndex, 'skipped');
    if (isCallInProgress) {
      endCall();
    } else {
      moveToNextClient();
    }
  };

  const markCallComplete = (outcome: 'connected' | 'no-answer' | 'busy' | 'failed') => {
    if (isCallInProgress) {
      endCall();
    }
    handleCallEnd(outcome);
  };

  const getStatusIcon = (status: CallStatus) => {
    switch (status) {
      case 'calling': return <Phone className="h-4 w-4 text-blue-500" />;
      case 'completed':
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no-answer': return <XCircle className="h-4 w-4 text-yellow-500" />;
      case 'busy': return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case 'calling': return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'connected': return 'bg-green-100 text-green-800';
      case 'no-answer': return 'bg-yellow-100 text-yellow-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCalls = dialerClients.filter(c => c.callStatus !== 'waiting' && c.callStatus !== 'calling').length;
  const progress = dialerClients.length > 0 ? (completedCalls / dialerClients.length) * 100 : 0;

  if (!open) return null;

  const currentDialerClient = dialerClients[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Live Call Dialer</span>
              <Badge variant="secondary">{dialerClients.length} clients</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">REAL CALLS</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Live call dialer to connect with multiple clients sequentially.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {completedCalls} of {dialerClients.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {showSettings && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-advance">Auto-advance to next client</Label>
                  <Switch
                    id="auto-advance"
                    checked={autoAdvance}
                    onCheckedChange={setAutoAdvance}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="call-delay">Delay between calls (seconds):</Label>
                  <input
                    id="call-delay"
                    type="number"
                    min="3"
                    max="60"
                    value={callDelay}
                    onChange={(e) => setCallDelay(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentDialerClient && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {currentDialerClient.client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{currentDialerClient.client.name}</h3>
                      <p className="text-gray-600">{currentDialerClient.client.phone}</p>
                      <p className="text-sm text-gray-500">
                        Client {currentIndex + 1} of {dialerClients.length}
                      </p>
                      <Badge className={`${getStatusColor(currentDialerClient.callStatus)} border text-sm font-medium mt-2`}>
                        {currentDialerClient.callStatus.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {isCallInProgress && (
                    <div className="flex items-center justify-center space-x-2 text-lg font-mono">
                      <Clock className="h-5 w-5" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="call-notes">Call Notes</Label>
                    <Textarea
                      id="call-notes"
                      placeholder="Add notes about this call..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      disabled={!isDialerActive}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isDialerActive ? (
                              <Button
                  onClick={startDialer}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={dialerClients.length === 0}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Calls
                </Button>
            ) : (
              <>
                <Button
                  onClick={pauseDialer}
                  size="lg"
                  variant="outline"
                >
                  {isPaused ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                
                <Button
                  onClick={skipCurrentCall}
                  size="lg"
                  variant="outline"
                  disabled={currentIndex >= dialerClients.length}
                >
                  <SkipForward className="h-5 w-5 mr-2" />
                  Skip
                </Button>
                
                <Button
                  onClick={() => markCallComplete('connected')}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={currentIndex >= dialerClients.length}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Connected
                </Button>
                
                <Button
                  onClick={() => markCallComplete('no-answer')}
                  size="lg"
                  variant="outline"
                  disabled={currentIndex >= dialerClients.length}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  No Answer
                </Button>
                
                <Button
                  onClick={stopDialer}
                  size="lg"
                  variant="destructive"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Client List */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-4">Client Queue</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dialerClients.map((dialerClient, index) => (
                  <div
                    key={dialerClient.client.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index === currentIndex ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(dialerClient.callStatus)}
                        <span className="font-medium">{dialerClient.client.name}</span>
                        <span className="text-sm text-gray-500">{dialerClient.client.phone}</span>
                      </div>
                      {dialerClient.attemptTime && (
                        <span className="text-xs text-gray-500">
                          {dialerClient.attemptTime.toLocaleTimeString()}
                        </span>
                      )}
                      {dialerClient.twilioCallSid && (
                        <Badge variant="outline" className="text-xs">
                          SID: {dialerClient.twilioCallSid.slice(-8)}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(dialerClient.callStatus)} text-xs`}>
                      {dialerClient.callStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
