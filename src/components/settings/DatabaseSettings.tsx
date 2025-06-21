
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

export const DatabaseSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Database Settings</span>
        </CardTitle>
        <CardDescription>
          Manage database connections and backups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <p className="text-gray-500">Database settings will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
};
