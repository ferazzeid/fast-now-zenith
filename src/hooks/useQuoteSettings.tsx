import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Quote {
  text: string;
  author?: string;
}

interface QuoteSettings {
  fasting_timer_quotes: Quote[];
  walking_timer_quotes: Quote[];
  fasting_timer_quotes_enabled?: boolean;
  walking_timer_quotes_enabled?: boolean;
}

export const quotesQueryKey = ['quotes', 'timer'] as const;

async function fetchQuotes(): Promise<QuoteSettings> {
  const { data, error } = await supabase
    .from('shared_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'fasting_timer_quotes', 
      'walking_timer_quotes',
      'fasting_timer_quotes_enabled',
      'walking_timer_quotes_enabled'
    ]);

  if (error) throw error;

  const quotesData: QuoteSettings = {
    fasting_timer_quotes: [],
    walking_timer_quotes: []
  };

  data?.forEach((setting) => {
    if (setting.setting_key === 'fasting_timer_quotes' || setting.setting_key === 'walking_timer_quotes') {
      try {
        const parsed = JSON.parse(setting.setting_value || '[]');
        quotesData[setting.setting_key] = parsed;
      } catch (e) {
        console.warn(`Failed to parse quotes for ${setting.setting_key}:`, e);
      }
    } else if (setting.setting_key === 'fasting_timer_quotes_enabled' || setting.setting_key === 'walking_timer_quotes_enabled') {
      quotesData[setting.setting_key] = setting.setting_value === 'true';
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
    onMutate: async ({ type, newQuotes }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: quotesQueryKey });
      
      // Snapshot the previous value
      const previousQuotes = queryClient.getQueryData<QuoteSettings>(quotesQueryKey);
      
      // Optimistically update to the new value
      if (previousQuotes) {
        queryClient.setQueryData<QuoteSettings>(quotesQueryKey, {
          ...previousQuotes,
          [type]: newQuotes
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousQuotes };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuotes) {
        queryClient.setQueryData(quotesQueryKey, context.previousQuotes);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: quotesQueryKey });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ 
      type, 
      enabled 
    }: { 
      type: 'fasting_timer_quotes_enabled' | 'walking_timer_quotes_enabled'; 
      enabled: boolean 
    }) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: type,
          setting_value: enabled.toString(),
        });

      if (error) throw error;
      return { success: true };
    },
    onMutate: async ({ type, enabled }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: quotesQueryKey });
      
      // Snapshot the previous value
      const previousQuotes = queryClient.getQueryData<QuoteSettings>(quotesQueryKey);
      
      // Optimistically update to the new value
      if (previousQuotes) {
        queryClient.setQueryData<QuoteSettings>(quotesQueryKey, {
          ...previousQuotes,
          [type]: enabled
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousQuotes };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuotes) {
        queryClient.setQueryData(quotesQueryKey, context.previousQuotes);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: quotesQueryKey });
    }
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

  const updateQuoteStatus = async (
    type: 'fasting_timer_quotes_enabled' | 'walking_timer_quotes_enabled',
    enabled: boolean
  ) => {
    try {
      await statusMutation.mutateAsync({ type, enabled });
      return { success: true };
    } catch (error) {
      console.error('Error updating quote status:', error);
      return { success: false, error } as const;
    }
  };

  return {
    quotes: data || { fasting_timer_quotes: [], walking_timer_quotes: [] },
    loading: isLoading,
    fastingQuotesEnabled: data?.fasting_timer_quotes_enabled ?? true,
    walkingQuotesEnabled: data?.walking_timer_quotes_enabled ?? true,
    updateQuotes,
    updateQuoteStatus,
    refetch,
  };
};
