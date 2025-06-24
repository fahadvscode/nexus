
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Client } from "@/types/client";

interface ClientEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ClientEventModal = ({ open, onOpenChange, client }: ClientEventModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Don't render if client is null
  if (!client) {
    return null;
  }

  const handleCreateEvent = async () => {
    if (!title.trim() || !eventDate || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    // Simulate event creation with client context
    setTimeout(() => {
      toast({
        title: "Event Created",
        description: `Event "${title}" scheduled with ${client.name} for ${format(new Date(eventDate), 'MMMM d, yyyy')}`,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setEventDate("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setEventType("");
      setReminderTime("");
      setIsCreating(false);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Schedule Event with Client</span>
          </DialogTitle>
          <DialogDescription>
            Create a new event or appointment with {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info Card */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                {client.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">{client.name}</h3>
                <p className="text-sm text-blue-600">{client.email} • {client.phone}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Client consultation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Initial Consultation</SelectItem>
                  <SelectItem value="followup">Follow-up Meeting</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="review">Review Meeting</SelectItem>
                  <SelectItem value="onboarding">Client Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meeting agenda, notes, or additional details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Meeting location, office, or virtual link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">Reminder</Label>
            <Select value={reminderTime} onValueChange={setReminderTime}>
              <SelectTrigger>
                <SelectValue placeholder="Set reminder time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5min">5 minutes before</SelectItem>
                <SelectItem value="15min">15 minutes before</SelectItem>
                <SelectItem value="30min">30 minutes before</SelectItem>
                <SelectItem value="1hour">1 hour before</SelectItem>
                <SelectItem value="2hour">2 hours before</SelectItem>
                <SelectItem value="1day">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={isCreating || !title.trim() || !eventDate || !startTime || !endTime}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Schedule Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
