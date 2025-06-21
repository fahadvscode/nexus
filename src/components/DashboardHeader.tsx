
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Upload, Calendar, Lock, User, Settings, Phone } from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";
import { AdminPasswordModal } from "@/components/AdminPasswordModal";
import { Link } from "react-router-dom";

export const DashboardHeader = ({ onAddClient, onBulkUpload }: { onAddClient: () => void, onBulkUpload: () => void }) => {
  const { userRole, switchToSubaccount } = useUserRole();
  const [search, setSearch] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <>
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
              {userRole === 'admin' && (
                <Link to="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              )}
              {userRole === 'admin' && (
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
                <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                  {userRole === 'admin' ? 'Admin' : 'Subaccount'}
                </Badge>
                {userRole === 'admin' ? (
                  <Button variant="outline" size="sm" onClick={switchToSubaccount}>
                    <User className="h-4 w-4 mr-2" />
                    Switch to Subaccount
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowAdminModal(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Admin Access
                  </Button>
                )}
              </div>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <AdminPasswordModal 
        open={showAdminModal} 
        onOpenChange={setShowAdminModal}
      />
    </>
  );
};
