import { useUserRole } from "./UserRoleProvider";

export const DebugInfo = () => {
  const { userProfile, isAdmin, getCurrentOrganizationId } = useUserRole();

  if (!isAdmin()) {
    return null; // Only show for admins
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-xl z-50 w-96 border border-yellow-400">
      <h3 className="text-lg font-bold text-yellow-300 mb-2">🐞 Admin Debug Panel</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-semibold text-gray-400">Email:</span>
          <span className="ml-2 font-mono">{userProfile?.email || 'N/A'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-400">User Role:</span>
          <span className="ml-2 font-mono bg-yellow-200 text-yellow-900 px-2 py-1 rounded">{userProfile?.role || 'N/A'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-400">Is Admin?:</span>
          <span className="ml-2 font-mono">{isAdmin() ? '✅ Yes' : '❌ No'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-400">Organization ID:</span>
          <span className="ml-2 font-mono">{getCurrentOrganizationId() || 'N/A'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-400">Active:</span>
          <span className="ml-2 font-mono">{userProfile?.is_active ? '✅ Yes' : '❌ No'}</span>
        </div>
      </div>
    </div>
  );
}; 