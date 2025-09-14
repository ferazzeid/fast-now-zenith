import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const StaticBrandAssetsManager = () => {
  const { toast } = useToast();

  const brandAssets = {
    logo: {
      name: "App Logo",
      url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1755198305926.png",
      usage: "Main branding, social sharing"
    },
    favicon: {
      name: "Favicon",
      url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/favicon-1754812729411.png",
      usage: "Browser tab icon"
    },
    homeScreenIcon: {
      name: "Home Screen Icon",
      url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/homeScreenIcon-1757146073331.jpg",
      usage: "PWA home screen, app icons"
    },
    icon192: {
      name: "PWA Icon 192x192",
      url: "/icon-192.png",
      usage: "PWA manifest, small screens"
    },
    icon512: {
      name: "PWA Icon 512x512", 
      url: "/icon-512.png",
      usage: "PWA manifest, large screens"
    },
    faviconTransparent: {
      name: "Transparent Favicon",
      url: "/favicon-transparent.png",
      usage: "Alternative favicon"
    }
  };

  const generateIndexHtmlCode = () => {
    return `<!-- Update these lines in index.html -->
<meta property="og:image" content="${brandAssets.logo.url}" />
<link rel="apple-touch-icon" href="${brandAssets.homeScreenIcon.url}">
<link rel="apple-touch-icon" sizes="152x152" href="${brandAssets.homeScreenIcon.url}">
<link rel="apple-touch-icon" sizes="180x180" href="${brandAssets.homeScreenIcon.url}">
<link rel="apple-touch-icon" sizes="167x167" href="${brandAssets.homeScreenIcon.url}">
<link rel="icon" type="image/png" sizes="32x32" href="${brandAssets.favicon.url}">
<link rel="icon" type="image/png" sizes="16x16" href="${brandAssets.favicon.url}">
<link rel="icon" href="${brandAssets.icon192.url}" type="image/png" sizes="192x192">
<link rel="icon" href="${brandAssets.icon512.url}" type="image/png" sizes="512x512">
<link rel="shortcut icon" href="${brandAssets.favicon.url}" type="image/png">`;
  };

  const generateManifestCode = () => {
    return `{
  "name": "FastNow - The No-BS Fat Loss Protocol",
  "short_name": "FastNow",
  "description": "The No-BS Fat Loss Protocol - Intermittent fasting and walking tracker for sustainable weight loss",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  "background_color": "#F5F2EA",
  "theme_color": "#8B7355",
  "orientation": "portrait-primary",
  "categories": ["health", "wellness", "lifestyle"],
  "lang": "en",
  "version": "1.0.0",
  "icons": [
    {
      "src": "${brandAssets.icon192.url}",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "${brandAssets.icon512.url}",
      "sizes": "512x512", 
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "${brandAssets.homeScreenIcon.url}",
      "sizes": "192x192",
      "type": "image/jpeg",
      "purpose": "maskable any"
    },
    {
      "src": "${brandAssets.homeScreenIcon.url}",
      "sizes": "512x512",
      "type": "image/jpeg", 
      "purpose": "maskable any"
    }
  ]
}`;
  };

  const generateStaticLogoCode = () => {
    return `// Update src/hooks/useStaticLogo.tsx
export const useStaticLogo = () => {
  const appLogo = "${brandAssets.logo.url}";
  
  return {
    appLogo,
    loading: false,
    refetch: () => {}
  };
};`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} code copied successfully`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Static Brand Assets Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Development tool to generate static asset configuration code
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Brand Assets Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(brandAssets).map(([key, asset]) => (
                <div key={key} className="border rounded-lg p-3 space-y-2">
                  <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    <img 
                      src={asset.url} 
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-xs text-muted-foreground">Preview unavailable</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-medium text-sm">{asset.name}</h5>
                    <p className="text-xs text-muted-foreground">{asset.usage}</p>
                    <p className="text-xs font-mono break-all">{asset.url}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">HTML Head Tags</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateIndexHtmlCode(), "HTML")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy HTML
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md max-h-40 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {generateIndexHtmlCode()}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Manifest.json</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateManifestCode(), "Manifest")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md max-h-48 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {generateManifestCode()}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Static Logo Hook</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateStaticLogoCode(), "Hook")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md max-h-32 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {generateStaticLogoCode()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};