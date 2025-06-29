import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  FileText, 
  Calendar,
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Clock,
  User,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommunicationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

interface CallRecording {
  id: string;
  recording_sid: string;
  call_sid: string;
  recording_url: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  call_log: {
    outcome: string;
    notes: string;
    start_time: string;
    duration: number;
  };
}

interface CommunicationItem {
  id: string;
  type: 'call' | 'sms' | 'email' | 'note' | 'meeting';
  direction: 'inbound' | 'outbound' | 'internal';
  subject?: string;
  content?: string;
  status?: string;
  metadata?: any;
  created_at: string;
  created_by?: string;
}

interface SmsLog {
  id: string;
  to_number: string;
  from_number: string;
  message_body: string;
  status: string;
  direction: string;
  created_at: string;
  twilio_message_sid: string;
}

export const CommunicationPanel = ({ open, onOpenChange, client }: CommunicationPanelProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  
  // Data states
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationItem[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (open && client) {
      loadCommunicationData();
    }
  }, [open, client]);

  const loadCommunicationData = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      // Load call recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('call_recordings')
        .select(`
          *,
          call_log:call_logs(outcome, notes, start_time, duration)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (recordingsError) {
        console.error('Error loading recordings:', recordingsError);
      } else {
        setCallRecordings(recordings || []);
      }

      // Load communication history
      const { data: history, error: historyError } = await supabase
        .from('communication_history')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error loading communication history:', historyError);
      } else {
        setCommunicationHistory(history || []);
      }

      // Load SMS logs
      const { data: sms, error: smsError } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (smsError) {
        console.error('Error loading SMS logs:', smsError);
      } else {
        setSmsLogs(sms || []);
      }

    } catch (error) {
      console.error('Error loading communication data:', error);
      toast({
        title: "Error",
        description: "Failed to load communication history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const playRecording = async (recording: CallRecording) => {
    try {
      // Stop any currently playing audio
      if (currentlyPlaying && audioElements[currentlyPlaying]) {
        audioElements[currentlyPlaying].pause();
        audioElements[currentlyPlaying].currentTime = 0;
      }

      // Create or get audio element
      let audio = audioElements[recording.id];
      if (!audio) {
        audio = new Audio();
        
        // Add Twilio authentication to the recording URL
        const response = await supabase.functions.invoke('get-twilio-token');
        if (response.error) throw new Error('Failed to get Twilio token');
        
        // Use the recording URL with authentication
        audio.src = recording.recording_url;
        audio.preload = 'metadata';
        
        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
          console.log('Audio loaded, duration:', audio.duration);
        });
        
        audio.addEventListener('timeupdate', () => {
          const progress = (audio.currentTime / audio.duration) * 100;
          setPlaybackProgress(prev => ({ ...prev, [recording.id]: progress }));
        });
        
        audio.addEventListener('ended', () => {
          setCurrentlyPlaying(null);
          setPlaybackProgress(prev => ({ ...prev, [recording.id]: 0 }));
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          toast({
            title: "Playback Error",
            description: "Unable to play recording. Please try again.",
            variant: "destructive",
          });
          setCurrentlyPlaying(null);
        });

        setAudioElements(prev => ({ ...prev, [recording.id]: audio }));
      }

      // Play the audio
      await audio.play();
      setCurrentlyPlaying(recording.id);
      
      toast({
        title: "Playing Recording",
        description: `Playing call recording from ${new Date(recording.created_at).toLocaleDateString()}`,
      });

    } catch (error) {
      console.error('Error playing recording:', error);
      toast({
        title: "Playback Error",
        description: "Unable to play recording. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = (recordingId: string) => {
    const audio = audioElements[recordingId];
    if (audio) {
      audio.pause();
      setCurrentlyPlaying(null);
    }
  };

  const downloadRecording = async (recording: CallRecording) => {
    try {
      const response = await fetch(recording.recording_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-recording-${recording.call_sid}-${new Date(recording.created_at).toISOString().split('T')[0]}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Call recording download has started.",
      });
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast({
        title: "Download Error",
        description: "Unable to download recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed':
      case 'undelivered': return 'bg-red-100 text-red-800';
      case 'pending':
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Communication History - {client.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Communications</TabsTrigger>
              <TabsTrigger value="recordings">Call Recordings</TabsTrigger>
              <TabsTrigger value="sms">SMS Messages</TabsTrigger>
              <TabsTrigger value="emails">Emails & Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8">Loading communication history...</div>
                ) : (
                  <div className="space-y-3">
                    {/* Combined timeline view */}
                    {[...callRecordings, ...smsLogs, ...communicationHistory]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((item, index) => (
                        <Card key={`${item.id}-${index}`} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {getTypeIcon('call' in item ? 'call' : 'type' in item ? item.type : 'sms')}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium">
                                      {'call_log' in item ? 'Call Recording' : 
                                       'message_body' in item ? 'SMS Message' : 
                                       item.subject || 'Communication'}
                                    </span>
                                    <Badge className={getStatusColor(item.status || 'completed')}>
                                      {item.status || 'completed'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {new Date(item.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recordings" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {callRecordings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No call recordings found for this client.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callRecordings.map((recording) => (
                      <Card key={recording.id} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>Call Recording</span>
                              <Badge className={getStatusColor(recording.status)}>
                                {recording.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{formatDuration(recording.duration_seconds)}</span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-gray-600">
                            <p><strong>Date:</strong> {new Date(recording.created_at).toLocaleString()}</p>
                            {recording.call_log && (
                              <>
                                <p><strong>Outcome:</strong> {recording.call_log.outcome}</p>
                                {recording.call_log.notes && (
                                  <p><strong>Notes:</strong> {recording.call_log.notes}</p>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Audio Player Controls */}
                          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                            <Button
                              size="sm"
                              variant={currentlyPlaying === recording.id ? "secondary" : "default"}
                              onClick={() => 
                                currentlyPlaying === recording.id 
                                  ? pauseRecording(recording.id)
                                  : playRecording(recording)
                              }
                            >
                              {currentlyPlaying === recording.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${playbackProgress[recording.id] || 0}%` }}
                                />
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadRecording(recording)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Recording ID: {recording.recording_sid.slice(-8)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {smsLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No SMS messages found for this client.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsLogs.map((sms) => (
                      <Card key={sms.id} className={`border-l-4 ${
                        sms.direction === 'outbound' ? 'border-l-blue-500' : 'border-l-purple-500'
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4" />
                              <span className="font-medium">
                                {sms.direction === 'outbound' ? 'Sent SMS' : 'Received SMS'}
                              </span>
                              <Badge className={getStatusColor(sms.status)}>
                                {sms.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(sms.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm bg-gray-50 p-3 rounded-lg">
                            {sms.message_body}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {sms.direction === 'outbound' ? `To: ${sms.to_number}` : `From: ${sms.from_number}`}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {communicationHistory.filter(item => ['email', 'note'].includes(item.type)).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No emails or notes found for this client.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communicationHistory
                      .filter(item => ['email', 'note'].includes(item.type))
                      .map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(item.type)}
                                <span className="font-medium">
                                  {item.subject || (item.type === 'email' ? 'Email' : 'Note')}
                                </span>
                                {item.status && (
                                  <Badge className={getStatusColor(item.status)}>
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                            {item.content && (
                              <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                {item.content}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 