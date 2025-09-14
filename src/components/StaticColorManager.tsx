import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const StaticColorManager = () => {
  const { toast } = useToast();

  const currentColors = {
    primary: "220 85% 50%",
    secondary: "0 0% 90%",
    accent: "140 25% 85%",
    ai: "48 96% 53%",
    chatAi: "258 90% 66%",
    chatUser: "189 94% 43%"
  };

  const generateCSSCode = () => {
    return `/* Update these CSS variables in src/index.css */
:root {
  --primary: ${currentColors.primary};
  --secondary: ${currentColors.secondary};
  --accent: ${currentColors.accent};
  --ai: ${currentColors.ai};
  --chat-ai: ${currentColors.chatAi};
  --chat-user: ${currentColors.chatUser};
}

.dark {
  --primary: ${currentColors.primary};
  --secondary: 0 0% 15%;
  --accent: 0 0% 15%;
  --ai: ${currentColors.ai};
  --chat-ai: ${currentColors.chatAi};
  --chat-user: ${currentColors.chatUser};
}`;
  };

  const generateThemeColorCode = () => {
    // Convert HSL to HEX for theme-color meta tag
    const hslToPrimary = "hsl(220, 85%, 50%)"; // Primary color as HSL
    return `<!-- Update theme-color in index.html -->
<meta name="theme-color" content="#3b82f6">
<meta name="msapplication-TileColor" content="#3b82f6">`;
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
          <Palette className="h-5 w-5" />
          Static Color Code Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Development tool to generate CSS color variable code
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Current Color Values</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${currentColors.primary})` }}></div>
                Primary: {currentColors.primary}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${currentColors.secondary})` }}></div>
                Secondary: {currentColors.secondary}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${currentColors.ai})` }}></div>
                AI: {currentColors.ai}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${currentColors.chatAi})` }}></div>
                Chat AI: {currentColors.chatAi}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">CSS Variables</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateCSSCode(), "CSS")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy CSS
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto bg-muted rounded-md">
                <pre className="text-xs p-3 whitespace-pre-wrap">
                  {generateCSSCode()}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">HTML Theme Color</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateThemeColorCode(), "Theme Color")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy HTML
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto bg-muted rounded-md">
                <pre className="text-xs p-3 whitespace-pre-wrap">
                  {generateThemeColorCode()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};