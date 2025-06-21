import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import LoginPage from "@/pages/Login";
import { useUserManagement, UserProfile, UserRole } from "@/hooks/useUserManagement";

interface UserRoleContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  userRole: UserRole;
  blurEnabled: boolean;
  setBlurEnabled: (enabled: boolean) => void;
  toggleBlur: () => void;
  isAdmin: () => boolean;
  getCurrentOrganizationId: () => string | null;
  refreshUserData: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const UserRoleProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  
  const { 
    userProfile, 
    userOrganization,
    isAdmin: checkIsAdmin, 
    getCurrentOrganizationId,
    refreshData 
  } = useUserManagement();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set blur based on user role
  useEffect(() => {
    if (userProfile) {
      // Admin users start with blur disabled, subaccounts start with blur enabled
      setBlurEnabled(userProfile.role === 'subaccount');
    }
  }, [userProfile]);

  const toggleBlur = () => setBlurEnabled(!blurEnabled);

  const value = {
    session,
    userProfile,
    userRole: (userProfile?.role as UserRole) || 'subaccount',
    blurEnabled,
    setBlurEnabled,
    toggleBlur,
    isAdmin: checkIsAdmin,
    getCurrentOrganizationId,
    refreshUserData: refreshData,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If user is not authenticated, show login
  if (!session) {
    return <LoginPage />;
  }

  // If user is authenticated but no profile exists yet, show loading
  // (This can happen briefly after signup while the trigger creates the profile)
  if (!userProfile) {
    return <div className="flex items-center justify-center h-screen">Setting up your account...</div>;
  }

  // If user is inactive, show access denied
  if (!userProfile.is_active) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h1>
          <p className="text-gray-600">Your account has been deactivated. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};
