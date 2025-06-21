
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export const SecuritySettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Settings</span>
        </CardTitle>
        <CardDescription>
          Configure security and access controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <p className="text-gray-500">Security settings will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
};
