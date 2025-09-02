import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Temporary type definition until Supabase types are regenerated
type SystemMotivator = {
  id: string;
  title: string;
  content: string;
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
  const [systemMotivators, setSystemMotivators] = useState<SystemMotivator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemMotivators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct query with type assertion since table isn't in generated types yet
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setSystemMotivators((data as unknown as SystemMotivator[]) || []);
    } catch (err) {
      console.error('Error fetching system motivators:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch system motivators');
      // Set empty array as fallback
      setSystemMotivators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMotivators();
  }, []);

  return {
    systemMotivators,
    loading,
    error,
    refetch: fetchSystemMotivators
  };
};

export default useSystemMotivators;