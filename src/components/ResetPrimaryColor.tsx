import React from 'react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Palette } from 'lucide-react';

export const ResetPrimaryColor = () => {
  const { updateProfile, profile } = useProfile();
  const { toast } = useToast();

  const handleReset = async () => {
    try {
      await updateProfile({ primary_color: null });
      toast({
        title: "Color Reset",
        description: "Primary color reset to design system default."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset primary color."
      });
    }
  };

  // Only show if user has a custom primary color set
  if (!profile?.primary_color) {
    return null;
  }

  return (
    <Button
      onClick={handleReset}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Palette className="w-4 h-4" />
      Reset to Default Colors
    </Button>
  );
};