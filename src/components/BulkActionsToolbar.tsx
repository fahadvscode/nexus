import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Tag, UserCheck, X, CheckCircle, Download, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientStore } from "@/store/clientStore";
import { exportClientsToCSV } from "@/utils/csvExport";
import { EmailModal } from "@/components/EmailModal";

interface Props {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export const BulkActionsToolbar = ({ selectedCount, selectedIds, onClearSelection, onRefresh }: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();

  const handleBulkStatusUpdate = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      selectedIds.forEach(clientId => {
        clientStore.updateClient(clientId, { status: newStatus as any });
      });
      
      toast({
        title: "Status Updated",
        description: `${selectedCount} client${selectedCount > 1 ? 's' : ''} updated to ${newStatus}`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} client${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const clients = clientStore.getAllClients();
      const remainingClients = clients.filter(client => !selectedIds.includes(client.id));
      
      // Update the store with remaining clients
      localStorage.setItem('nexus-crm-clients', JSON.stringify(remainingClients));
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      
      toast({
        title: "Clients Deleted",
        description: `${selectedCount} client${selectedCount > 1 ? 's' : ''} deleted successfully`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete clients",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAddTag = async () => {
    const tag = prompt("Enter tag to add to selected clients:");
    if (!tag?.trim()) return;

    setIsProcessing(true);
    try {
      selectedIds.forEach(clientId => {
        const clients = clientStore.getAllClients();
        const client = clients.find(c => c.id === clientId);
        if (client && !client.tags.includes(tag.trim())) {
          clientStore.updateClient(clientId, { 
            tags: [...client.tags, tag.trim()] 
          });
        }
      });
      
      toast({
        title: "Tag Added",
        description: `Tag "${tag}" added to ${selectedCount} client${selectedCount > 1 ? 's' : ''}`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    setIsProcessing(true);
    try {
      const allClients = clientStore.getAllClients();
      const selectedClients = allClients.filter(client => selectedIds.includes(client.id));
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `selected_clients_${timestamp}.csv`;
      
      exportClientsToCSV(selectedClients, filename);
      
      toast({
        title: "Export Complete",
        description: `${selectedCount} client${selectedCount > 1 ? 's' : ''} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedClients = clientStore.getAllClients().filter(client => selectedIds.includes(client.id));

  return (
    <>
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <Badge variant="default" className="bg-blue-600">
                  {selectedCount} selected
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select onValueChange={handleBulkStatusUpdate} disabled={isProcessing}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Set Active</SelectItem>
                    <SelectItem value="lead">Set Lead</SelectItem>
                    <SelectItem value="potential">Set Potential</SelectItem>
                    <SelectItem value="inactive">Set Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkAddTag}
                  disabled={isProcessing}
                  className="h-8"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEmailModal(true)}
                  disabled={isProcessing}
                  className="h-8 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Send Email
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={isProcessing}
                  className="h-8 hover:bg-green-50 hover:text-green-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="h-8 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
        </div>
      </Card>

      <EmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        selectedClients={selectedClients}
        isBulk={true}
      />
    </>
  );
};
