import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type UserProfile = Tables<'user_profiles'>;
export type Organization = Tables<'organizations'>;
export type UserRole = 'admin' | 'subaccount';

interface CreateSubaccountData {
  email: string;
  password: string;
  username: string;
  organizationName: string;
  organizationDescription?: string;
}

export const useUserManagement = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userOrganization, setUserOrganization] = useState<Organization | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch current user's profile
  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Fetch current user's organization
  const fetchUserOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching organization:', error);
        return;
      }

      setUserOrganization(organization);
    } catch (error) {
      console.error('Error in fetchUserOrganization:', error);
    }
  };

  // Fetch all organizations (admin only)
  const fetchAllOrganizations = async () => {
    if (!userProfile || userProfile.role !== 'admin') {
      console.log('User is not admin, skipping organizations fetch');
      return;
    }

    try {
      console.log('🏢 Fetching all organizations for admin user...');
      const { data: organizations, error } = await supabase.rpc('get_all_organizations_admin');

      if (error) {
        console.error('❌ Error fetching organizations:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Admin role required')) {
          console.error('🚨 Current user does not have admin role in database');
          toast({
            title: 'Access Denied',
            description: 'Your account does not have admin privileges. Please contact support.',
            variant: 'destructive',
          });
        } else if (error.code === 'PGRST116') {
          console.log('ℹ️ No organizations found - this is normal for new installations');
          setAllOrganizations([]);
        } else {
          console.error('🔧 RPC function may not exist or there\'s a database connection issue');
          toast({
            title: 'Database Error',
            description: 'Unable to fetch organization data. Please refresh the page.',
            variant: 'destructive',
          });
        }
        return;
      }

      console.log('✅ Organizations fetched successfully:', organizations?.length || 0);
      // Ensure all required fields are present, add default settings if missing
      const normalizedOrganizations = (organizations || []).map(org => ({
        ...org,
        settings: org.settings || null
      }));
      setAllOrganizations(normalizedOrganizations);
    } catch (error) {
      console.error('💥 Unexpected error in fetchAllOrganizations:', error);
      toast({
        title: 'System Error',
        description: 'An unexpected error occurred while fetching organization data.',
        variant: 'destructive',
      });
    }
  };

  // Fetch all user profiles (admin only)
  const fetchAllProfiles = async () => {
    if (!userProfile || userProfile.role !== 'admin') {
      console.log('User is not admin, skipping profiles fetch');
      return;
    }

    try {
      console.log('👥 Fetching all user profiles for admin user...');
      const { data: profiles, error } = await supabase.rpc('get_all_profiles_admin');

      if (error) {
        console.error('❌ Error fetching profiles:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Admin role required')) {
          console.error('🚨 Current user does not have admin role in database');
          toast({
            title: 'Access Denied',
            description: 'Your account does not have admin privileges. Please contact support.',
            variant: 'destructive',
          });
        } else if (error.code === 'PGRST116') {
          console.log('ℹ️ No user profiles found - this is normal for new installations');
          setAllProfiles([]);
        } else {
          console.error('🔧 RPC function may not exist or there\'s a database connection issue');
          toast({
            title: 'Database Error',
            description: 'Unable to fetch user profile data. Please refresh the page.',
            variant: 'destructive',
          });
        }
        return;
      }

      console.log('✅ User profiles fetched successfully:', profiles?.length || 0);
      setAllProfiles(profiles || []);
    } catch (error) {
      console.error('💥 Unexpected error in fetchAllProfiles:', error);
      toast({
        title: 'System Error',
        description: 'An unexpected error occurred while fetching user profile data.',
        variant: 'destructive',
      });
    }
  };

  // Create a new subaccount with organization
  const createSubaccount = async (data: CreateSubaccountData): Promise<boolean> => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admins can create subaccounts',
        variant: 'destructive',
      });
      return false;
    }

    if (!supabaseAdmin) {
      toast({
        title: 'Configuration Error',
        description: 'Service role key not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Step 1: Create the user account using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

      if (authError) {
        toast({
          title: 'Error Creating User',
          description: authError.message,
          variant: 'destructive',
        });
        return false;
      }

      const newUserId = authData.user.id;

      // Step 2: Update the user profile with username and set created_by
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: data.username,
          created_by: userProfile.user_id,
        })
        .eq('user_id', newUserId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast({
          title: 'Error',
          description: 'Failed to update user profile',
          variant: 'destructive',
        });
        return false;
      }

      // Step 3: Create the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          description: data.organizationDescription,
          owner_id: newUserId,
          created_by: userProfile.user_id,
        });

      if (orgError) {
        console.error('Error creating organization:', orgError);
        toast({
          title: 'Error',
          description: 'Failed to create organization',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: `Subaccount "${data.username}" created successfully`,
      });

      // Refresh data
      await fetchAllOrganizations();
      await fetchAllProfiles();

      return true;
    } catch (error) {
      console.error('Error in createSubaccount:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admins can modify user status',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update user status',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      await fetchAllProfiles();
      return true;
    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      return false;
    }
  };

  // Delete subaccount and organization
  const deleteSubaccount = async (userId: string): Promise<boolean> => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admins can delete subaccounts',
        variant: 'destructive',
      });
      return false;
    }

    if (!supabaseAdmin) {
      toast({
        title: 'Configuration Error',
        description: 'Service role key not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Delete the user using admin client (this will cascade delete profile and organization due to foreign keys)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete subaccount',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Subaccount deleted successfully',
      });

      await fetchAllOrganizations();
      await fetchAllProfiles();
      return true;
    } catch (error) {
      console.error('Error in deleteSubaccount:', error);
      return false;
    }
  };

  // Get organization ID for current user (for data isolation)
  const getCurrentOrganizationId = (): string | null => {
    return userOrganization?.id || null;
  };

  // Check if current user is admin
  const isAdmin = (): boolean => {
    return userProfile?.role === 'admin';
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchUserProfile();
      setLoading(false);
    };

    initializeData();
  }, []);

  // Fetch organization data when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      fetchUserOrganization();
      if (userProfile.role === 'admin') {
        fetchAllOrganizations();
        fetchAllProfiles();
      }
    }
  }, [userProfile]);

  return {
    userProfile,
    userOrganization,
    allOrganizations,
    allProfiles,
    loading,
    createSubaccount,
    toggleUserStatus,
    deleteSubaccount,
    getCurrentOrganizationId,
    isAdmin,
    refreshData: () => {
      fetchUserProfile();
      fetchUserOrganization();
      if (userProfile?.role === 'admin') {
        fetchAllOrganizations();
        fetchAllProfiles();
      }
    },
  };
}; 