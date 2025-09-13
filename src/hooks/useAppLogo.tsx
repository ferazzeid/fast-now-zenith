import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAppLogo = () => {
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppLogo = async () => {
    try {
      // Create an anonymous client for logo fetching to avoid auth dependency
      const { createClient } = await import('@supabase/supabase-js');
      const anonClient = createClient(
        'https://njympvuqlqglhfkdmccy.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeW1wdnVxbHFnbGhma2RtY2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTczNjcsImV4cCI6MjA1MjAzMzM2N30.vG1EPyweXcSdICZmidmksJEXPdxIMy_LrMqhZGml0kU'
      );
      
      const { data, error } = await anonClient
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'app_logo')
        .maybeSingle();

      if (error) {
        console.log('Logo fetch failed, using fallback:', error.message);
        setAppLogo(null);
      } else {
        setAppLogo(data?.setting_value || null);
      }
    } catch (error) {
      console.log('Logo fetch error, using fallback:', error);
      setAppLogo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppLogo();
  }, []);

  return {
    appLogo,
    loading,
    refetch: fetchAppLogo
  };
};