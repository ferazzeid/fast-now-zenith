import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const StaticAppIdentitySettings: React.FC = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully!`,
    });
  };

  // Current static values
  const currentValues = {
    appName: 'FastNow - The No-BS Fat Loss Protocol',
    shortName: 'FastNow',
    description: 'Weight loss protocol combining fasting, walking, and calorie restriction for sustainable results',
    themeColor: '#D4AF37',
    backgroundColor: '#F8FAFC'
  };

  const generateManifestCode = () => {
    return `{
  "name": "${currentValues.appName}",
  "short_name": "${currentValues.shortName}",
  "description": "${currentValues.description}",
  "start_url": "/",
  "display": "standalone",
  "background_color": "${currentValues.backgroundColor}",
  "theme_color": "${currentValues.themeColor}",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`;
  };

  const generateHTMLMetaCode = () => {
    return `<!-- App Identity Meta Tags -->
<title>${currentValues.appName}</title>
<meta name="description" content="${currentValues.description}">
<meta name="theme-color" content="${currentValues.themeColor}">

<!-- PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${currentValues.shortName}">

<!-- Open Graph -->
<meta property="og:title" content="${currentValues.appName}">
<meta property="og:description" content="${currentValues.description}">
<meta property="og:type" content="website">`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          App Identity Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">App Name:</Label>
            <p className="text-sm text-muted-foreground mt-1">{currentValues.appName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Short Name:</Label>
            <p className="text-sm text-muted-foreground mt-1">{currentValues.shortName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Description:</Label>
            <p className="text-sm text-muted-foreground mt-1">{currentValues.description}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Theme Color:</Label>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: currentValues.themeColor }}
              />
              <p className="text-sm text-muted-foreground">{currentValues.themeColor}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Background Color:</Label>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: currentValues.backgroundColor }}
              />
              <p className="text-sm text-muted-foreground">{currentValues.backgroundColor}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};