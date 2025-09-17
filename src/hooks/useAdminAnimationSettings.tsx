import { useProfile } from './useProfile';

interface AdminAnimationSettings {
  enable_quotes_in_animations: boolean;
  enable_notes_in_animations: boolean;
  enable_goals_in_animations: boolean;
}

export const useAdminAnimationSettings = (): AdminAnimationSettings => {
  const { profile } = useProfile();

  return {
    enable_quotes_in_animations: (profile as any)?.enable_quotes_in_animations ?? true,
    enable_notes_in_animations: (profile as any)?.enable_notes_in_animations ?? true,
    enable_goals_in_animations: (profile as any)?.enable_goals_in_animations ?? true,
  };
};