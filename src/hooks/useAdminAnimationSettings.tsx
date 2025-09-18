import { useProfile } from './useProfile';

interface AdminAnimationSettings {
  enable_if_slideshow: boolean;
  animation_duration_seconds: number;
  mini_timer_enabled: boolean;
  mini_timer_position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  mini_timer_size: 'small' | 'medium' | 'large';
  mini_timer_opacity: number;
}

export const useAdminAnimationSettings = (): AdminAnimationSettings => {
  const { profile } = useProfile();

  return {
    enable_if_slideshow: (profile as any)?.enable_if_slideshow ?? true,
    animation_duration_seconds: (profile as any)?.animation_duration_seconds ?? 10,
    mini_timer_enabled: (profile as any)?.mini_timer_enabled ?? true,
    mini_timer_position: (profile as any)?.mini_timer_position ?? 'bottom-left',
    mini_timer_size: (profile as any)?.mini_timer_size ?? 'medium',
    mini_timer_opacity: (profile as any)?.mini_timer_opacity ?? 0.9,
  };
};