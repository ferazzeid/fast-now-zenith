import React, { useState } from 'react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown, Bug, CheckCircle } from 'lucide-react';

export const SubscriptionDebugPanel = () => {
  const { isAdmin } = useAdminRole();
  const [isOpen, setIsOpen] = useState(false);
  
  const unified = useUnifiedSubscription();

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="mb-2">
            <Bug className="w-4 h-4 mr-2" />
            Subscription Debug
            <Badge variant="secondary" className="ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Unified
            </Badge>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-96 max-h-96 overflow-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Unified Subscription Debug
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    unified.refetch();
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </CardTitle>
              <CardDescription>
                All components now use unified subscription - no more inconsistencies!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Tabs defaultValue="status">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="debug">Debug</TabsTrigger>
                </TabsList>
                
                <TabsContent value="status" className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Subscribed</div>
                      <div className="text-green-600">{String(unified.subscribed)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Status</div>
                      <div className="text-blue-600">{unified.subscription_status}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">In Trial</div>
                      <div className="text-orange-600">{String(unified.inTrial)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Premium Features</div>
                      <div className="text-purple-600">{String(unified.hasPremiumFeatures)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Platform</div>
                      <div className="text-indigo-600">{unified.platform}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Provider</div>
                      <div className="text-pink-600">{unified.payment_provider}</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="debug" className="space-y-3">
                  {unified.debug && (
                    <div className="text-xs space-y-2">
                      <div><strong>Source:</strong> {unified.debug.source}</div>
                      <div><strong>Platform:</strong> {unified.debug.platform_detection?.detected_platform}</div>
                      <div><strong>Capacitor:</strong> {String(unified.debug.platform_detection?.capacitor)}</div>
                      <div><strong>Login Method:</strong> {unified.login_method}</div>
                      <div><strong>User Agent:</strong> 
                        <div className="text-xs text-gray-500 break-all">
                          {unified.debug.platform_detection?.user_agent?.substring(0, 100)}...
                        </div>
                      </div>
                      {unified.debug.platform_detection?.subscription_sources && (
                        <div>
                          <strong>Subscription Sources:</strong>
                          <div className="ml-2 text-xs">
                            • Stripe: {String(unified.debug.platform_detection.subscription_sources.stripe)}<br/>
                            • Google Play: {String(unified.debug.platform_detection.subscription_sources.google_play)}<br/>
                            • Apple: {String(unified.debug.platform_detection.subscription_sources.apple)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};