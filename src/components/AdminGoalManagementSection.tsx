import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useStaticSystemMotivators } from '@/hooks/useStaticSystemMotivators';
import { useAdminGoalIdeas } from '@/hooks/useAdminGoalIdeas';

export const AdminGoalManagementSection: React.FC = () => {
  const { systemMotivators, loading: systemLoading } = useStaticSystemMotivators();
  const { goalIdeas, loading: goalIdeasLoading, forceRefresh: refreshGoalIdeas } = useAdminGoalIdeas();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Goal Management
          <Badge variant="outline" className="text-xs">
            Unified System Motivators
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
                  <p className="text-xs text-muted-foreground">System Motivators (Active)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{goalIdeas.length}</div>
                  <p className="text-xs text-muted-foreground">Available Goal Ideas</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                disabled
                className="flex items-center gap-2 opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                System Data (Static)
              </Button>
              <Button 
                variant="outline"
                onClick={refreshGoalIdeas}
                disabled={goalIdeasLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${goalIdeasLoading ? 'animate-spin' : ''}`} />
                Refresh Goal Ideas
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Unified Goal Management:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Single Source:</strong> All goal ideas now come directly from system_motivators table</li>
                    <li><strong>Real-time:</strong> Changes are immediately reflected across the app and website</li>
                    <li><strong>Simplified:</strong> No more synchronization between different data sources</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Motivators</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Static Data • No Refresh Needed
              </div>
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
                    className="flex items-center justify-between p-3 border-subtle rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{motivator.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {motivator.category} • Order: {motivator.display_order}
                        {motivator.slug && (
                          <span className="ml-2 text-accent-foreground">• /{motivator.slug}</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={motivator.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {motivator.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};