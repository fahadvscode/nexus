import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const DebugUserRole: React.FC = () => {
  const [debug, setDebug] = useState({
    userEmail: null as string | null,
    userId: null as string | null,
    userProfile: null as any,
    rpcTestResults: {
      organizations: null as any,
      profiles: null as any,
    },
    loading: false,
  });

  const fetchDebugInfo = async () => {
    setDebug(prev => ({ ...prev, loading: true }));
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User auth error:', userError);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Test RPC functions
      let orgResult = null;
      let profileResult = null;

      try {
        const { data: orgs, error: orgError } = await supabase.rpc('get_all_organizations_admin');
        orgResult = { success: !orgError, data: orgs, error: orgError };
      } catch (error) {
        orgResult = { success: false, data: null, error };
      }

      try {
        const { data: profiles, error: profError } = await supabase.rpc('get_all_profiles_admin');
        profileResult = { success: !profError, data: profiles, error: profError };
      } catch (error) {
        profileResult = { success: false, data: null, error };
      }

      setDebug({
        userEmail: user.email,
        userId: user.id,
        userProfile: { data: profile, error: profileError },
        rpcTestResults: {
          organizations: orgResult,
          profiles: profileResult,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Debug fetch error:', error);
      setDebug(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (success: boolean | null) => {
    if (success === null) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">🔍 User Role Debug Information</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDebugInfo}
          disabled={debug.loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${debug.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div>
          <h4 className="font-semibold mb-2">Authentication Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>Email: <Badge variant="outline">{debug.userEmail || 'Not logged in'}</Badge></div>
            <div>User ID: <Badge variant="outline" className="font-mono text-xs">{debug.userId ? debug.userId.slice(0, 8) + '...' : 'None'}</Badge></div>
          </div>
        </div>

        {/* User Profile */}
        <div>
          <h4 className="font-semibold mb-2">User Profile</h4>
          {debug.userProfile?.error ? (
            <Badge variant="destructive">Error: {debug.userProfile.error.message}</Badge>
          ) : debug.userProfile?.data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>Role: <Badge variant={debug.userProfile.data.role === 'admin' ? 'default' : 'secondary'}>{debug.userProfile.data.role}</Badge></div>
              <div>Active: <Badge variant={debug.userProfile.data.is_active ? 'default' : 'destructive'}>{debug.userProfile.data.is_active ? 'Yes' : 'No'}</Badge></div>
              <div>Username: <Badge variant="outline">{debug.userProfile.data.username || 'Not set'}</Badge></div>
            </div>
          ) : (
            <Badge variant="secondary">Loading...</Badge>
          )}
        </div>

        {/* RPC Function Tests */}
        <div>
          <h4 className="font-semibold mb-2">RPC Function Tests</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(debug.rpcTestResults.organizations?.success)}
              <span className="text-sm font-medium">get_all_organizations_admin</span>
              {debug.rpcTestResults.organizations?.error && (
                <Badge variant="destructive" className="text-xs">
                  {debug.rpcTestResults.organizations.error.message}
                </Badge>
              )}
              {debug.rpcTestResults.organizations?.success && (
                <Badge variant="default" className="text-xs">
                  {debug.rpcTestResults.organizations.data?.length || 0} organizations
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(debug.rpcTestResults.profiles?.success)}
              <span className="text-sm font-medium">get_all_profiles_admin</span>
              {debug.rpcTestResults.profiles?.error && (
                <Badge variant="destructive" className="text-xs">
                  {debug.rpcTestResults.profiles.error.message}
                </Badge>
              )}
              {debug.rpcTestResults.profiles?.success && (
                <Badge variant="default" className="text-xs">
                  {debug.rpcTestResults.profiles.data?.length || 0} profiles
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {debug.userProfile?.data?.role !== 'admin' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Not an admin user:</strong> Your account role is "{debug.userProfile?.data?.role || 'unknown'}". 
              Admin features require the "admin" role in the user_profiles table.
            </p>
          </div>
        )}

        {debug.rpcTestResults.organizations?.error?.message?.includes('does not exist') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>❌ Database migration needed:</strong> The admin RPC functions don't exist in the database. 
              Run the latest migrations to fix this.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 