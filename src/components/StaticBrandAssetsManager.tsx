import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const StaticBrandAssetsManager = () => {
  const { toast } = useToast();

  const currentSettings = {
    appLogo: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1755198305926.png",
    favicon: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/favicon-1754812729411.png",
    homeScreenIcon: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/homeScreenIcon-1757146073331.jpg"
  };

  const generateIndexHtmlCode = () => {
    return `<!-- Update these lines in index.html -->
<meta property="og:image" content="${currentSettings.appLogo}" />
<link rel="apple-touch-icon" href="${currentSettings.homeScreenIcon}">
<link rel="apple-touch-icon" sizes="152x152" href="${currentSettings.homeScreenIcon}">
<link rel="apple-touch-icon" sizes="180x180" href="${currentSettings.homeScreenIcon}">
<link rel="apple-touch-icon" sizes="167x167" href="${currentSettings.homeScreenIcon}">
<link rel="icon" type="image/png" sizes="32x32" href="${currentSettings.favicon}">
<link rel="icon" type="image/png" sizes="16x16" href="${currentSettings.favicon}">
<link rel="icon" href="${currentSettings.favicon}" type="image/png" sizes="192x192">
<link rel="icon" href="${currentSettings.appLogo}" type="image/png" sizes="512x512">
<link rel="shortcut icon" href="${currentSettings.favicon}" type="image/png">`;
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
      "src": "${currentSettings.homeScreenIcon}",
      "sizes": "192x192",
      "type": "image/jpeg",
      "purpose": "maskable any"
    },
    {
      "src": "${currentSettings.homeScreenIcon}",
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
  const appLogo = "${currentSettings.appLogo}";
  
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
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Current Assets</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Logo: {currentSettings.appLogo}</div>
              <div>Favicon: {currentSettings.favicon}</div>
              <div>Home Screen: {currentSettings.homeScreenIcon}</div>
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
              <div className="max-h-40 overflow-auto bg-muted rounded-md">
                <pre className="bg-muted p-3 text-xs overflow-x-auto whitespace-pre">
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
              <div className="max-h-48 overflow-auto bg-muted rounded-md">
                <pre className="bg-muted p-3 text-xs overflow-x-auto whitespace-pre">
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
              <div className="max-h-32 overflow-auto bg-muted rounded-md">
                <pre className="bg-muted p-3 text-xs overflow-x-auto whitespace-pre">
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