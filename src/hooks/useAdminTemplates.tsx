import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export const useAdminTemplates = () => {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_admin_motivator_templates')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        const parsedTemplates = JSON.parse(data.setting_value);
        setTemplates(Array.isArray(parsedTemplates) ? parsedTemplates : []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading admin templates:', error);
      // Silently fail for non-admin users - don't show error toast
      // Admin users can check console for debugging
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    refreshTemplates: loadTemplates
  };
};