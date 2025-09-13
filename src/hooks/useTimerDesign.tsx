import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TimerDesign = 'ceramic' | 'metaverse';

export const useTimerDesign = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timerDesign, isLoading } = useQuery({
    queryKey: ['shared-settings', 'timer_design_style'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'timer_design_style')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching timer design:', error);
        return 'ceramic' as TimerDesign;
      }
      
      return (data?.setting_value as TimerDesign) || 'ceramic';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateTimerDesign = useMutation({
    mutationFn: async (design: TimerDesign) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'timer_design_style',
          setting_value: design,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      return design;
    },
    onSuccess: (design) => {
      queryClient.invalidateQueries({ queryKey: ['shared-settings', 'timer_design_style'] });
      toast({
        title: "Timer design updated",
        description: `Timer design changed to ${design}`,
      });
    },
    onError: (error) => {
      console.error('Error updating timer design:', error);
      toast({
        title: "Error",
        description: "Failed to update timer design",
        variant: "destructive",
      });
    },
  });

  return {
    timerDesign: timerDesign || 'ceramic',
    isLoading,
    updateTimerDesign: updateTimerDesign.mutate,
    isUpdating: updateTimerDesign.isPending,
  };
};