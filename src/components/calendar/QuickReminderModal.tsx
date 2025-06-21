
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";

interface QuickReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const QuickReminderModal = ({ open, onOpenChange, client }: QuickReminderModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderType, setReminderType] = useState("");
  const [priority, setPriority] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Don't render if client is null
  if (!client) {
    return null;
  }

  const handleCreateReminder = async () => {
    if (!title.trim() || !reminderDate || !reminderTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    setTimeout(() => {
      toast({
        title: "Reminder Set",
        description: `Reminder "${title}" set for ${client.name}`,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setReminderDate("");
      setReminderTime("");
      setReminderType("");
      setPriority("");
      setIsCreating(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Set Reminder</span>
          </DialogTitle>
          <DialogDescription>
            Create a reminder for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center text-white font-medium text-xs">
                {client.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="font-medium text-amber-900">{client.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Reminder Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Follow up on proposal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional notes or context"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminderDate">Date *</Label>
              <Input
                id="reminderDate"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Time *</Label>
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Reminder Type</Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="call">Call Client</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="proposal">Proposal Due</SelectItem>
                  <SelectItem value="payment">Payment Reminder</SelectItem>
                  <SelectItem value="contract">Contract Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              onClick={handleCreateReminder}
              disabled={isCreating || !title.trim() || !reminderDate || !reminderTime}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Setting..." : "Set Reminder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
