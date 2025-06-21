
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  selectedClients?: Client[];
  isBulk?: boolean;
}

const emailTemplates = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to Our Services",
    body: "Dear {{name}},\n\nWelcome to our services! We're excited to work with you.\n\nBest regards,\nThe Team"
  },
  {
    id: "follow-up",
    name: "Follow-up Email",
    subject: "Following up on our conversation",
    body: "Hi {{name}},\n\nI wanted to follow up on our recent conversation. Please let me know if you have any questions.\n\nBest regards,\nThe Team"
  },
  {
    id: "custom",
    name: "Custom Email",
    subject: "",
    body: ""
  }
];

export const EmailModal = ({ open, onOpenChange, client, selectedClients, isBulk = false }: Props) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const recipients = isBulk ? selectedClients : client ? [client] : [];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulate email sending
    setTimeout(() => {
      toast({
        title: "Email Sent",
        description: `Email sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
      });
      
      // Reset form
      setSelectedTemplate("");
      setSubject("");
      setBody("");
      setIsSending(false);
      onOpenChange(false);
    }, 2000);
  };

  const replaceVariables = (text: string, client: Client) => {
    return text
      .replace(/{{name}}/g, client.name)
      .replace(/{{email}}/g, client.email)
      .replace(/{{phone}}/g, client.phone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>
              {isBulk ? `Send Email to ${recipients.length} Clients` : `Send Email to ${client?.name}`}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isBulk 
              ? "Compose and send an email to multiple selected clients"
              : "Compose and send an email to this client"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2">
              {recipients.map((recipient) => (
                <Badge key={recipient.id} variant="secondary">
                  {recipient.name} ({recipient.email})
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Email message (use {{name}}, {{email}}, {{phone}} for personalization)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
            />
          </div>

          {!isBulk && client && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">Preview for {client.name}:</Label>
              <div className="mt-2 space-y-1">
                <div className="text-sm"><strong>Subject:</strong> {replaceVariables(subject, client)}</div>
                <div className="text-sm whitespace-pre-wrap"><strong>Message:</strong> {replaceVariables(body, client)}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !subject.trim() || !body.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
