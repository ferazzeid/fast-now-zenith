import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

export function AdminMotivatorAnimationSettings() {
  const [isPixelDissolve, setIsPixelDissolve] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSetting();
  }, []);

  const loadCurrentSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'motivator_animation_style')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsPixelDissolve(data?.setting_value === 'pixel_dissolve');
    } catch (error) {
      console.error('Error loading animation setting:', error);
      toast({
        title: "Error",
        description: "Failed to load animation settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAnimationStyle = async (usePixelDissolve: boolean) => {
    try {
      const animationStyle = usePixelDissolve ? 'pixel_dissolve' : 'smooth_fade';
      
      // Check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('shared_settings')
        .select('id')
        .eq('setting_key', 'motivator_animation_style')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let error;
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('shared_settings')
          .update({ setting_value: animationStyle })
          .eq('setting_key', 'motivator_animation_style');
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shared_settings')
          .insert({ 
            setting_key: 'motivator_animation_style', 
            setting_value: animationStyle 
          });
        error = insertError;
      }

      if (error) throw error;

      setIsPixelDissolve(usePixelDissolve);
      toast({
        title: "Settings updated",
        description: `Animation style changed to ${usePixelDissolve ? 'Pixel Dissolve' : 'Smooth Fade'}`,
      });
    } catch (error) {
      console.error('Error updating animation style:', error);
      toast({
        title: "Error",
        description: "Failed to update animation settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Motivator Animation Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-16 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Motivator Animation Settings
        </CardTitle>
        <CardDescription>
          Choose how motivator images transition on the Timer pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="animation-style" className="flex flex-col gap-1">
            <span className="font-medium">Animation Style</span>
            <span className="text-sm text-muted-foreground">
              {isPixelDissolve ? 
                'Pixel Dissolve: Images break into squares for block/mosaic transitions' : 
                'Smooth Fade: Standard opacity transitions with ceramic overlays'
              }
            </span>
          </Label>
          <Switch
            id="animation-style"
            checked={isPixelDissolve}
            onCheckedChange={updateAnimationStyle}
          />
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">Animation Styles:</p>
          <p><strong>Smooth Fade:</strong> Current subtle transitions with ceramic effects</p>
          <p><strong>Pixel Dissolve:</strong> Grid-based block transitions that shatter and reform images</p>
        </div>
      </CardContent>
    </Card>
  );
}