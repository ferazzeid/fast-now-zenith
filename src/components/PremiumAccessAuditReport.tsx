import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Lock, Crown, Shield } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

export const PremiumAccessAuditReport = () => {
  const { isAdmin, access_level, hasPremiumFeatures, testRole, isTestingMode } = useAccess();
  
  if (!isAdmin) return null;

  // Features that should be premium-gated
  const premiumFeatures = [
    {
      name: 'Food Tracking Navigation',
      component: 'Navigation.tsx',
      status: 'implemented',
      description: 'Food nav button locked for free users with role testing support'
    },
    {
      name: 'Voice Input Button',
      component: 'PremiumGatedVoiceButton.tsx',
      status: 'implemented', 
      description: 'Voice transcription locked for free users'
    },
    {
      name: 'Image Upload',
      component: 'PremiumGatedImageUpload.tsx',
      status: 'implemented',
      description: 'Image upload and AI analysis locked for free users'
    },
    {
      name: 'Deficit Analysis',
      component: 'PremiumGatedDeficitAnalysis.tsx',
      status: 'implemented',
      description: 'AI-powered deficit analysis locked for free users'
    },
    {
      name: 'Calories In Display',
      component: 'PremiumGatedCaloriesIn.tsx',
      status: 'implemented',
      description: 'Food calorie tracking display locked for free users'
    },
    {
      name: 'Deficit Display',
      component: 'PremiumGatedDeficitDisplay.tsx',
      status: 'implemented',
      description: 'Small deficit display locked for free users'
    },
    {
      name: 'Large Deficit Display',
      component: 'PremiumGatedDeficitDisplayLarge.tsx',
      status: 'implemented',
      description: 'Large deficit card locked for free users'
    },
    {
      name: 'Goal Metrics',
      component: 'PremiumGatedGoalMetrics.tsx',
      status: 'implemented',
      description: 'Goal tracking metrics locked for free users'
    }
  ];

  const getCurrentAccessStatus = () => {
    if (isTestingMode) {
      return {
        level: testRole || 'unknown',
        hasAccess: testRole === 'admin' || testRole === 'paid_user',
        display: testRole === 'admin' ? 'Admin (Testing)' : 
                testRole === 'paid_user' ? 'Premium User (Testing)' : 
                'Free User (Testing)'
      };
    }
    
    return {
      level: access_level,
      hasAccess: hasPremiumFeatures,
      display: access_level === 'admin' ? 'Admin' :
               hasPremiumFeatures ? 'Premium User' :
               'Free User'
    };
  };

  const currentStatus = getCurrentAccessStatus();

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Premium Access Audit Report</h3>
        </div>
        
        {/* Current Testing Status */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current View:</span>
            <Badge variant={currentStatus.hasAccess ? "default" : "secondary"}>
              {currentStatus.display}
            </Badge>
          </div>
          {isTestingMode && (
            <p className="text-xs text-muted-foreground mt-1">
              Role testing active - seeing perspective of {testRole}
            </p>
          )}
        </div>

        {/* Premium Features Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Premium-Gated Features</h4>
          <div className="space-y-2">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{feature.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {feature.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Key Fixes Applied */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recent Fixes</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Admin dashboard access preserved during role testing</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Food navigation button properly locked for free users</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Role testing persistence with localStorage</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Consistent premium gating logic across components</span>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Testing Instructions</h4>
          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1 space-y-1">
            <p>• Use Role Testing above to switch between user perspectives</p>
            <p>• Free User: Should see locked food nav, premium gates, upgrade prompts</p>
            <p>• Premium User: Should see unlocked features, no upgrade prompts</p>
            <p>• Admin: Full access + admin dashboard always visible</p>
          </div>
        </div>
      </div>
    </Card>
  );
};