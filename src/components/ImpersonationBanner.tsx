import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/components/UserRoleProvider';
import { ArrowLeft, User, Building } from 'lucide-react';

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedProfile, exitImpersonation, isAdmin } = useUserRole();

  // Only show for admins who are impersonating
  if (!isAdmin() || !isImpersonating || !impersonatedProfile) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <User className="h-3 w-3 mr-1" />
              Impersonating
            </Badge>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {impersonatedProfile.username || impersonatedProfile.email}
              </span>
            </div>
            <span className="text-sm text-yellow-600">
              You are viewing data as this sub-account user
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exitImpersonation}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImpersonationBanner; 