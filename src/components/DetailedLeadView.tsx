import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  Building2,
  Clock,
  MessageSquare,
  PhoneCall,
  Edit,
  Send,
  Play,
  Pause,
  Download,
  Volume2,
  User,
  Briefcase,
  Hash,
  CalendarDays,
  Activity,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { Client } from "@/types/client";
import { CallLog } from "@/types/call";
import { callStore } from "@/store/callStore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DetailedLeadViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

// Mock activity data - in a real app, this would come from the database
interface Activity {
  id: string;
  type: 'call' | 'email' | 'sms' | 'meeting' | 'note';
  title: string;
  description: string;
  date: Date;
  outcome?: string;
  duration?: number;
  createdBy: string;
}

export const DetailedLeadView = ({ open, onOpenChange, client }: DetailedLeadViewProps) => {
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contact");
  const { toast } = useToast();

  useEffect(() => {
    if (client && open) {
      loadClientData();
    }
  }, [client, open]);

  const loadClientData = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      // Load call history
      const calls = callStore.getCallsByClient(client.id);
      setCallHistory(calls);
      
      // Load activities (mock data for now - in real app, this would be from database)
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'call',
          title: 'Outbound Call',
          description: 'Discussed project requirements and budget',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          outcome: 'connected',
          duration: 840,
          createdBy: 'John Doe'
        },
        {
          id: '2',
          type: 'email',
          title: 'Follow-up Email Sent',
          description: 'Sent project proposal and timeline',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdBy: 'John Doe'
        },
        {
          id: '3',
          type: 'note',
          title: 'Internal Note',
          description: 'High-value prospect, decision maker confirmed',
          date: new Date(Date.now() - 3 * 60 * 60 * 1000),
          createdBy: 'John Doe'
        }
      ];
      setActivities(mockActivities);
      
    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim() || !client) return;
    
    try {
      // In a real app, this would send SMS via Twilio
      console.log('Sending SMS to:', client.phone, 'Message:', smsMessage);
      
      // Add activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: 'sms',
        title: 'SMS Sent',
        description: smsMessage,
        date: new Date(),
        createdBy: 'Current User'
      };
      setActivities(prev => [newActivity, ...prev]);
      setSmsMessage("");
      
      toast({
        title: "SMS Sent",
        description: "Message sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim() || !client) return;
    
    try {
      // In a real app, this would send email
      console.log('Sending email to:', client.email, 'Subject:', emailSubject, 'Message:', emailMessage);
      
      // Add activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: 'email',
        title: emailSubject || 'Email Sent',
        description: emailMessage,
        date: new Date(),
        createdBy: 'Current User'
      };
      setActivities(prev => [newActivity, ...prev]);
      setEmailSubject("");
      setEmailMessage("");
      
      toast({
        title: "Email Sent",
        description: "Email sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = () => {
    if (!internalNote.trim()) return;
    
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'note',
      title: 'Internal Note',
      description: internalNote,
      date: new Date(),
      createdBy: 'Current User'
    };
    setActivities(prev => [newActivity, ...prev]);
    setInternalNote("");
    
    toast({
      title: "Note Added",
      description: "Internal note saved successfully",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <Edit className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-100';
      case 'email': return 'text-purple-600 bg-purple-100';
      case 'sms': return 'text-green-600 bg-green-100';
      case 'meeting': return 'text-orange-600 bg-orange-100';
      case 'note': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{client.name}</DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${
                    client.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    client.status === 'lead' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    client.status === 'potential' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  } border`}>
                    {client.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">ID: {client.id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden px-6 py-4">
                <TabsContent value="contact" className="mt-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5" />
                            <span>Contact Information</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-medium text-gray-500">First Name</label>
                              <p className="text-base font-medium">{client.name.split(' ')[0]}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Last Name</label>
                              <p className="text-base font-medium">{client.name.split(' ').slice(1).join(' ')}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Email</label>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <p className="text-base">{client.email || 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Phone</label>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <p className="text-base">{client.phone}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className="text-base">Not provided</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Contact Source</label>
                              <p className="text-base">{client.source || 'Not specified'}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-gray-500">Address</label>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <p className="text-base">{client.address || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tags and Categories */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Tag className="h-5 w-5" />
                            <span>Tags & Categories</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {client.tags && client.tags.length > 0 ? (
                              client.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">No tags assigned</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Timeline */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>Timeline</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-xs text-gray-500">{format(new Date(client.created_at), 'PPp')}</p>
                              </div>
                            </div>
                            {client.last_contact && (
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-medium">Last Contact</p>
                                  <p className="text-xs text-gray-500">{format(new Date(client.last_contact), 'PPp')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="company" className="mt-0 h-full">
                  <ScrollArea className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5" />
                          <span>Company Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Company Name</label>
                            <p className="text-base">Not provided</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Industry</label>
                            <p className="text-base">Not provided</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Company Size</label>
                            <p className="text-base">Not provided</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Website</label>
                            <p className="text-base">Not provided</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="activity" className="mt-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {/* Activity Stats */}
                      <div className="grid grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{callHistory.length}</div>
                            <div className="text-sm text-gray-500">Total Calls</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {callHistory.filter(c => c.outcome === 'connected').length}
                            </div>
                            <div className="text-sm text-gray-500">Connected</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {activities.filter(a => a.type === 'email').length}
                            </div>
                            <div className="text-sm text-gray-500">Emails</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {activities.filter(a => a.type === 'meeting').length}
                            </div>
                            <div className="text-sm text-gray-500">Meetings</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Activity Timeline */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Activity className="h-5 w-5" />
                            <span>Activity Timeline</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {activities.map((activity) => (
                              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{activity.title}</h4>
                                    <span className="text-xs text-gray-500">
                                      {format(activity.date, 'MMM d, h:mm a')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  {activity.duration && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Duration: {formatDuration(activity.duration)}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">by {activity.createdBy}</p>
                                </div>
                              </div>
                            ))}
                            
                            {activities.length === 0 && (
                              <div className="text-center py-8">
                                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">No activities yet</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="communication" className="mt-0 h-full">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      {/* Communication Actions */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <MessageSquare className="h-5 w-5" />
                              <span>Send SMS</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>To:</span>
                              <span className="font-medium">{client.phone}</span>
                            </div>
                            <Textarea
                              placeholder="Type your message..."
                              value={smsMessage}
                              onChange={(e) => setSmsMessage(e.target.value)}
                              rows={3}
                            />
                            <Button 
                              onClick={handleSendSMS} 
                              disabled={!smsMessage.trim()}
                              size="sm"
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send SMS
                            </Button>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Mail className="h-5 w-5" />
                              <span>Send Email</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>To:</span>
                              <span className="font-medium">{client.email || 'No email provided'}</span>
                            </div>
                            <Input
                              placeholder="Subject"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                            />
                            <Textarea
                              placeholder="Email message..."
                              value={emailMessage}
                              onChange={(e) => setEmailMessage(e.target.value)}
                              rows={2}
                            />
                            <Button 
                              onClick={handleSendEmail} 
                              disabled={!emailMessage.trim() || !client.email}
                              size="sm"
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Internal Notes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Edit className="h-5 w-5" />
                            <span>Add Internal Note</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Textarea
                            placeholder="Add internal note or comment..."
                            value={internalNote}
                            onChange={(e) => setInternalNote(e.target.value)}
                            rows={3}
                          />
                          <Button 
                            onClick={handleAddNote} 
                            disabled={!internalNote.trim()}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Call History */}
                      {callHistory.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <PhoneCall className="h-5 w-5" />
                              <span>Call History</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {callHistory.map((call) => (
                                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${
                                      call.outcome === 'connected' ? 'bg-green-100 text-green-600' :
                                      call.outcome === 'voicemail' ? 'bg-blue-100 text-blue-600' :
                                      'bg-red-100 text-red-600'
                                    }`}>
                                      <PhoneCall className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{call.outcome.toUpperCase()}</p>
                                      <p className="text-sm text-gray-500">
                                        {format(call.startTime, 'MMM d, h:mm a')}
                                        {call.duration && ` • ${formatDuration(call.duration)}`}
                                      </p>
                                      {call.notes && (
                                        <p className="text-sm text-gray-600 mt-1">{call.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  {call.twilioCallSid && (
                                    <div className="flex items-center space-x-2">
                                      <Button variant="ghost" size="sm">
                                        <Play className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 