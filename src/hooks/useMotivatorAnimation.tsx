import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AnimationStyle = 'smooth_fade' | 'pixel_dissolve';

interface UseMotivatorAnimationReturn {
  animationStyle: AnimationStyle;
  isLoading: boolean;
  error: string | null;
}

export function useMotivatorAnimation(): UseMotivatorAnimationReturn {
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('smooth_fade');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnimationStyle();
  }, []);

  const loadAnimationStyle = async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'motivator_animation_style')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Default to smooth_fade if no setting exists
      const style = data?.setting_value as AnimationStyle || 'smooth_fade';
      setAnimationStyle(style);
    } catch (err) {
      console.error('Error loading animation style:', err);
      setError('Failed to load animation settings');
      // Fallback to default
      setAnimationStyle('smooth_fade');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    animationStyle,
    isLoading,
    error
  };
}