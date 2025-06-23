import React from 'react';
import { useUserRole } from './UserRoleProvider';
import { Badge } from '@/components/ui/badge';

const DebugInfo = () => {
  const { userProfile, session, userRole, isAdmin } = useUserRole();

  // Enhanced debugging information
  const debugInfo = {
    sessionEmail: session?.user?.email || 'No session',
    profileEmail: userProfile?.email || 'No profile',
    profileRole: userProfile?.role || 'No role',
    userRoleVar: userRole,
    isAdminResult: isAdmin(),
    sessionUserId: session?.user?.id || 'No session ID',
    profileUserId: userProfile?.user_id || 'No profile user ID',
    isActive: userProfile?.is_active,
    timestamp: new Date().toLocaleTimeString()
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg z-50 max-w-sm text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-orange-400 font-bold">🐞 Enhanced Debug Panel</span>
        <Badge variant={isAdmin() ? 'default' : 'secondary'} className="text-xs">
          {isAdmin() ? 'ADMIN' : 'SUBACCOUNT'}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div><strong>Session Email:</strong> {debugInfo.sessionEmail}</div>
        <div><strong>Profile Email:</strong> {debugInfo.profileEmail}</div>
        <div><strong>Profile Role:</strong> 
          <span className={`ml-1 px-1 rounded ${userProfile?.role === 'admin' ? 'bg-green-600' : 'bg-blue-600'}`}>
            {debugInfo.profileRole}
          </span>
        </div>
        <div><strong>User Role Var:</strong> {debugInfo.userRoleVar}</div>
        <div><strong>Is Admin?:</strong> 
          <span className={`ml-1 ${isAdmin() ? 'text-green-400' : 'text-blue-400'}`}>
            {isAdmin() ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div><strong>Active:</strong> 
          <span className={`ml-1 ${userProfile?.is_active ? 'text-green-400' : 'text-red-400'}`}>
            {userProfile?.is_active ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div><strong>Session ID:</strong> {debugInfo.sessionUserId?.substring(0, 8)}...</div>
        <div><strong>Profile ID:</strong> {debugInfo.profileUserId?.substring(0, 8)}...</div>
        <div className="text-gray-400 text-xs mt-2">Updated: {debugInfo.timestamp}</div>
        
        {/* Session/Profile Mismatch Warning */}
        {debugInfo.sessionEmail !== debugInfo.profileEmail && (
          <div className="bg-red-600 text-white px-2 py-1 rounded mt-2">
            ⚠️ SESSION MISMATCH!
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInfo; 