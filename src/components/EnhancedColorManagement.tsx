import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Palette } from 'lucide-react';

const EnhancedColorManagement: React.FC = () => {
  const { toast } = useToast();
  
  // Current color values from design system
  const currentColors = {
    light: {
      primary: '0 0% 15%',
      primaryHover: '0 0% 25%', 
      accent: '140 15% 65%',
      background: '0 0% 96%',
      foreground: '0 0% 15%',
      muted: '0 0% 88%'
    },
    dark: {
      primary: '0 0% 15%',
      primaryHover: '0 0% 25%',
      accent: '140 20% 40%', 
      background: '0 0% 11%',
      foreground: '0 0% 88%',
      muted: '0 0% 15%'
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
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
                      className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground">hsl({value})</p>
                      <p className="text-xs text-muted-foreground capitalize">Used for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                    </div>
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
                      className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground">hsl({value})</p>
                      <p className="text-xs text-muted-foreground capitalize">Used for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Color Usage Guide</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Primary:</strong> Main brand color, buttons, links</p>
            <p><strong>Accent:</strong> Highlights, success states, timers</p>
            <p><strong>Background:</strong> Page backgrounds</p>
            <p><strong>Foreground:</strong> Main text content</p>
            <p><strong>Muted:</strong> Secondary backgrounds, borders</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedColorManagement;