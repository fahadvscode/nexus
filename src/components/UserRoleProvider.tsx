
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import LoginPage from "@/pages/Login";

export type UserRole = "admin" | "subaccount";

interface UserRoleContextType {
  session: Session | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  blurEnabled: boolean;
  setBlurEnabled: (enabled: boolean) => void;
  toggleBlur: () => void;
  switchToAdmin: (password: string) => boolean;
  switchToSubaccount: () => void;
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

const ADMIN_PASSWORD = "admin123"; // In a real app, use a secure method

export const UserRoleProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("subaccount");
  const [blurEnabled, setBlurEnabled] = useState(true);

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

  const toggleBlur = () => setBlurEnabled(!blurEnabled);

  const switchToAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setUserRole("admin");
      setBlurEnabled(false);
      return true;
    }
    return false;
  };

  const switchToSubaccount = () => {
    setUserRole("subaccount");
    setBlurEnabled(true);
  };

  const value = {
    session,
    userRole,
    setUserRole,
    blurEnabled,
    setBlurEnabled,
    toggleBlur,
    switchToAdmin,
    switchToSubaccount,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <UserRoleContext.Provider value={value}>
      {session ? children : <LoginPage />}
    </UserRoleContext.Provider>
  );
};
