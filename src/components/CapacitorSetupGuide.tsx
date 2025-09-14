import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Download, Terminal, Play, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const capacitorConfig = `{
  "appId": "com.fastnow.zenith",
  "appName": "FastNow Zenith",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "CapacitorGooglePlayBilling": {
      "connectOnStart": true
    }
  }
}`;

const androidBillingPlugin = `npm install @capacitor-community/google-play-billing
npx cap sync android`;

const buildCommands = `# Build the web app
npm run build

# Add Android platform (if not already added)
npx cap add android

# Sync changes to native platform
npx cap sync android

# Open in Android Studio
npx cap open android`;

export const CapacitorSetupGuide: React.FC = () => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
      
      toast({
        title: "Copied!",
        description: "Command copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const setupSteps = [
    {
      id: 'prerequisites',
      title: 'Prerequisites',
      description: 'Install required tools',
      items: [
        'Node.js 18+ installed',
        'Android Studio installed',
        'Capacitor CLI: npm install -g @capacitor/cli',
        'Google Play Console access'
      ]
    },
    {
      id: 'capacitor-config',
      title: 'Capacitor Configuration',
      description: 'Update capacitor.config.ts',
      code: capacitorConfig
    },
    {
      id: 'install-billing',
      title: 'Install Google Play Billing',
      description: 'Add billing plugin',
      code: androidBillingPlugin
    },
    {
      id: 'build-deploy',
      title: 'Build & Deploy',
      description: 'Build and test the app',
      code: buildCommands
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Capacitor Mobile Setup
        </CardTitle>
        <CardDescription>
          Complete setup guide for Android app with Google Play Billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prerequisites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {setupSteps.map((step, index) => (
              <TabsTrigger key={step.id} value={step.id} className="text-xs">
                <span className="hidden sm:inline">{index + 1}. </span>
                <span className="truncate">{step.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {setupSteps.map((step) => (
            <TabsContent key={step.id} value={step.id} className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {step.id === 'prerequisites' && (
                <ul className="space-y-2">
                  {step.items?.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.code && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {step.id === 'capacitor-config' ? 'capacitor.config.ts' : 'Terminal'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(step.code!, step.id)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedStep === step.id ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {step.id === 'build-deploy' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Testing Notes:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Test on physical Android device for full billing functionality</li>
                    <li>Use Google Play Console test accounts for safe testing</li>
                    <li>Emulator won't have Google Play services for billing</li>
                    <li>Upload to Google Play for internal testing before production</li>
                  </ul>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Google Play Console Setup:</h4>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Create in-app products in Google Play Console</li>
            <li>Set product ID: "premium_subscription_monthly"</li>
            <li>Configure pricing and billing period</li>
            <li>Add service account email with proper permissions</li>
            <li>Upload signed APK/AAB for testing</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};