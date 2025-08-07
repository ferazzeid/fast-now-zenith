import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Quote {
  text: string;
  author?: string;
}

interface QuoteSettings {
  fasting_timer_quotes: Quote[];
  walking_timer_quotes: Quote[];
}

export const quotesQueryKey = ['quotes', 'timer'] as const;

async function fetchQuotes(): Promise<QuoteSettings> {
  const { data, error } = await supabase
    .from('shared_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['fasting_timer_quotes', 'walking_timer_quotes']);

  if (error) throw error;

  const quotesData: QuoteSettings = {
    fasting_timer_quotes: [],
    walking_timer_quotes: []
  };

  data?.forEach((setting) => {
    try {
      const parsed = JSON.parse(setting.setting_value || '[]');
      if (setting.setting_key === 'fasting_timer_quotes') {
        quotesData.fasting_timer_quotes = parsed;
      } else if (setting.setting_key === 'walking_timer_quotes') {
        quotesData.walking_timer_quotes = parsed;
      }
    } catch (e) {
      console.warn(`Failed to parse quotes for ${setting.setting_key}:`, e);
    }
  });

  return quotesData;
}

export const useQuoteSettings = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: quotesQueryKey,
    queryFn: fetchQuotes,
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });

  const mutation = useMutation({
    mutationFn: async ({
      type,
      newQuotes,
    }: {
      type: 'fasting_timer_quotes' | 'walking_timer_quotes';
      newQuotes: Quote[];
    }) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: type, setting_value: JSON.stringify(newQuotes) });
      if (error) throw error;
      return { type, newQuotes } as const;
    },
    onSuccess: () => {
      // Ensure the cache stays fresh after mutation
      queryClient.invalidateQueries({ queryKey: quotesQueryKey });
    },
  });

  const updateQuotes = async (
    type: 'fasting_timer_quotes' | 'walking_timer_quotes',
    newQuotes: Quote[]
  ) => {
    try {
      await mutation.mutateAsync({ type, newQuotes });
      return { success: true };
    } catch (error) {
      console.error('Error updating quotes:', error);
      return { success: false, error } as const;
    }
  };

  return {
    quotes: data || { fasting_timer_quotes: [], walking_timer_quotes: [] },
    loading: isLoading,
    updateQuotes,
    refetch,
  };
};
