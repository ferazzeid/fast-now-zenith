import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Palette } from 'lucide-react';

const EnhancedColorManagement: React.FC = () => {
  const { toast } = useToast();
  
  // Current hard-coded color values
  const currentColors = {
    light: {
      primary: '0 0% 90%', // Changed to match secondary
      secondary: '0 0% 90%',
      accent: '140 25% 85%'
    },
    dark: {
      primary: '0 0% 15%', // Changed to match secondary in dark mode  
      secondary: '0 0% 15%',
      accent: '0 0% 15%'
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const generateCSSCode = () => {
    return `/* Current hard-coded CSS variables in src/index.css */
:root {
  --primary: ${currentColors.light.primary};
  --secondary: ${currentColors.light.secondary};
  --accent: ${currentColors.light.accent};
}

.dark {
  --primary: ${currentColors.dark.primary};
  --secondary: ${currentColors.dark.secondary};
  --accent: ${currentColors.dark.accent};
}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Colors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="light" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="light">Light Mode</TabsTrigger>
            <TabsTrigger value="dark">Dark Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="space-y-4 mt-6">
            <div className="space-y-3">
              {Object.entries(currentColors.light).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <p className="text-sm text-muted-foreground font-mono">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dark" className="space-y-4 mt-6">
            <div className="space-y-3">
              {Object.entries(currentColors.dark).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <p className="text-sm text-muted-foreground font-mono">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-6">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedColorManagement;