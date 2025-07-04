import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserRole } from '@/components/UserRoleProvider';
import { useUserManagement } from '@/hooks/useUserManagement';
import { clientStore, Client } from '@/store/clientStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowRight, CheckCircle, RefreshCw, Info } from 'lucide-react';

const BulkLeadAssignment = () => {
  const { isAdmin } = useUserRole();
  const { allOrganizations, allProfiles, refreshData } = useUserManagement();
  const { toast } = useToast();
  
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [targetOrganization, setTargetOrganization] = useState<string>('');
  const [sourceOrganization, setSourceOrganization] = useState<string>('admin');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Only allow admins to access this component
  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">Only administrators can access bulk lead assignment.</p>
      </div>
    );
  }

  useEffect(() => {
    loadClients();
  }, [sourceOrganization]);

  const loadClients = async () => {
    setLoading(true);
    try {
      let clients: Client[] = [];
      
      if (sourceOrganization === 'admin') {
        // Load all unassigned clients using the clientStore method
        clients = await clientStore.getUnassignedClients();
      } else {
        // Load clients from specific organization
        clients = await clientStore.getClientsForOrganization(sourceOrganization);
      }
      
      setAllClients(clients);
      setSelectedClients([]);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelection = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(allClients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleBulkAssignment = async () => {
    if (!targetOrganization || selectedClients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a target organization and at least one client',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      // Use the clientStore method for bulk assignment
      const success = await clientStore.bulkAssignClients(selectedClients, targetOrganization);

      if (success) {
        toast({
          title: 'Success',
          description: `Successfully assigned ${selectedClients.length} clients to the selected organization`,
        });

        // Reload clients to reflect changes
        await loadClients();
        setSelectedClients([]);
        setTargetOrganization('');
      } else {
        throw new Error('Bulk assignment failed');
      }
      
    } catch (error) {
      console.error('Error assigning clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign clients',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const getOrganizationName = (orgId: string) => {
    if (orgId === 'admin') return 'Admin Pool (Unassigned)';
    const org = allOrganizations.find(o => o.id === orgId);
    return org?.name || 'Unknown Organization';
  };

  const subaccountOrganizations = allOrganizations.filter(org => 
    allProfiles.some(profile => profile.user_id === org.owner_id && profile.role === 'subaccount')
  );

  // Enhanced debug logging to help troubleshoot
  console.log('🔍 BulkLeadAssignment Debug Info:');
  console.log('📊 All Organizations:', allOrganizations);
  console.log('👥 All Profiles:', allProfiles);
  console.log('🏢 Subaccount Organizations:', subaccountOrganizations);
  console.log('🔧 Filtering logic check:');
  allOrganizations.forEach(org => {
    console.log(`  Org: ${org.name} (${org.id}), owner_id: ${org.owner_id}`);
    const matchingProfile = allProfiles.find(profile => profile.user_id === org.owner_id);
    console.log(`  Matching profile:`, matchingProfile);
    if (matchingProfile) {
      console.log(`    - Email: ${matchingProfile.email}, Role: ${matchingProfile.role}`);
      console.log(`    - Is subaccount? ${matchingProfile.role === 'subaccount'}`);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk Lead Assignment</h2>
          <p className="text-muted-foreground">
            Assign multiple clients/leads between the admin pool and subaccounts in bulk
          </p>
          <div className="mt-2 text-sm text-blue-600">
            ✨ You can now assign admin pool leads to any subaccount, or move leads between subaccounts
          </div>
        </div>
        <Button variant="outline" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Debug Information */}
      {subaccountOrganizations.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Info className="h-5 w-5" />
              No Subaccounts Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-800">
            <div className="space-y-2 text-sm">
              <p><strong>Organizations loaded:</strong> {allOrganizations.length}</p>
              <p><strong>User profiles loaded:</strong> {allProfiles.length}</p>
              <p><strong>Subaccount profiles:</strong> {allProfiles.filter(p => p.role === 'subaccount').length}</p>
              
              {allOrganizations.length === 0 && (
                <p className="text-red-600">⚠️ No organizations data loaded. Please check your connection and try refreshing.</p>
              )}
              
              {allProfiles.length === 0 && (
                <p className="text-red-600">⚠️ No user profiles data loaded. Please check your connection and try refreshing.</p>
              )}
              
              {allOrganizations.length > 0 && allProfiles.length > 0 && subaccountOrganizations.length === 0 && (
                <p className="text-blue-600">ℹ️ Organizations and profiles are loaded, but no subaccounts found. Create subaccounts in the Users tab first.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Source</CardTitle>
          <CardDescription>
            Choose where to load clients from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="source-org">Source Organization</Label>
              <Select value={sourceOrganization} onValueChange={setSourceOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Pool (Unassigned Leads)</SelectItem>
                  {subaccountOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                  {/* Show all organizations temporarily for debugging */}
                  {allOrganizations.length > 0 && subaccountOrganizations.length === 0 && (
                    <>
                      <SelectItem disabled value="debug-separator">--- Debug: All Organizations ---</SelectItem>
                      {allOrganizations.map((org) => (
                        <SelectItem key={`debug-${org.id}`} value={org.id}>
                          🔧 {org.name} (Debug)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Select Clients</CardTitle>
            <CardDescription>
              Choose clients from {getOrganizationName(sourceOrganization)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedClients.length} of {allClients.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : allClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Clients Found</h3>
              <p className="text-muted-foreground">
                No clients available in {getOrganizationName(sourceOrganization)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedClients.length === allClients.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All ({allClients.length} clients)
                </Label>
              </div>
              
              <Separator />
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {allClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={client.id}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={(checked) => handleClientSelection(client.id, checked as boolean)}
                    />
                                         <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <span className="font-medium">
                           {client.name}
                         </span>
                         <Badge variant="secondary">{client.status}</Badge>
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {client.email} • {client.phone}
                       </p>
                       {client.source && (
                         <p className="text-sm text-muted-foreground">
                           Source: {client.source}
                         </p>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Selection and Assignment */}
      {selectedClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assign to Organization</CardTitle>
            <CardDescription>
              Choose target organization for {selectedClients.length} selected clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="target-org">Target Organization</Label>
                <Select value={targetOrganization} onValueChange={setTargetOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Option to assign back to admin pool */}
                    {sourceOrganization !== 'admin' && (
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Badge variant="default" className="mr-2 text-xs">Admin</Badge>
                          Admin Pool (Unassigned)
                        </div>
                      </SelectItem>
                    )}
                    {subaccountOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-2 text-xs">Subaccount</Badge>
                          {org.name}
                          {org.description && (
                            <span className="text-muted-foreground ml-2">
                              - {org.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {/* Show all organizations temporarily for debugging */}
                    {allOrganizations.length > 0 && subaccountOrganizations.length === 0 && (
                      <>
                        <SelectItem disabled value="debug-separator">--- Debug: All Organizations ---</SelectItem>
                        {allOrganizations.map((org) => (
                          <SelectItem key={`debug-target-${org.id}`} value={org.id}>
                            🔧 {org.name} (Debug)
                            {org.description && (
                              <span className="text-muted-foreground ml-2">
                                - {org.description}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {targetOrganization && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Assign {selectedClients.length} clients from {getOrganizationName(sourceOrganization)}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {getOrganizationName(targetOrganization)}
                    </span>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={assigning}>
                        {assigning ? 'Assigning...' : 'Assign Clients'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to assign {selectedClients.length} clients from "{getOrganizationName(sourceOrganization)}" to "{getOrganizationName(targetOrganization)}"? 
                          {targetOrganization === 'admin' ? 
                            'This will move the clients back to the unassigned admin pool.' : 
                            'This action will transfer ownership to the selected subaccount.'
                          }
                          <br /><br />
                          <strong>Note:</strong> This action can be reversed by reassigning the clients later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkAssignment}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Assignment
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkLeadAssignment; 