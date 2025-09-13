import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Globe } from 'lucide-react';
import { getDisplayWebsiteUrl } from '@/utils/urlUtils';

export const AdminFixGoalUrls = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Goal Idea URLs - Unified System
        </CardTitle>
        <CardDescription>
          URL management is now handled automatically through the unified system motivators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Unified System Active</p>
            <p>All goal ideas now come directly from system_motivators table with proper URL handling.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Website Base URL:</p>
            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">{getDisplayWebsiteUrl()}</code>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            Benefits of the unified system:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Single source of truth: system_motivators table</li>
            <li>• Automatic URL generation from slugs</li>
            <li>• Real-time sync between app and website</li>
            <li>• No more manual URL fixing needed</li>
            <li>• Consistent data across all platforms</li>
          </ul>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The legacy admin_goal_ideas system has been removed. 
            All goal management now happens through the system_motivators table, 
            providing better performance and consistency.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};