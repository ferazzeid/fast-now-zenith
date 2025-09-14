import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useStandardizedLoading } from './useStandardizedLoading';

export interface AdminTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export const useAdminTemplates = () => {
  const { data: templates, isLoading, execute } = useStandardizedLoading<AdminTemplate[]>([]);
  const { toast } = useToast();

  const loadTemplates = async () => {
    await execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_admin_motivator_templates')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        const parsedTemplates = JSON.parse(data.setting_value);
        return Array.isArray(parsedTemplates) ? parsedTemplates : [];
      } else {
        return [];
      }
    }, {
      onError: (error) => {
        console.error('Error loading admin templates:', error);
        // Silently fail for non-admin users - don't show error toast
        // Admin users can check console for debugging
      }
    });
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading: isLoading,
    refreshTemplates: loadTemplates
  };
};