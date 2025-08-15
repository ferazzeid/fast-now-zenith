import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Debug component to investigate admin role persistence issues
 * This should only be visible to admins
 */
export const AdminUploadDebugger = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, refetch: refetchAdmin } = useAdminRole();
  const { isAdmin: unifiedIsAdmin, loading: unifiedLoading } = useUnifiedSubscription();

  // Only show for admins
  if (!isAdmin && !adminLoading) {
    return null;
  }

  const handleRefreshRoles = () => {
    refetchAdmin();
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🛠️ Admin Upload Debugger
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRoles}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Roles
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Auth Status</h4>
            <div className="space-y-1 text-sm">
              <div>User ID: <code className="bg-muted px-1 rounded">{user?.id}</code></div>
              <div>Email: <code className="bg-muted px-1 rounded">{user?.email}</code></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Role Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">useAdminRole:</span>
                <Badge variant={isAdmin ? "default" : "secondary"}>
                  {adminLoading ? "Loading..." : isAdmin ? "Admin" : "Not Admin"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">useUnifiedSubscription:</span>
                <Badge variant={unifiedIsAdmin ? "default" : "secondary"}>
                  {unifiedLoading ? "Loading..." : unifiedIsAdmin ? "Admin" : "Not Admin"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Upload Permissions</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>✅ Should work:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Upload to food-images bucket</li>
                <li>• Admin path: default-foods/*</li>
                <li>• User path: {user?.id}/*</li>
              </ul>
            </div>
            <div>
              <strong>❌ Common issues:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Role cache not refreshed</li>
                <li>• Storage policy mismatch</li>
                <li>• Auth context inconsistency</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-xs text-muted-foreground">
            <strong>Debugging info:</strong> If uploads still fail after seeing "Admin" status above, 
            check the browser console for detailed error messages from the storage upload process.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};