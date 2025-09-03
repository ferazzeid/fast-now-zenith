import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { useSystemMotivators } from '@/hooks/useSystemMotivators';
import { useAdminGoalIdeas } from '@/hooks/useAdminGoalIdeas';

export const AdminGoalManagementSection: React.FC = () => {
  const { systemMotivators, loading: systemLoading, refetch: refetchSystem } = useSystemMotivators();
  const { goalIdeas, loading: goalIdeasLoading, refreshGoalIdeas } = useAdminGoalIdeas();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Unified Goal Management
          <Badge variant="outline" className="text-xs">
            System Motivators Primary Source
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="system">System Motivators</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{systemMotivators.length}</div>
                  <p className="text-xs text-muted-foreground">System Motivators (Primary Source)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{goalIdeas.length}</div>
                  <p className="text-xs text-muted-foreground">Active Goal Ideas (From System)</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={refetchSystem}
                disabled={systemLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
                Refresh System Data
              </Button>
              <Button 
                variant="outline"
                onClick={refreshGoalIdeas}
                disabled={goalIdeasLoading}
                className="flex items-center gap-2"
              >
                <Settings className={`h-4 w-4 ${goalIdeasLoading ? 'animate-spin' : ''}`} />
                Refresh Goal Ideas
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Unified System Status:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>✅ Single Source of Truth:</strong> All data comes from system_motivators table</li>
                    <li><strong>✅ Website Compatible:</strong> Website project reads from same system_motivators table</li>
                    <li><strong>✅ No Sync Required:</strong> Changes are immediately available everywhere</li>
                    <li><strong>✅ Better Performance:</strong> Direct SQL queries instead of JSON parsing</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Motivators (Primary Source)</h3>
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
                        {motivator.slug && (
                          <span className="ml-2 text-blue-600">• Slug: /{motivator.slug}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">📝 To manage system motivators:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the Goal Ideas Library page (/motivator-ideas) for editing</li>
                  <li>Changes made there directly update the system_motivators table</li>
                  <li>All updates are immediately visible to both app and website</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};