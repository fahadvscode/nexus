import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, Organization } from '@/hooks/useUserManagement';

export interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedProfile: UserProfile | null;
  impersonatedOrganization: Organization | null;
}

export interface ImpersonationActions {
  switchToSubAccount: (userId: string) => Promise<boolean>;
  exitImpersonation: () => void;
  getActiveOrganizationId: () => string | null;
  getActiveProfile: (adminProfile: UserProfile | null) => UserProfile | null;
}

export const useAdminImpersonation = (adminProfile: UserProfile | null, isAdmin: boolean) => {
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const [impersonatedOrganization, setImpersonatedOrganization] = useState<Organization | null>(null);
  const { toast } = useToast();

  const switchToSubAccount = async (userId: string): Promise<boolean> => {
    if (!isAdmin || !adminProfile) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can switch to sub-accounts',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Fetch the sub-account profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'subaccount')
        .single();

      if (profileError || !profileData) {
        toast({
          title: 'Error',
          description: 'Failed to load sub-account profile',
          variant: 'destructive',
        });
        return false;
      }

      // Fetch the sub-account's organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (orgError || !orgData) {
        toast({
          title: 'Error',
          description: 'Failed to load sub-account organization',
          variant: 'destructive',
        });
        return false;
      }

      setImpersonatedProfile(profileData);
      setImpersonatedOrganization(orgData);

      toast({
        title: 'Success',
        description: `Switched to ${profileData.username || profileData.email}'s account`,
      });

      return true;
    } catch (error) {
      console.error('Error switching to sub-account:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch to sub-account',
        variant: 'destructive',
      });
      return false;
    }
  };

  const exitImpersonation = () => {
    setImpersonatedProfile(null);
    setImpersonatedOrganization(null);
    toast({
      title: 'Success',
      description: 'Switched back to admin view',
    });
  };

  const getActiveOrganizationId = (): string | null => {
    return impersonatedOrganization?.id || null;
  };

  const getActiveProfile = (adminProfile: UserProfile | null): UserProfile | null => {
    return impersonatedProfile || adminProfile;
  };

  return {
    // State
    isImpersonating: !!impersonatedProfile,
    impersonatedProfile,
    impersonatedOrganization,
    // Actions
    switchToSubAccount,
    exitImpersonation,
    getActiveOrganizationId,
    getActiveProfile,
  };
}; 