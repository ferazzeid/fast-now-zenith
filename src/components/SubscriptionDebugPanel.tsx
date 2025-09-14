import React, { useState } from 'react';
import { useAccess } from '@/hooks/useAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown, Bug, CheckCircle } from 'lucide-react';

export const SubscriptionDebugPanel = () => {
  const { isAdmin } = useAccess();
  const [isOpen, setIsOpen] = useState(false);
  
  const unified = useAccess();

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
                      <div className="font-medium">Access Level</div>
                      <div className="text-green-600">{unified.access_level}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Has Access</div>
                      <div className="text-blue-600">{String(unified.hasAccess)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Is Trial</div>
                      <div className="text-orange-600">{String(unified.isTrial)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Premium Features</div>
                      <div className="text-purple-600">{String(unified.hasPremiumFeatures)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Is Admin</div>
                      <div className="text-indigo-600">{String(unified.isAdmin)}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Days Remaining</div>
                      <div className="text-pink-600">{unified.daysRemaining || 'N/A'}</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="debug" className="space-y-3">
                  <div className="text-xs space-y-2">
                    <div><strong>Hook Source:</strong> useAccess</div>
                    <div><strong>Loading:</strong> {String(unified.loading)}</div>
                    <div><strong>Is Premium:</strong> {String(unified.isPremium)}</div>
                    <div><strong>Is Free:</strong> {String(unified.isFree)}</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};