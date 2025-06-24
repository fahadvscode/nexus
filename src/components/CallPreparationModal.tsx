
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Calendar, Clock, Tag, History, FileText } from "lucide-react";
import { Client } from "@/types/client";
import { useCallStore } from "@/hooks/useCallStore";
import { CallLog } from "@/types/call";

interface CallPreparationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onStartCall: (notes: string) => void;
}

export const CallPreparationModal = ({ open, onOpenChange, client, onStartCall }: CallPreparationModalProps) => {
  const [notes, setNotes] = useState("");
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { getCallsByClient } = useCallStore();

  useEffect(() => {
    if (client && open) {
      loadCallHistory();
    }
  }, [client, open]);

  const loadCallHistory = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const history = await getCallsByClient(client.id);
      setCallHistory(history.slice(0, 5)); // Show last 5 calls
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCall = () => {
    onStartCall(notes);
    setNotes("");
    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'voicemail': return 'bg-blue-100 text-blue-800';
      case 'no-answer': return 'bg-gray-100 text-gray-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Prepare Call - {client.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Prepare for your call by reviewing client history and adding pre-call notes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Phone:</span> {client.phone}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {client.email}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge variant="secondary" className="ml-2">{client.status}</Badge>
                </div>
                <div>
                  <span className="font-medium">Last Contact:</span> 
                  {client.last_contact ? new Date(client.last_contact).toLocaleDateString() : 'Never'}
                </div>
              </div>
              
              {client.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call History */}
          {callHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>Recent Call History</span>
                  {isLoading && <span className="text-xs text-gray-500">(Loading...)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {call.startTime.toLocaleDateString()}
                          </span>
                        </div>
                        {call.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {formatDuration(call.duration)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge className={`text-xs ${getOutcomeColor(call.outcome)}`}>
                        {call.outcome.replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Call Preparation Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes about what you want to discuss in this call..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={handleStartCall} className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Start Call
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
