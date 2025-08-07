import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Quote {
  text: string;
  author?: string;
}

interface QuoteSettings {
  fasting_timer_quotes: Quote[];
  walking_timer_quotes: Quote[];
}

export const useQuoteSettings = () => {
  const [quotes, setQuotes] = useState<QuoteSettings>({
    fasting_timer_quotes: [],
    walking_timer_quotes: []
  });
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fasting_timer_quotes', 'walking_timer_quotes']);

      if (error) throw error;

      const quotesData: QuoteSettings = {
        fasting_timer_quotes: [],
        walking_timer_quotes: []
      };

      data?.forEach(setting => {
        try {
          const parsedQuotes = JSON.parse(setting.setting_value || '[]');
          if (setting.setting_key === 'fasting_timer_quotes') {
            quotesData.fasting_timer_quotes = parsedQuotes;
          } else if (setting.setting_key === 'walking_timer_quotes') {
            quotesData.walking_timer_quotes = parsedQuotes;
          }
        } catch (e) {
          console.warn(`Failed to parse quotes for ${setting.setting_key}:`, e);
        }
      });

      setQuotes(quotesData);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuotes = async (type: 'fasting_timer_quotes' | 'walking_timer_quotes', newQuotes: Quote[]) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: type,
          setting_value: JSON.stringify(newQuotes)
        });

      if (error) throw error;

      setQuotes(prev => ({
        ...prev,
        [type]: newQuotes
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating quotes:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return {
    quotes,
    loading,
    updateQuotes,
    refetch: fetchQuotes
  };
};