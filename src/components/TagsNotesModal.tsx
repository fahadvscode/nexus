import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Tag, FileText, Save } from "lucide-react";
import { Client } from "@/types/client";
import { clientTags } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TagsNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onUpdate: () => void;
}

export const TagsNotesModal = ({ isOpen, onClose, client, onUpdate }: TagsNotesModalProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(client?.tags || []);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState(client?.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      setSelectedTags(client.tags || []);
      setNotes(client.notes || "");
      setCustomTag("");
    }
  }, [isOpen, client]);

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTogglePresetTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          tags: selectedTags,
          notes: notes.trim() || null
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success("Tags and notes updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error("Failed to update tags and notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <span>Manage Tags & Notes</span>
          </DialogTitle>
          <DialogDescription>
            Add tags and notes for <strong>{client.name}</strong> to better organize and track client information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Tags Section */}
          <div>
            <Label className="text-sm font-medium flex items-center space-x-2 mb-3">
              <Tag className="h-4 w-4" />
              <span>Current Tags</span>
            </Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-lg bg-gray-50">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No tags assigned</span>
              )}
            </div>
          </div>

          {/* Add Custom Tag */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Add Custom Tag</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomTag}
                disabled={!customTag.trim() || selectedTags.includes(customTag.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Preset Tags */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Tags</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {clientTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTogglePresetTag(tag)}
                  className={`justify-start text-left h-auto p-2 ${
                    selectedTags.includes(tag) 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "hover:bg-blue-50"
                  }`}
                >
                  <Tag className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-xs">{tag}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div>
            <Label className="text-sm font-medium flex items-center space-x-2 mb-3">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
            </Label>
            <Textarea
              placeholder="Add internal notes about this client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 