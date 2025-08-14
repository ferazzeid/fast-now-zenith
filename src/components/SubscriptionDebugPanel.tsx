import React, { useState } from 'react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useOptimizedSubscription } from '@/hooks/optimized/useOptimizedSubscription';
import { useMultiPlatformSubscription } from '@/hooks/useMultiPlatformSubscription';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown, Bug, AlertTriangle } from 'lucide-react';

export const SubscriptionDebugPanel = () => {
  const { isAdmin } = useAdminRole();
  const [isOpen, setIsOpen] = useState(false);
  
  const unified = useUnifiedSubscription();
  const optimized = useOptimizedSubscription();
  const multiPlatform = useMultiPlatformSubscription();

  if (!isAdmin) return null;

  const hooks = [
    { name: 'Unified', data: unified, color: 'bg-blue-500' },
    { name: 'Optimized', data: optimized, color: 'bg-green-500' },
    { name: 'MultiPlatform', data: multiPlatform, color: 'bg-purple-500' },
  ];

  const getInconsistencies = () => {
    const inconsistencies = [];
    
    // Check subscription status
    if (unified.subscribed !== optimized.subscribed || unified.subscribed !== multiPlatform.subscribed) {
      inconsistencies.push('Subscribed status differs between hooks');
    }
    
    // Check subscription tier
    if (unified.subscription_tier !== optimized.subscription_tier || unified.subscription_tier !== multiPlatform.subscription_tier) {
      inconsistencies.push('Subscription tier differs between hooks');
    }
    
    // Check premium features
    if (unified.hasPremiumFeatures !== optimized.hasPremiumFeatures || unified.hasPremiumFeatures !== multiPlatform.hasPremiumFeatures) {
      inconsistencies.push('Premium features access differs between hooks');
    }
    
    // Check platform consistency
    if (unified.platform !== multiPlatform.platform) {
      inconsistencies.push('Platform detection differs between hooks');
    }
    
    return inconsistencies;
  };

  const inconsistencies = getInconsistencies();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="mb-2">
            <Bug className="w-4 h-4 mr-2" />
            Subscription Debug
            {inconsistencies.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {inconsistencies.length}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-96 max-h-96 overflow-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Subscription Debug Panel
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    unified.refetch();
                    optimized.refetch();
                    multiPlatform.checkSubscription();
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </CardTitle>
              {inconsistencies.length > 0 && (
                <CardDescription>
                  <div className="flex items-center text-red-500">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {inconsistencies.length} inconsistencies detected
                  </div>
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {inconsistencies.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold text-red-700 mb-2">Inconsistencies:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {inconsistencies.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Tabs defaultValue="comparison">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="comparison">Compare</TabsTrigger>
                  <TabsTrigger value="debug">Debug</TabsTrigger>
                </TabsList>
                
                <TabsContent value="comparison" className="space-y-3">
                  {['subscribed', 'subscription_tier', 'isPaidUser', 'hasPremiumFeatures', 'platform'].map((field) => (
                    <div key={field} className="space-y-1">
                      <div className="text-xs font-medium">{field}:</div>
                      <div className="grid grid-cols-3 gap-1">
                        {hooks.map((hook) => (
                          <div key={hook.name} className="text-xs p-1 rounded bg-gray-50">
                            <div className={`w-2 h-2 rounded-full ${hook.color} inline-block mr-1`}></div>
                            {String(hook.data[field] || 'undefined')}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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