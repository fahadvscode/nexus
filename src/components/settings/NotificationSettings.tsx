
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export const NotificationSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notification Settings</span>
        </CardTitle>
        <CardDescription>
          Configure email and push notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <p className="text-gray-500">Notification settings will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
};
