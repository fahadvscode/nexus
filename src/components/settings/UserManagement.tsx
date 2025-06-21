
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const UserManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>User Management</span>
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <p className="text-gray-500">User management features will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
};
