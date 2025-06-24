import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export const TestAdminFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testGetAllOrganizations = async () => {
    setLoading(true);
    try {
      console.log('Testing get_all_organizations_admin...');
      
      const { data, error } = await supabase.rpc('get_all_organizations_admin');
      
      if (error) {
        console.error('RPC Error:', error);
        toast.error(`Error: ${error.message}`);
        setResults({ error: error.message, type: 'organizations' });
      } else {
        console.log('Organizations data:', data);
        toast.success(`Found ${data?.length || 0} organizations`);
        setResults({ data, type: 'organizations' });
      }
    } catch (err) {
      console.error('Catch Error:', err);
      toast.error('Unexpected error occurred');
      setResults({ error: String(err), type: 'organizations' });
    } finally {
      setLoading(false);
    }
  };

  const testGetAllProfiles = async () => {
    setLoading(true);
    try {
      console.log('Testing get_all_profiles_admin...');
      
      const { data, error } = await supabase.rpc('get_all_profiles_admin');
      
      if (error) {
        console.error('RPC Error:', error);
        toast.error(`Error: ${error.message}`);
        setResults({ error: error.message, type: 'profiles' });
      } else {
        console.log('Profiles data:', data);
        toast.success(`Found ${data?.length || 0} profiles`);
        setResults({ data, type: 'profiles' });
      }
    } catch (err) {
      console.error('Catch Error:', err);
      toast.error('Unexpected error occurred');
      setResults({ error: String(err), type: 'profiles' });
    } finally {
      setLoading(false);
    }
  };

  const testCurrentUser = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        toast.error(`Auth Error: ${error.message}`);
        setResults({ error: error.message, type: 'auth' });
      } else {
        console.log('Current user:', user);
        toast.success(`Logged in as: ${user?.email}`);
        setResults({ data: user, type: 'auth' });
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setResults({ error: String(err), type: 'auth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Test Admin RPC Functions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testCurrentUser} 
            disabled={loading}
            variant="outline"
          >
            Test Current User
          </Button>
          <Button 
            onClick={testGetAllOrganizations} 
            disabled={loading}
          >
            Test Get Organizations
          </Button>
          <Button 
            onClick={testGetAllProfiles} 
            disabled={loading}
          >
            Test Get Profiles
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Testing...</p>
          </div>
        )}

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">
              Results ({results.type}):
            </h3>
            {results.error ? (
              <div className="text-red-600 bg-red-50 p-2 rounded">
                <strong>Error:</strong> {results.error}
              </div>
            ) : (
              <pre className="text-sm overflow-auto max-h-96 bg-white p-2 rounded border">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 