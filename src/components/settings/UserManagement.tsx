import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useUserRole } from '@/components/UserRoleProvider';
import { useAdminImpersonation } from '@/hooks/useAdminImpersonation';
import { Trash2, Plus, Users, Building, Eye, EyeOff, UserCheck, UserX, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const { isAdmin, userProfile } = useUserRole();
  const { 
    allOrganizations, 
    allProfiles, 
    loading, 
    createSubaccount, 
    toggleUserStatus, 
    deleteSubaccount 
  } = useUserManagement();
  
  const impersonation = useAdminImpersonation(userProfile, isAdmin());
  const navigate = useNavigate();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    organizationName: '',
    organizationDescription: '',
  });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Only allow admins to access this component
  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">Only administrators can access user management.</p>
      </div>
    );
  }

  const handleCreateSubaccount = async () => {
    if (!formData.email || !formData.password || !formData.username || !formData.organizationName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    const success = await createSubaccount(formData);
    
    if (success) {
      setFormData({
        email: '',
        password: '',
        username: '',
        organizationName: '',
        organizationDescription: '',
      });
      setCreateDialogOpen(false);
    }
    
    setCreating(false);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, !currentStatus);
  };

  const handleDeleteSubaccount = async (userId: string) => {
    await deleteSubaccount(userId);
  };

  const handleSwitchToSubAccount = async (userId: string) => {
    const success = await impersonation.switchToSubAccount(userId);
    if (success) {
      // Navigate to the main dashboard where the user will see the sub-account's data
      navigate('/');
    }
  };

  const getOrganizationForUser = (userId: string) => {
    return allOrganizations.find(org => org.owner_id === userId);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading user data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage subaccounts and their organizations
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Subaccount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subaccount</DialogTitle>
              <DialogDescription>
                Create a new subaccount with its own organization and isolated data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orgDesc">Organization Description</Label>
                <Textarea
                  id="orgDesc"
                  placeholder="Brief description of the organization"
                  value={formData.organizationDescription}
                  onChange={(e) => setFormData({ ...formData, organizationDescription: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleCreateSubaccount}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Subaccount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subaccounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProfiles.filter(p => p.role === 'subaccount').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allOrganizations.filter(org => org.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProfiles.filter(p => p.is_active && p.role === 'subaccount').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Subaccounts</CardTitle>
          <CardDescription>
            Manage all subaccounts and their organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allProfiles.filter(p => p.role === 'subaccount').length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subaccounts</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subaccount to get started.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Subaccount
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allProfiles
                .filter(p => p.role === 'subaccount')
                .map((profile) => {
                  const organization = getOrganizationForUser(profile.user_id);
                  return (
                    <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{profile.username || 'No username'}</h4>
                          <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {organization && (
                            <Badge variant="outline">
                              <Building className="h-3 w-3 mr-1" />
                              {organization.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        {organization?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {organization.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSwitchToSubAccount(profile.user_id)}
                          disabled={!profile.is_active}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Switch to Sub Account
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(profile.user_id, profile.is_active || false)}
                        >
                          {profile.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
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
                              <AlertDialogTitle>Delete Subaccount</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the subaccount "{profile.username}" and all associated data including clients, calls, and the organization "{organization?.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSubaccount(profile.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
