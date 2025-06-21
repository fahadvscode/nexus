import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Phone, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CallLog } from "@/types/call";
import { clientStore } from "@/store/clientStore";

interface CallOutcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: {
    clientId: string;
    clientName: string;
    phoneNumber: string;
    startTime: Date;
    preparationNotes: string;
  } | null;
  onSaveCall: (callLog: Omit<CallLog, 'id'>) => void;
}

export const CallOutcomeModal = ({ open, onOpenChange, callData, onSaveCall }: CallOutcomeModalProps) => {
  const [outcome, setOutcome] = useState<CallLog['outcome'] | "">("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!callData || !outcome) {
      toast({
        title: "Error",
        description: "Please select a call outcome",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const callLog: Omit<CallLog, 'id'> = {
        clientId: callData.clientId,
        clientName: callData.clientName,
        phoneNumber: callData.phoneNumber,
        startTime: callData.startTime,
        endTime: new Date(),
        duration: duration ? parseInt(duration) : null,
        outcome,
        notes: notes || callData.preparationNotes,
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdBy: 'current-user', // In a real app, get from auth context
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        twilioCallSid: undefined,
      };

      onSaveCall(callLog);

      // Update client's last contact date
      await clientStore.updateClient(callData.clientId, {
        last_contact: new Date().toISOString()
      });

      toast({
        title: "Call Logged",
        description: "Call outcome has been saved successfully",
      });

      // Reset form
      setOutcome("");
      setDuration("");
      setNotes("");
      setFollowUpRequired(false);
      setFollowUpDate("");
      setTags("");
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving call log:', error);
      toast({
        title: "Error",
        description: "Failed to save call log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const outcomeOptions = [
    { value: "connected", label: "Connected" },
    { value: "voicemail", label: "Voicemail" },
    { value: "no-answer", label: "No Answer" },
    { value: "busy", label: "Busy" },
    { value: "declined", label: "Declined" },
    { value: "failed", label: "Failed" },
  ];

  if (!callData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Call Outcome - {callData.clientName}</span>
          </DialogTitle>
          <DialogDescription>
            Record the outcome and details of your call with {callData.clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Call Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{callData.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{callData.startTime.toLocaleString()}</span>
              </div>
            </div>
            {callData.preparationNotes && (
              <div className="mt-2">
                <span className="text-sm font-medium">Preparation Notes:</span>
                <p className="text-sm text-gray-600 mt-1">{callData.preparationNotes}</p>
              </div>
            )}
          </div>

          {/* Call Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Call Outcome *</Label>
                         <Select value={outcome} onValueChange={(value) => setOutcome(value as CallLog['outcome'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select call outcome" />
              </SelectTrigger>
              <SelectContent>
                {outcomeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Call Duration (seconds)</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 120"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Call Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about the conversation, key points discussed, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followup"
                checked={followUpRequired}
                onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
              />
              <Label htmlFor="followup">Follow-up required</Label>
            </div>

            {followUpRequired && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="followupDate">Follow-up Date</Label>
                <Input
                  id="followupDate"
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., interested, budget-approved, needs-demo"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={handleSave} disabled={!outcome || isSubmitting} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Call Log"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
