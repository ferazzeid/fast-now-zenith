import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Link, CheckCircle, RefreshCw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAdminGoalManagement } from '@/hooks/useEnhancedAdminGoalManagement';
import { getDisplayWebsiteUrl } from '@/utils/urlUtils';

export const AdminFixGoalUrls = () => {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const { toast } = useToast();
  const { fixAllGoalIdeasUrls } = useEnhancedAdminGoalManagement();

  const handleFixUrls = async () => {
    try {
      setFixing(true);
      await fixAllGoalIdeasUrls();
      setFixed(true);
      
      toast({
        title: "URLs Fixed!",
        description: "All goal idea URLs have been updated with proper website links.",
      });
    } catch (error) {
      console.error('Error fixing URLs:', error);
      toast({
        title: "Error",
        description: "Failed to fix goal idea URLs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Fix Goal Idea URLs
        </CardTitle>
        <CardDescription>
          Update all goal ideas to have proper website URLs for "Read More" links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Website Base URL:</p>
            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">{getDisplayWebsiteUrl()}</code>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Current Issue:</p>
            <p>Most goal ideas have null linkUrl values or relative URLs, preventing "Read More" links from working properly.</p>
          </div>
        </div>

        {fixed && (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Fixed!</p>
              <p>All goal ideas now have proper website URLs for their "Read More" links.</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This will:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Generate proper website URLs from system motivator slugs</li>
            <li>• Convert relative URLs (/motivators/...) to absolute URLs (https://...)</li>
            <li>• Enable "Read More" buttons for all applicable goal ideas</li>
          </ul>
        </div>

        <Button
          onClick={handleFixUrls}
          disabled={fixing}
          className="w-full"
        >
          {fixing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {fixing ? 'Fixing URLs...' : 'Fix All Goal Idea URLs'}
        </Button>
      </CardContent>
    </Card>
  );
};