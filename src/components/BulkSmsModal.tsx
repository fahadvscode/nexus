import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  phone: string;
  contact_name?: string;
}

interface BulkSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedClients?: Client[];
}

interface SmsResult {
  to: string;
  success: boolean;
  error?: string;
  clientName: string;
}

export const BulkSmsModal = ({ isOpen, onClose, preSelectedClients = [] }: BulkSmsModalProps) => {
  const [message, setMessage] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendResults, setSendResults] = useState<SmsResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const characterLimit = 160;
  const remainingChars = characterLimit - message.length;

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
      // Pre-select any provided clients
      if (preSelectedClients.length > 0) {
        setSelectedClientIds(new Set(preSelectedClients.map(c => c.id)));
      }
    }
  }, [isOpen, preSelectedClients]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('id, name, phone, contact_name')
        .not('phone', 'is', null)
        .neq('phone', '');

      if (error) throw error;

      setClients(clientData || []);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast({
        title: "Failed to Load Clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClientIds);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClientIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.size === clients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleSendBulkSms = async () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (selectedClientIds.size === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one client to send SMS to.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendResults([]);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Prepare recipients data
      const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
      const phoneNumbers = selectedClients.map(c => c.phone);
      const clientNames = selectedClients.map(c => c.name || c.contact_name || 'Unknown');

      console.log(`📱 Sending bulk SMS to ${selectedClients.length} clients`);
      
      // Call Supabase Edge Function
      const response = await fetch(`https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumbers,
          message: message.trim(),
          clientName: 'Bulk SMS Campaign',
          isBulk: true,
          clientIds: Array.from(selectedClientIds)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk SMS');
      }

      const result = await response.json();
      
      if (result.success) {
        setSendResults(result.results || []);
        setShowResults(true);
        
        toast({
          title: "Bulk SMS Completed",
          description: `${result.summary.successful} sent, ${result.summary.failed} failed`,
        });
        
        console.log('✅ Bulk SMS completed:', result);
      } else {
        throw new Error(result.error || 'Bulk SMS sending failed');
      }

    } catch (error: any) {
      console.error('❌ Bulk SMS sending failed:', error);
      toast({
        title: "Bulk SMS Failed",
        description: error.message || "Failed to send bulk SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage("");
      setSelectedClientIds(new Set());
      setSendResults([]);
      setShowResults(false);
      onClose();
    }
  };

  const selectedCount = selectedClientIds.size;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Send Bulk SMS</span>
          </DialogTitle>
          <DialogDescription>
            Send a text message to multiple clients at once
          </DialogDescription>
        </DialogHeader>
        
        {showResults ? (
          // Results View
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{sendResults.length} Recipients</span>
              </Badge>
              <Badge variant="default" className="flex items-center space-x-1 bg-green-500">
                <CheckCircle2 className="h-3 w-3" />
                <span>{sendResults.filter(r => r.success).length} Sent</span>
              </Badge>
              {sendResults.filter(r => !r.success).length > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>{sendResults.filter(r => !r.success).length} Failed</span>
                </Badge>
              )}
            </div>
            
            <ScrollArea className="h-64 border rounded p-4">
              <div className="space-y-2">
                {sendResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{result.clientName}</span>
                      <span className="text-sm text-gray-500">{result.to}</span>
                    </div>
                    {!result.success && result.error && (
                      <span className="text-sm text-red-500 truncate max-w-48">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          // Compose View
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="bulk-message">Message</Label>
                <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : remainingChars < 20 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {remainingChars} characters remaining
                </span>
              </div>
              <Textarea
                id="bulk-message"
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                className="min-h-[100px] resize-none"
                maxLength={320}
              />
              {message.length > characterLimit && (
                <p className="text-sm text-orange-600">
                  This message will be sent as multiple SMS messages.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recipients ({selectedCount} selected)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={isLoading || isSending}
                >
                  {selectedClientIds.size === clients.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <ScrollArea className="h-48 border rounded p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading clients...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={selectedClientIds.has(client.id)}
                          onCheckedChange={() => toggleClientSelection(client.id)}
                          disabled={isSending}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">
                            {client.contact_name && `${client.contact_name} • `}
                            {client.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                    {clients.length === 0 && !isLoading && (
                      <div className="text-center py-8 text-gray-500">
                        No clients with phone numbers found
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkSms}
                disabled={isSending || !message.trim() || selectedCount === 0}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending to {selectedCount}...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedCount} clients
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 