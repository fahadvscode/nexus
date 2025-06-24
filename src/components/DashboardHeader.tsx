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

export const DashboardHeader = ({ onAddClient, onBulkUpload }: { onAddClient: () => void, onBulkUpload: () => void }) => {
  const { userProfile, userRole, isAdmin } = useUserRole();
  const { userOrganization } = useUserManagement();
  const [search, setSearch] = useState("");

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
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search clients..."
                className="pl-10 pr-3 py-2 w-64 sm:w-96 rounded-md border-gray-300 focus:ring-primary focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/calendar">
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            
            <Link to="/call-history">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Calls
              </Button>
            </Link>
            
            {isAdmin() && (
              <Link to="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
            
            {(isAdmin() || userRole === 'subaccount') && (
              <>
                <Button variant="outline" size="sm" onClick={onBulkUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button onClick={onAddClient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <Badge variant={isAdmin() ? 'default' : 'secondary'}>
                    {isAdmin() ? 'Admin' : 'Subaccount'}
                  </Badge>
                  {userOrganization && !isAdmin() && (
                    <Badge variant="outline" className="text-xs">
                      <Building className="h-3 w-3 mr-1" />
                      {userOrganization.name}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userProfile?.username || userProfile?.email}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="User avatar" />
                      <AvatarFallback className="text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile?.username || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email}
                      </p>
                      {userOrganization && !isAdmin() && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {userOrganization.name}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
