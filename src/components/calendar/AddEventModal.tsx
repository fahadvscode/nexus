
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export const AddEventModal = ({ open, onOpenChange, selectedDate }: AddEventModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [attendees, setAttendees] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateEvent = async () => {
    if (!title.trim() || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    // Simulate event creation
    setTimeout(() => {
      toast({
        title: "Event Created",
        description: `Event "${title}" has been scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setEventType("");
      setAttendees("");
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
            <span>Create New Event</span>
          </DialogTitle>
          <DialogDescription>
            Schedule a new event for {format(selectedDate, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Enter event title"
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
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event description and notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Meeting location or virtual link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees</Label>
            <Input
              id="attendees"
              placeholder="Enter attendee names or emails (comma separated)"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
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
              disabled={isCreating || !title.trim() || !startTime || !endTime}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
