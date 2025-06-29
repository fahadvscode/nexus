import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  Tag,
  FileText,
  Bell,
  CalendarPlus,
  Mail,
  MapPin,
  User,
  Eye
} from "lucide-react";
import { useTwilioStore } from "@/hooks/useTwilioStore";
import { Client } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { useCallStore } from "@/hooks/useCallStore";
import { CallLog } from "@/types/call";
import { TagsNotesModal } from "./TagsNotesModal";
import { ClientEventModal } from "./calendar/ClientEventModal";
import { QuickReminderModal } from "./calendar/QuickReminderModal";
import { EmailModal } from "./EmailModal";

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
  const [callDelay, setCallDelay] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [showClientCard, setShowClientCard] = useState(true);
  
  // Modal states for quick actions
  const [tagsNotesClient, setTagsNotesClient] = useState<Client | null>(null);
  const [schedulingClient, setSchedulingClient] = useState<Client | null>(null);
  const [reminderClient, setReminderClient] = useState<Client | null>(null);
  const [emailingClient, setEmailingClient] = useState<Client | null>(null);
  
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
      // Clear any existing notes for the next client
      setNotes("");
    } else {
      setIsDialerActive(false);
      toast({
        title: "Dialer Completed",
        description: `All ${dialerClients.length} clients have been processed.`,
      });
      onCallComplete(); // Notify parent component
    }
  }, [currentIndex, dialerClients.length, toast, onCallComplete]);

  // Handle quick actions
  const handleTagsNotes = (client: Client) => {
    setTagsNotesClient(client);
  };

  const handleScheduleEvent = (client: Client) => {
    setSchedulingClient(client);
  };

  const handleSetReminder = (client: Client) => {
    setReminderClient(client);
  };

  const handleSendEmail = (client: Client) => {
    setEmailingClient(client);
  };

  const refreshClientData = () => {
    // This would typically refresh the client data from the store
    // For now, we'll just show a success message
    toast({
      title: "Client Updated",
      description: "Client information has been updated successfully.",
    });
  };

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
    
    // Note: Movement to next client is now handled by the specific action functions
    // (terminateCurrentCall, markCallComplete, skipCurrentCall) to give better control
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
    
    // Skip if this client has already been processed
    if (!currentDialerClient || currentDialerClient.callStatus !== 'waiting') {
      return;
    }
    
    const currentClient = currentDialerClient.client;
    
    try {
      updateClientStatus(currentIndex, 'calling');
      setNotes("");

      await makeCall({
        phoneNumber: currentClient.phone,
        clientId: currentClient.id,
        clientName: currentClient.name,
      });
      
      toast({
        title: "Calling",
        description: `Calling ${currentClient.name} at ${currentClient.phone}`,
      });
    } catch (error) {
      console.error('Failed to make call:', error);
      updateClientStatus(currentIndex, 'failed');
      toast({
        title: "Call Failed",
        description: `Failed to call ${currentClient.name}. Moving to next client.`,
        variant: "destructive",
      });
      // Auto-advance to next client on failure
      setTimeout(() => {
        moveToNextClient();
      }, 1000);
    }
  }, [currentIndex, dialerClients, isPaused, isCallInProgress, makeCall, updateClientStatus, toast, moveToNextClient]);

  useEffect(() => {
    if (isDialerActive && !isPaused && !isCallInProgress && currentIndex < dialerClients.length) {
      const currentClient = dialerClients[currentIndex];
      // Only make a call if the current client is waiting (not already processed)
      if (currentClient && currentClient.callStatus === 'waiting') {
        const timer = setTimeout(() => {
          makeNextCall();
        }, callDelay * 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isDialerActive, isPaused, isCallInProgress, currentIndex, makeNextCall, dialerClients, callDelay]);

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
    if (isCallInProgress) {
      endCall();
      toast({
        title: "Call Skipped",
        description: "Call terminated and moving to next client.",
      });
    } else {
      toast({
        title: "Client Skipped",
        description: "Moving to next client without calling.",
      });
    }
    
    updateClientStatus(currentIndex, 'skipped');
    
    // Move to next client automatically
    setTimeout(() => {
      moveToNextClient();
    }, 1000); // Short delay to allow call to properly terminate if needed
  };

  const terminateCurrentCall = () => {
    if (isCallInProgress) {
      endCall();
      toast({
        title: "Call Ended",
        description: "Call has been terminated and moving to next client.",
      });
    }
    
    // Log the terminated call
    handleCallEnd('failed');
    
    // Move to next client automatically
    setTimeout(() => {
      moveToNextClient();
    }, 1000); // Short delay to allow call to properly terminate
  };

  // Utility function to blur phone number
  const blurPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.length <= 4) return phoneNumber;
    const lastFour = phoneNumber.slice(-4);
    const blurred = phoneNumber.slice(0, -4).replace(/\d/g, '●');
    return blurred + lastFour;
  };

  const markCallComplete = (outcome: 'connected' | 'no-answer' | 'busy' | 'failed') => {
    if (isCallInProgress) {
      endCall();
    }
    
    toast({
      title: "Call Completed",
      description: `Call marked as ${outcome} and moving to next client.`,
    });
    
    handleCallEnd(outcome);
    
    // Move to next client automatically
    setTimeout(() => {
      moveToNextClient();
    }, 1000); // Short delay to allow call to properly terminate
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

  // Keyboard shortcuts for smooth operation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when dialer is active and modal is open
      if (!open || !isDialerActive || currentIndex >= dialerClients.length) return;
      
      // Prevent shortcuts when user is typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      
      switch (key) {
        case 's':
          event.preventDefault();
          skipCurrentCall();
          break;
        case 'e':
          if (isCallInProgress) {
            event.preventDefault();
            terminateCurrentCall();
          }
          break;
        case 'c':
          event.preventDefault();
          markCallComplete('connected');
          break;
        case 'n':
          event.preventDefault();
          markCallComplete('no-answer');
          break;
        case 'b':
          event.preventDefault();
          markCallComplete('busy');
          break;
        case 'f':
          event.preventDefault();
          markCallComplete('failed');
          break;
        case 'p':
          event.preventDefault();
          pauseDialer();
          break;
        case 'escape':
          event.preventDefault();
          stopDialer();
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [open, isDialerActive, currentIndex, dialerClients.length, isCallInProgress, skipCurrentCall, terminateCurrentCall, markCallComplete, pauseDialer, stopDialer]);

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
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentIndex + 1} / {dialerClients.length}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Completed: <span className="font-semibold text-green-600">{completedCalls}</span></div>
                      <div>Remaining: <span className="font-semibold text-orange-600">{dialerClients.length - completedCalls - (isCallInProgress ? 1 : 0)}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{Math.round(progress)}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
                <Progress value={progress} className="h-3 bg-gray-200" />
                {isDialerActive && (
                  <div className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 animate-pulse">
                      <Clock className="h-3 w-3 mr-1" />
                      Dialer Active
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dialer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-advance">Auto-advance to next client</Label>
                  <Switch
                    id="auto-advance"
                    checked={autoAdvance}
                    onCheckedChange={setAutoAdvance}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-client-card">Show client details card</Label>
                  <Switch
                    id="show-client-card"
                    checked={showClientCard}
                    onCheckedChange={setShowClientCard}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="call-delay">Delay between calls (seconds):</Label>
                  <input
                    id="call-delay"
                    type="number"
                    min="1"
                    max="30"
                    value={callDelay}
                    onChange={(e) => setCallDelay(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">Recommended: 2-5 seconds</span>
                </div>
              </CardContent>
            </Card>
          )}

          {currentDialerClient && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Phone className="h-5 w-5" />
                      <span>Current Call</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClientCard(!showClientCard)}
                    >
                      <Eye className="h-4 w-4" />
                      {showClientCard ? 'Hide' : 'Show'} Details
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {currentDialerClient.client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{currentDialerClient.client.name}</h3>
                      <p className="text-gray-600 font-mono">
                        {currentDialerClient.callStatus === 'calling' || isCallInProgress ? 
                          blurPhoneNumber(currentDialerClient.client.phone) : 
                          currentDialerClient.client.phone
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        Client {currentIndex + 1} of {dialerClients.length}
                      </p>
                      <Badge className={`${getStatusColor(currentDialerClient.callStatus)} border text-sm font-medium mt-2`}>
                        {currentDialerClient.callStatus.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {isCallInProgress && (
                    <div className="flex items-center justify-center space-x-2 text-lg font-mono bg-green-50 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-semibold">{formatDuration(callDuration)}</span>
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
                </CardContent>
              </Card>

              {/* Client Details Card */}
              {showClientCard && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Client Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Client Information */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">{currentDialerClient.client.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-gray-600">{currentDialerClient.client.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {currentDialerClient.client.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        {currentDialerClient.client.source && (
                          <Badge variant="secondary" className="text-xs">
                            {currentDialerClient.client.source}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                        <Tag className="h-4 w-4" />
                        <span>Tags</span>
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {(currentDialerClient.client.tags && currentDialerClient.client.tags.length > 0) ? (
                          currentDialerClient.client.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {currentDialerClient.client.notes && (
                      <div>
                        <Label className="text-sm font-medium flex items-center space-x-2 mb-2">
                          <FileText className="h-4 w-4" />
                          <span>Client Notes</span>
                        </Label>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                          {currentDialerClient.client.notes}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Quick Actions */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Quick Actions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagsNotes(currentDialerClient.client)}
                          className="hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          Tags & Notes
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleEvent(currentDialerClient.client)}
                          className="hover:bg-purple-50 hover:text-purple-700"
                        >
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetReminder(currentDialerClient.client)}
                          className="hover:bg-orange-50 hover:text-orange-700"
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Reminder
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(currentDialerClient.client)}
                          className="hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Enhanced Controls */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {!isDialerActive ? (
                  <div className="flex justify-center">
                    <Button
                      onClick={startDialer}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={dialerClients.length === 0}
                    >
                      <Play className="h-6 w-6 mr-3" />
                      Start Bulk Dialer
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Primary Action Buttons */}
                    <div className="flex justify-center space-x-3">
                      <Button
                        onClick={skipCurrentCall}
                        size="lg"
                        variant="outline"
                        className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800 px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={currentIndex >= dialerClients.length}
                        title="Skip this client and move to next (Shortcut: S)"
                      >
                        <SkipForward className="h-5 w-5 mr-2" />
                        Skip Client
                      </Button>
                      
                      {isCallInProgress && (
                        <Button
                          onClick={terminateCurrentCall}
                          size="lg"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          title="End current call and move to next (Shortcut: E)"
                        >
                          <PhoneOff className="h-5 w-5 mr-2" />
                          End Call
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => markCallComplete('connected')}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={currentIndex >= dialerClients.length}
                        title="Mark as connected and move to next (Shortcut: C)"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Connected
                      </Button>
                    </div>

                    {/* Secondary Action Buttons */}
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => markCallComplete('no-answer')}
                        size="sm"
                        variant="outline"
                        className="bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-800"
                        disabled={currentIndex >= dialerClients.length}
                        title="Mark as no answer (Shortcut: N)"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        No Answer
                      </Button>
                      
                      <Button
                        onClick={() => markCallComplete('busy')}
                        size="sm"
                        variant="outline"
                        className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800"
                        disabled={currentIndex >= dialerClients.length}
                        title="Mark as busy (Shortcut: B)"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Busy
                      </Button>
                      
                      <Button
                        onClick={() => markCallComplete('failed')}
                        size="sm"
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100 border-red-300 text-red-800"
                        disabled={currentIndex >= dialerClients.length}
                        title="Mark as failed (Shortcut: F)"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Failed
                      </Button>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex justify-center space-x-2 pt-2 border-t">
                      <Button
                        onClick={pauseDialer}
                        size="sm"
                        variant="outline"
                        title="Pause/Resume dialer (Shortcut: P)"
                      >
                        {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      
                      <Button
                        onClick={stopDialer}
                        size="sm"
                        variant="destructive"
                        title="Stop dialer and close (Shortcut: Escape)"
                      >
                        <PhoneOff className="h-4 w-4 mr-1" />
                        Stop Dialer
                      </Button>
                    </div>

                    {/* Keyboard Shortcuts Info */}
                    <div className="text-center text-xs text-gray-500 pt-2 border-t">
                      <p>Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded">S</kbd> Skip • <kbd className="px-1 py-0.5 bg-gray-200 rounded">E</kbd> End Call • <kbd className="px-1 py-0.5 bg-gray-200 rounded">C</kbd> Connected • <kbd className="px-1 py-0.5 bg-gray-200 rounded">N</kbd> No Answer</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Client Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Client Queue</span>
                <Badge variant="secondary" className="text-xs">
                  {dialerClients.filter(c => c.callStatus === 'waiting').length} waiting
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dialerClients.map((dialerClient, index) => {
                  const isCurrent = index === currentIndex;
                  const isNext = index === currentIndex + 1;
                  const isPrevious = index < currentIndex;
                  
                  return (
                    <div
                      key={dialerClient.client.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                        isCurrent 
                          ? 'bg-blue-50 border-blue-300 shadow-md' 
                          : isNext 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : isPrevious 
                              ? 'bg-gray-50 border-gray-200 opacity-75' 
                              : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrent 
                              ? 'bg-blue-500 text-white' 
                              : isNext 
                                ? 'bg-yellow-500 text-white' 
                                : isPrevious 
                                  ? 'bg-gray-400 text-white' 
                                  : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          {getStatusIcon(dialerClient.callStatus)}
                          <span className={`font-medium ${isCurrent ? 'text-blue-800' : isNext ? 'text-yellow-800' : ''}`}>
                            {dialerClient.client.name}
                          </span>
                          <span className="text-sm text-gray-500 font-mono">
                            {dialerClient.callStatus === 'calling' || (index === currentIndex && isCallInProgress) ? 
                              blurPhoneNumber(dialerClient.client.phone) : 
                              dialerClient.client.phone
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs animate-pulse">
                              CURRENT
                            </Badge>
                          )}
                          {isNext && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              NEXT
                            </Badge>
                          )}
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
                      </div>
                      <Badge className={`${getStatusColor(dialerClient.callStatus)} text-xs`}>
                        {dialerClient.callStatus.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Quick Action Modals */}
      <TagsNotesModal
        isOpen={!!tagsNotesClient}
        onClose={() => setTagsNotesClient(null)}
        client={tagsNotesClient!}
        onUpdate={() => {
          refreshClientData();
          setTagsNotesClient(null);
        }}
      />

      <ClientEventModal
        open={!!schedulingClient}
        onOpenChange={(isOpen) => !isOpen && setSchedulingClient(null)}
        client={schedulingClient}
      />

      <QuickReminderModal
        open={!!reminderClient}
        onOpenChange={(isOpen) => !isOpen && setReminderClient(null)}
        client={reminderClient}
      />

      <EmailModal
        open={!!emailingClient}
        onOpenChange={(isOpen) => !isOpen && setEmailingClient(null)}
        client={emailingClient}
      />
    </Dialog>
  );
};
