import React from 'react';
import { useAccess } from '@/hooks/useAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const AdminSubscriptionOverview = () => {
  const { isAdmin, hasPremiumFeatures, isTrial, daysRemaining, access_level, refetch } = useAccess();

  if (!isAdmin) return null;

  const getStatusIcon = () => {
    if (hasPremiumFeatures) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isTrial) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getHealthScore = () => {
    let score = 0;
    if (hasPremiumFeatures) score += 40;
    if (isTrial) score += 20;
    score += 10; // web platform default
    score += 10; // email login default  
    score += 20; // stripe default
    return Math.min(score, 100);
  };

  const healthScore = getHealthScore();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Subscription Health Check
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Current user's subscription status and platform compatibility
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Health Score</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  healthScore >= 80 ? 'bg-green-500' : 
                  healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className="text-sm font-bold">{healthScore}%</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Subscription Status</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subscribed:</span>
                <Badge variant={hasPremiumFeatures ? "default" : "outline"}>
                  {hasPremiumFeatures ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Tier:</span>
                <Badge variant="secondary">{access_level}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="outline">{access_level}</Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Platform Details</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Platform:</span>
                <Badge variant="outline">web</Badge>
              </div>
              <div className="flex justify-between">
                <span>Login:</span>
                <Badge variant="outline">email</Badge>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <Badge variant="outline">stripe</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Info */}
        {isTrial && daysRemaining && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-800">Trial Active</span>
            </div>
            <p className="text-xs text-yellow-700">
              {daysRemaining} days remaining
            </p>
          </div>
        )}

        {/* Debug Info */}
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Debug Information</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Source: useAccess</div>
            <div>Cached: Yes</div>
            <div>Platform: web</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
          </div>
          
          <div className="mt-2">
            <span className="text-xs font-medium">Subscription Sources:</span>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">Stripe</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};