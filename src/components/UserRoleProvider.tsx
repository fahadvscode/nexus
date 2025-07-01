import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import LoginPage from "@/pages/Login";
import { useUserManagement, UserProfile, UserRole } from "@/hooks/useUserManagement";
import { useAdminImpersonation } from "@/hooks/useAdminImpersonation";

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
  forceLogout: () => void;
  // Impersonation
  isImpersonating: boolean;
  impersonatedProfile: UserProfile | null;
  switchToSubAccount: (userId: string) => Promise<boolean>;
  exitImpersonation: () => void;
  getActiveProfile: () => UserProfile | null;
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
  const [authValidated, setAuthValidated] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const { 
    userProfile, 
    userOrganization,
    isAdmin: checkIsAdmin, 
    getCurrentOrganizationId,
    refreshData 
  } = useUserManagement();
  
  // Initialize impersonation hook
  const impersonation = useAdminImpersonation(userProfile, checkIsAdmin());

  // Force logout function
  const forceLogout = async () => {
    console.log("🔴 FORCE LOGOUT: Clearing all authentication state");
    setSession(null);
    setAuthValidated(false);
    setLoading(false);
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
  };

  // Validate session matches profile - CRITICAL security check
  const validateSessionProfile = () => {
    if (!session || !userProfile) {
      console.log("🔍 Session/Profile validation: Missing session or profile");
      return false;
    }

    const sessionEmail = session.user.email;
    const profileEmail = userProfile.email;
    
    console.log("🔍 CRITICAL SESSION VALIDATION:");
    console.log("Session Email:", sessionEmail);
    console.log("Profile Email:", profileEmail);
    console.log("Session User ID:", session.user.id);
    console.log("Profile User ID:", userProfile.user_id);

    // STRICT validation - emails and user IDs must match
    if (sessionEmail !== profileEmail || session.user.id !== userProfile.user_id) {
      console.error("🚨 AUTHENTICATION MISMATCH DETECTED!");
      console.error("Session does not match profile - forcing logout");
      forceLogout();
      return false;
    }

    // Additional role validation based on email
    let expectedRole: UserRole;
    if (sessionEmail === 'info@fahadsold.com') {
      expectedRole = 'admin';
    } else if (sessionEmail === 'nav@fahadsold.com') {
      expectedRole = 'subaccount';
    } else {
      expectedRole = 'subaccount'; // Default for other users
    }

    if (userProfile.role !== expectedRole) {
      console.error(`🚨 ROLE MISMATCH: ${sessionEmail} should be ${expectedRole} but is ${userProfile.role}`);
      forceLogout();
      return false;
    }

    console.log("✅ Session validation passed");
    return true;
  };

  useEffect(() => {
    const getSession = async () => {
      console.log("🔄 Getting initial session...");
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change:", event, session?.user?.email);
      setSession(session);
      // Only reset validation on major auth events, not on token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log(`🚀 Major auth event: ${event}. Resetting validation.`);
        setAuthValidated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validate authentication when session and profile are available
  useEffect(() => {
    if (session && userProfile && !authValidated) {
      console.log("🔐 Running authentication validation...");
      const isValid = validateSessionProfile();
      setAuthValidated(isValid);
      if (isValid && !initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    }
  }, [session, userProfile, authValidated, initialLoadComplete]);

  // Set blur based on user role
  useEffect(() => {
    if (userProfile) {
      // Admin users start with blur disabled, subaccounts start with blur enabled
      setBlurEnabled(userProfile.role === 'subaccount');
    }
  }, [userProfile]);

  const toggleBlur = () => setBlurEnabled(!blurEnabled);

  // Enhanced admin check with email validation
  const isAdminCheck = (): boolean => {
    if (!session || !userProfile || !authValidated) {
      return false;
    }
    
    // Double validation: role AND email
    const isAdminByRole = userProfile.role === 'admin';
    const isAdminByEmail = session.user.email === 'info@fahadsold.com';
    
    if (isAdminByRole !== isAdminByEmail) {
      console.error("🚨 ADMIN CHECK MISMATCH - forcing logout");
      forceLogout();
      return false;
    }
    
    return isAdminByRole && isAdminByEmail;
  };

  const value = {
    session,
    userProfile,
    userRole: (userProfile?.role as UserRole) || 'subaccount',
    blurEnabled,
    setBlurEnabled,
    toggleBlur,
    isAdmin: isAdminCheck,
    getCurrentOrganizationId: impersonation.isImpersonating ? impersonation.getActiveOrganizationId : getCurrentOrganizationId,
    refreshUserData: refreshData,
    forceLogout,
    // Impersonation
    isImpersonating: impersonation.isImpersonating,
    impersonatedProfile: impersonation.impersonatedProfile,
    switchToSubAccount: impersonation.switchToSubAccount,
    exitImpersonation: impersonation.exitImpersonation,
    getActiveProfile: () => impersonation.getActiveProfile(userProfile),
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If user is not authenticated, show login
  if (!session) {
    return <LoginPage />;
  }

  // Block rendering only on initial load. After that, render children even if profile is refreshing.
  if (!initialLoadComplete && !userProfile) {
    return <div className="flex items-center justify-center h-screen">Setting up your account...</div>;
  }

  // If auth is being re-validated after initial load, don't block rendering
  if (!authValidated && initialLoadComplete) {
    console.log("⏳ Re-validating session in background, not blocking UI...");
  } else if (!authValidated) {
    console.log("⏳ Authentication validation in progress, but not blocking UI...");
  }

  // If user is inactive, show access denied. Check for profile existence first.
  if (userProfile && !userProfile.is_active) {
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
