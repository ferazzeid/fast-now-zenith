import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Helper component to debug history loading issues
export const HistoryDebugHelper = () => {
  const { user } = useAuth();

  useEffect(() => {
    const testConnections = async () => {
      if (!user) {
        console.log('🔍 HistoryDebug: No user found');
        return;
      }

      console.log('🔍 HistoryDebug: Testing connections for user:', user.id);

      // Test fasting sessions
      try {
        const { count: fastingCount, error: fastingError } = await supabase
          .from('fasting_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        console.log('🔍 HistoryDebug: Fasting sessions count:', fastingCount, fastingError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Fasting sessions error:', error);
      }

      // Test walking sessions
      try {
        const { count: walkingCount, error: walkingError } = await supabase
          .from('walking_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        console.log('🔍 HistoryDebug: Walking sessions count:', walkingCount, walkingError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Walking sessions error:', error);
      }

      // Test food entries
      try {
        const { count: foodCount, error: foodError } = await supabase
          .from('food_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        console.log('🔍 HistoryDebug: Food entries count:', foodCount, foodError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Food entries error:', error);
      }
    };

    testConnections();
  }, [user]);

  return null; // This component doesn't render anything
};