import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/components/UserRoleProvider';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Crown, Users, ArrowRight, ArrowLeft, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminQuickActions = () => {
  const { isAdmin, isImpersonating, impersonatedProfile, switchToSubAccount, exitImpersonation } = useUserRole();
  const { allProfiles, allOrganizations, loading } = useUserManagement();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const navigate = useNavigate();

  // Only show for admins
  if (!isAdmin()) {
    return null;
  }

  const subaccountProfiles = allProfiles.filter(p => p.role === 'subaccount' && p.is_active);
  
  const getOrganizationForUser = (userId: string) => {
    return allOrganizations.find(org => org.owner_id === userId);
  };

  const handleSwitchToSubAccount = async () => {
    if (!selectedUserId) return;
    
    const success = await switchToSubAccount(selectedUserId);
    if (success) {
      setSelectedUserId('');
    }
  };

  const handleExitImpersonation = () => {
    exitImpersonation();
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="text-center text-blue-600">Loading admin controls...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Crown className="h-5 w-5" />
          Admin Quick Actions
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            {subaccountProfiles.length} Subaccounts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isImpersonating && impersonatedProfile ? (
          // Currently impersonating - show exit button
          <div className="flex items-center justify-between p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                Viewing as: {impersonatedProfile.username || impersonatedProfile.email}
              </span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-400">
                Impersonating
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitImpersonation}
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        ) : (
          // Admin view - show subaccount selector
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a subaccount to manage..." />
                </SelectTrigger>
                <SelectContent>
                  {subaccountProfiles.map((profile) => {
                    const org = getOrganizationForUser(profile.user_id);
                    return (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        <div className="flex items-center gap-2">
                          <span>{profile.username || profile.email}</span>
                          {org && (
                            <Badge variant="outline" className="text-xs">
                              {org.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleSwitchToSubAccount}
                disabled={!selectedUserId}
                size="sm"
                className="whitespace-nowrap"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Switch to Account
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings?tab=users')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings?tab=resources')}
                className="flex-1"
              >
                <Building className="h-4 w-4 mr-2" />
                Resources
              </Button>
            </div>
          </div>
        )}
        
        {!isImpersonating && subaccountProfiles.length === 0 && (
          <div className="text-center py-4 text-blue-600">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-sm mb-2">No subaccounts created yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings?tab=users')}
              className="border-blue-300 text-blue-600 hover:bg-blue-100"
            >
              Create First Subaccount
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
