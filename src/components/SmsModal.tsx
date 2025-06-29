import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  phoneNumber?: string;
  clientId?: string;
}

export const SmsModal = ({ isOpen, onClose, clientName, phoneNumber, clientId }: SmsModalProps) => {
  const [message, setMessage] = useState("");
  const [customPhoneNumber, setCustomPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Update phone number when modal opens with new data
  useEffect(() => {
    if (phoneNumber) {
      setCustomPhoneNumber(phoneNumber);
    }
  }, [phoneNumber, isOpen]);

  const characterLimit = 160;
  const remainingChars = characterLimit - message.length;

  const handleSendSms = async () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (!customPhoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      console.log('📱 Sending SMS to:', customPhoneNumber);
      
      // Call Supabase Edge Function
      const response = await fetch(`https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customPhoneNumber,
          message: message.trim(),
          clientName: clientName || 'Unknown Client',
          isBulk: false,
          clientIds: clientId ? [clientId] : []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "SMS Sent Successfully",
          description: `Message sent to ${clientName || customPhoneNumber}`,
        });
        
        console.log('✅ SMS sent successfully:', result);
        
        // Reset form and close modal
        setMessage("");
        onClose();
      } else {
        throw new Error(result.error || 'SMS sending failed');
      }

    } catch (error: any) {
      console.error('❌ SMS sending failed:', error);
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage("");
      setCustomPhoneNumber("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Send SMS</span>
          </DialogTitle>
          <DialogDescription>
            Send a text message to {clientName || "the client"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {phoneNumber ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Sending to</Label>
              <Input
                id="phone"
                type="tel"
                value={customPhoneNumber}
                readOnly
                className="bg-gray-50 text-gray-700"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={customPhoneNumber}
                onChange={(e) => setCustomPhoneNumber(e.target.value)}
                disabled={isSending}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="message">Message</Label>
              <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : remainingChars < 20 ? 'text-orange-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              className="min-h-[100px] resize-none"
              maxLength={320} // Allow a bit over for multi-part messages
            />
            {message.length > characterLimit && (
              <p className="text-sm text-orange-600">
                This message will be sent as multiple SMS messages.
              </p>
            )}
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
              onClick={handleSendSms}
              disabled={isSending || !message.trim() || !customPhoneNumber.trim()}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 