import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useUserRole } from '@/components/UserRoleProvider';
import { useUserManagement } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Plus, Edit, Trash2, Building } from 'lucide-react';

interface SubaccountResource {
  id: string;
  organization_id: string;
  organization_name?: string;
  twilio_phone_number?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  email_address?: string;
  email_password?: string;
  email_smtp_host?: string;
  email_smtp_port?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SubaccountResources = () => {
  const { isAdmin } = useUserRole();
  const { allOrganizations, allProfiles } = useUserManagement();
  const { toast } = useToast();
  
  const [resources, setResources] = useState<SubaccountResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<SubaccountResource | null>(null);
  const [formData, setFormData] = useState({
    organization_id: '',
    twilio_phone_number: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    email_address: '',
    email_password: '',
    email_smtp_host: 'smtp.gmail.com',
    email_smtp_port: 587,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Only allow admins to access this component
  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">Only administrators can manage subaccount resources.</p>
      </div>
    );
  }

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      // Create a simple in-memory table for subaccount resources
      // In a real application, you'd want to create a proper database table
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, owner_id')
        .order('created_at', { ascending: false });

      if (orgData) {
        // Filter organizations that belong to subaccounts
        const subaccountOrgs = orgData.filter(org => 
          allProfiles.some(profile => profile.user_id === org.owner_id && profile.role === 'subaccount')
        );

        // For now, we'll create mock data. In a real app, you'd fetch from a subaccount_resources table
        const mockResources: SubaccountResource[] = subaccountOrgs.map(org => ({
          id: `resource_${org.id}`,
          organization_id: org.id,
          organization_name: org.name,
          twilio_phone_number: '',
          twilio_account_sid: '',
          twilio_auth_token: '',
          email_address: '',
          email_password: '',
          email_smtp_host: 'smtp.gmail.com',
          email_smtp_port: 587,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        setResources(mockResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subaccount resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async () => {
    if (!formData.organization_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select an organization',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // In a real application, you'd save to a database table
      // For now, we'll update the local state
      const resourceData = {
        ...formData,
        id: editingResource ? editingResource.id : `resource_${formData.organization_id}`,
        organization_name: allOrganizations.find(org => org.id === formData.organization_id)?.name,
        created_at: editingResource ? editingResource.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editingResource) {
        // Update existing resource
        setResources(prev => 
          prev.map(res => res.id === editingResource.id ? resourceData : res)
        );
        toast({
          title: 'Success',
          description: 'Resource configuration updated successfully',
        });
      } else {
        // Add new resource
        setResources(prev => [...prev, resourceData]);
        toast({
          title: 'Success',
          description: 'Resource configuration added successfully',
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resource configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditResource = (resource: SubaccountResource) => {
    setEditingResource(resource);
    setFormData({
      organization_id: resource.organization_id,
      twilio_phone_number: resource.twilio_phone_number || '',
      twilio_account_sid: resource.twilio_account_sid || '',
      twilio_auth_token: resource.twilio_auth_token || '',
      email_address: resource.email_address || '',
      email_password: resource.email_password || '',
      email_smtp_host: resource.email_smtp_host || 'smtp.gmail.com',
      email_smtp_port: resource.email_smtp_port || 587,
      is_active: resource.is_active,
    });
    setDialogOpen(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      // In a real application, you'd delete from the database
      setResources(prev => prev.filter(res => res.id !== resourceId));
      toast({
        title: 'Success',
        description: 'Resource configuration deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource configuration',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (resourceId: string, isActive: boolean) => {
    try {
      setResources(prev => 
        prev.map(res => 
          res.id === resourceId ? { ...res, is_active: isActive, updated_at: new Date().toISOString() } : res
        )
      );
      toast({
        title: 'Success',
        description: `Resource ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling resource status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resource status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      organization_id: '',
      twilio_phone_number: '',
      twilio_account_sid: '',
      twilio_auth_token: '',
      email_address: '',
      email_password: '',
      email_smtp_host: 'smtp.gmail.com',
      email_smtp_port: 587,
      is_active: true,
    });
    setEditingResource(null);
    setDialogOpen(false);
  };

  const subaccountOrganizations = allOrganizations.filter(org => 
    allProfiles.some(profile => profile.user_id === org.owner_id && profile.role === 'subaccount')
  );

  const availableOrganizations = subaccountOrganizations.filter(org =>
    !resources.some(res => res.organization_id === org.id) || editingResource?.organization_id === org.id
  );

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subaccount Resources</h2>
          <p className="text-muted-foreground">
            Manage Twilio phone numbers and email configurations for subaccounts
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingResource(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? 'Edit Resource Configuration' : 'Add Resource Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure Twilio phone numbers and email settings for a subaccount organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Organization Selection */}
              <div className="grid gap-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select 
                  value={formData.organization_id} 
                  onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
                  disabled={!!editingResource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                        {org.description && (
                          <span className="text-muted-foreground ml-2">
                            - {org.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Twilio Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <h4 className="font-semibold">Twilio Configuration</h4>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={formData.twilio_phone_number}
                    onChange={(e) => setFormData({ ...formData, twilio_phone_number: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="account-sid">Account SID</Label>
                  <Input
                    id="account-sid"
                    placeholder="AC..."
                    value={formData.twilio_account_sid}
                    onChange={(e) => setFormData({ ...formData, twilio_account_sid: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="auth-token">Auth Token</Label>
                  <Input
                    id="auth-token"
                    type="password"
                    placeholder="Your Twilio auth token"
                    value={formData.twilio_auth_token}
                    onChange={(e) => setFormData({ ...formData, twilio_auth_token: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Email Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <h4 className="font-semibold">Email Configuration</h4>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="subaccount@company.com"
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email-password">Email Password</Label>
                  <Input
                    id="email-password"
                    type="password"
                    placeholder="App-specific password"
                    value={formData.email_password}
                    onChange={(e) => setFormData({ ...formData, email_password: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      value={formData.email_smtp_host}
                      onChange={(e) => setFormData({ ...formData, email_smtp_host: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={formData.email_smtp_port}
                      onChange={(e) => setFormData({ ...formData, email_smtp_port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="active">Active Configuration</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this configuration for the subaccount
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveResource} disabled={saving}>
                {saving ? 'Saving...' : editingResource ? 'Update Configuration' : 'Add Configuration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configurations</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configured Phone Numbers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.twilio_phone_number).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource List */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Configurations</CardTitle>
          <CardDescription>
            Manage Twilio and email configurations for each subaccount
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Configurations</h3>
              <p className="text-muted-foreground mb-4">
                Add resource configurations for your subaccounts.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{resource.organization_name}</h4>
                      <Badge variant={resource.is_active ? 'default' : 'secondary'}>
                        {resource.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Phone className="h-3 w-3" />
                          <span className="font-medium">Phone:</span>
                        </div>
                        <p>{resource.twilio_phone_number || 'Not configured'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3" />
                          <span className="font-medium">Email:</span>
                        </div>
                        <p>{resource.email_address || 'Not configured'}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated: {new Date(resource.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={resource.is_active}
                      onCheckedChange={(checked) => handleToggleActive(resource.id, checked)}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditResource(resource)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the resource configuration for "{resource.organization_name}". 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteResource(resource.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Configuration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubaccountResources; 