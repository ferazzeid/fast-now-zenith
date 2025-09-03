import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useSystemMotivators } from '@/hooks/useSystemMotivators';
import { useEnhancedAdminGoalManagement } from '@/hooks/useEnhancedAdminGoalManagement';
import { useAdminGoalIdeas } from '@/hooks/useAdminGoalIdeas';
import { AdminFixGoalUrls } from '@/components/AdminFixGoalUrls';
import { toast } from 'sonner';

export const AdminGoalManagementSection: React.FC = () => {
  const { systemMotivators, loading: systemLoading, refetch: refetchSystem } = useSystemMotivators();
  const { goalIdeas, loading: goalIdeasLoading, forceRefresh: refreshGoalIdeas } = useAdminGoalIdeas();
  const { 
    syncAllSystemMotivatorsToGoalIdeas, 
    addSystemMotivatorToGoalIdeas,
    loading: enhancedLoading 
  } = useEnhancedAdminGoalManagement();

  const [syncing, setSyncing] = useState(false);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      await syncAllSystemMotivatorsToGoalIdeas();
      await refreshGoalIdeas();
      toast.success('Successfully synced all system motivators to goal ideas');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync system motivators');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddToGoalIdeas = async (systemMotivatorId: string) => {
    try {
      await addSystemMotivatorToGoalIdeas(systemMotivatorId);
      await refreshGoalIdeas();
      toast.success('System motivator added to goal ideas');
    } catch (error) {
      console.error('Add failed:', error);
      toast.error('Failed to add to goal ideas');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Goal Management
          <Badge variant="outline" className="text-xs">
            Enhanced with System Motivators
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="system">System Motivators</TabsTrigger>
            <TabsTrigger value="goal-ideas">Goal Ideas</TabsTrigger>
            <TabsTrigger value="fix-urls">Fix URLs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{systemMotivators.length}</div>
                  <p className="text-xs text-muted-foreground">System Motivators</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{goalIdeas.length}</div>
                  <p className="text-xs text-muted-foreground">Goal Ideas</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSyncAll}
                disabled={syncing || enhancedLoading}
                className="flex items-center gap-2"
              >
                <ArrowLeftRight className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync All to Goal Ideas
              </Button>
              <Button 
                variant="outline"
                onClick={refetchSystem}
                disabled={systemLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">About Goal Management:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>System Motivators:</strong> Structured motivators in the database with proper admin controls</li>
                    <li><strong>Goal Ideas:</strong> Legacy system stored in shared_settings (JSON format)</li>
                    <li><strong>Sync:</strong> Copy system motivators to goal ideas for backward compatibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Motivators</h3>
              <Button 
                onClick={refetchSystem}
                disabled={systemLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${systemLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {systemLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading system motivators...
              </div>
            ) : systemMotivators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No system motivators found
              </div>
            ) : (
              <div className="space-y-2">
                {systemMotivators.map((motivator) => (
                  <div 
                    key={motivator.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{motivator.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {motivator.category} • Order: {motivator.display_order}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddToGoalIdeas(motivator.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Add to Goal Ideas
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="goal-ideas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Goal Ideas (Legacy)</h3>
              <Button 
                onClick={refreshGoalIdeas}
                disabled={goalIdeasLoading}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${goalIdeasLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {goalIdeasLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading goal ideas...
              </div>
            ) : goalIdeas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No goal ideas found
              </div>
            ) : (
              <div className="space-y-2">
                {goalIdeas.map((idea, index) => (
                  <div 
                    key={idea.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{idea.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {idea.category}
                        {idea.linkUrl && (
                          <span className="ml-2 text-blue-600">• Has Link</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Legacy
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fix-urls" className="space-y-4">
            <AdminFixGoalUrls />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};