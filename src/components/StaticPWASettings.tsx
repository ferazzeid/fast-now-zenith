import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Copy, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATIC_ASSETS } from "@/utils/staticAssets";

export const StaticPWASettings: React.FC = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully!`,
    });
  };

  const generateServiceWorkerCode = () => {
    return `// public/sw.js
const CACHE_NAME = 'fastnow-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '${STATIC_ASSETS.logo}',
  '${STATIC_ASSETS.favicon}',
  '${STATIC_ASSETS.homeScreenIcon}'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});`;
  };

  const generateManifestCode = () => {
    return `{
  "name": "FastNow - The No-BS Fat Loss Protocol",
  "short_name": "FastNow",
  "description": "Weight loss protocol combining fasting, walking, and calorie restriction for sustainable results",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F8FAFC",
  "theme_color": "#3B82F6",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "${STATIC_ASSETS.homeScreenIcon}",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "${STATIC_ASSETS.homeScreenIcon}",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "${STATIC_ASSETS.logo}",
      "sizes": "540x720",
      "type": "image/png"
    }
  ]
}`;
  };

  const generateHTMLPWACode = () => {
    return `<!-- PWA Configuration -->
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/x-icon" href="${STATIC_ASSETS.favicon}">
<link rel="apple-touch-icon" href="${STATIC_ASSETS.homeScreenIcon}">

<!-- PWA Meta Tags -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="FastNow">
<meta name="application-name" content="FastNow">
<meta name="msapplication-TileColor" content="#3B82F6">
<meta name="theme-color" content="#3B82F6">

<!-- Service Worker Registration -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(registrationError => console.log('SW registration failed:', registrationError));
    });
  }
</script>`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Static PWA Code Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate PWA configuration files with static assets
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Manifest.json (PWA Configuration)
            </Label>
            <div className="max-h-48 overflow-y-auto bg-muted rounded-md">
              <pre className="text-xs p-3 whitespace-pre-wrap">
                {generateManifestCode()}
              </pre>
            </div>
            <Button
              onClick={() => copyToClipboard(generateManifestCode(), "PWA Manifest")}
              size="sm"
              className="mt-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Manifest
            </Button>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              HTML PWA Meta Tags
            </Label>
            <div className="max-h-40 overflow-y-auto bg-muted rounded-md">
              <pre className="text-xs p-3 whitespace-pre-wrap">
                {generateHTMLPWACode()}
              </pre>
            </div>
            <Button
              onClick={() => copyToClipboard(generateHTMLPWACode(), "PWA HTML")}
              size="sm"
              className="mt-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy HTML Code
            </Button>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Service Worker (Optional)
            </Label>
            <div className="max-h-48 overflow-y-auto bg-muted rounded-md">
              <pre className="text-xs p-3 whitespace-pre-wrap">
                {generateServiceWorkerCode()}
              </pre>
            </div>
            <Button
              onClick={() => copyToClipboard(generateServiceWorkerCode(), "Service Worker")}
              size="sm"
              className="mt-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Service Worker
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};