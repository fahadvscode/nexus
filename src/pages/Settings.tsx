
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Users, Shield, Bell, Database, Mail, Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserRole } from "@/components/UserRoleProvider";
import { AdminPasswordModal } from "@/components/AdminPasswordModal";
import { TwilioSettings } from "@/components/settings/TwilioSettings";
import { PhoneNumberManager } from "@/components/settings/PhoneNumberManager";
import UserManagement from "@/components/settings/UserManagement";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DatabaseSettings } from "@/components/settings/DatabaseSettings";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { CalendarSettings } from "@/components/settings/CalendarSettings";

const Settings = () => {
  const { userRole, isAdmin } = useUserRole();
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your CRM configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={isAdmin() ? 'default' : 'secondary'}>
                {isAdmin() ? 'Admin' : 'Subaccount'}
              </Badge>
              {!isAdmin() && (
                <Button variant="outline" size="sm" onClick={() => setShowAdminModal(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Admin Access
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="twilio" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Twilio</span>
            </TabsTrigger>
            <TabsTrigger value="phone-numbers" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Phone Numbers</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Database</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarSettings />
          </TabsContent>

          <TabsContent value="twilio">
            <TwilioSettings />
          </TabsContent>

          <TabsContent value="phone-numbers">
            <PhoneNumberManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseSettings />
          </TabsContent>
        </Tabs>
      </main>

      <AdminPasswordModal 
        open={showAdminModal} 
        onOpenChange={setShowAdminModal}
      />
    </div>
  );
};

export default Settings;
