import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStandardizedLoading } from './useStandardizedLoading';

// Temporary type definition until Supabase types are regenerated
type SystemMotivator = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  male_image_url: string | null;
  female_image_url: string | null;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

interface UseSystemMotivatorsResult {
  systemMotivators: SystemMotivator[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSystemMotivators = (): UseSystemMotivatorsResult => {
  const { data: systemMotivators, isLoading, execute } = useStandardizedLoading<SystemMotivator[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemMotivators = async () => {
    await execute(async () => {
      // Direct query with type assertion since table isn't in generated types yet
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data as unknown as SystemMotivator[]) || [];
    }, {
      onError: (err) => {
        console.error('Error fetching system motivators:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch system motivators');
      },
      onSuccess: () => {
        setError(null);
      }
    });
  };

  useEffect(() => {
    fetchSystemMotivators();
  }, []);

  return {
    systemMotivators: systemMotivators || [],
    loading: isLoading,
    error,
    refetch: fetchSystemMotivators
  };
};

export default useSystemMotivators;