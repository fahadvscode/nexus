import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Upload, Calendar, Settings, Phone, LogOut, Building, User } from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";
import { useUserManagement } from "@/hooks/useUserManagement";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { useUser } from "@supabase/auth-helpers-react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { ReinitializeSupabaseButton } from "@/components/ReinitializeSupabaseButton";

export const DashboardHeader = ({ onAddClient, onBulkUpload }: { onAddClient: () => void, onBulkUpload: () => void }) => {
  const { userProfile, userRole, isAdmin } = useUserRole();
  const { userOrganization } = useUserManagement();
  const [search, setSearch] = useState("");
  const user = useUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getUserInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.substring(0, 2).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <ImpersonationBanner />
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <TeamSwitcher />
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <ReinitializeSupabaseButton />
            {user && <UserNav user={user} />}
          </div>
        </div>
      </div>
    </>
  );
};
