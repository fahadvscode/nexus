import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const QuickSms = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const characterLimit = 160;
  const remainingChars = characterLimit - message.length;

  const handleSendSms = async () => {
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhoneNumber.trim()) {
      toast({
        title: "No Number Entered",
        description: "Please enter a phone number to send SMS to",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "No Message",
        description: "Please enter a message to send",
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

      console.log('📱 Quick SMS to:', cleanedPhoneNumber);
      
      // Call Supabase Edge Function
      const response = await fetch(`https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: cleanedPhoneNumber,
          message: message.trim(),
          clientName: 'Quick SMS',
          isBulk: false
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
          description: `Message sent to ${cleanedPhoneNumber}`,
        });
        
        console.log('✅ Quick SMS sent successfully:', result);
        
        // Reset form
        setPhoneNumber("");
        setMessage("");
      } else {
        throw new Error(result.error || 'SMS sending failed');
      }

    } catch (error: any) {
      console.error('❌ Quick SMS failed:', error);
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendSms();
    }
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageSquare className="h-5 w-5 text-orange-500" />
          <span>Quick SMS</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="text-base"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Message</span>
            <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : remainingChars < 20 ? 'text-orange-500' : 'text-gray-500'}`}>
              {remainingChars} chars
            </span>
          </div>
          <Textarea
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="min-h-[80px] resize-none text-sm"
            maxLength={320}
          />
          {message.length > characterLimit && (
            <p className="text-xs text-orange-600">
              This will be sent as multiple messages.
            </p>
          )}
        </div>

        <Button
          onClick={handleSendSms}
          disabled={isSending || !phoneNumber.trim() || !message.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600"
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

        <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
          <Users className="h-3 w-3 mr-1" />
          <span>For bulk SMS, select clients in the table above</span>
        </div>
      </CardContent>
    </Card>
  );
}; 