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
        const { data: fastingData, error: fastingError } = await supabase
          .from('fasting_sessions')
          .select('count(*)')
          .eq('user_id', user.id);
        
        console.log('🔍 HistoryDebug: Fasting sessions count:', fastingData, fastingError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Fasting sessions error:', error);
      }

      // Test walking sessions
      try {
        const { data: walkingData, error: walkingError } = await supabase
          .from('walking_sessions')
          .select('count(*)')
          .eq('user_id', user.id);
        
        console.log('🔍 HistoryDebug: Walking sessions count:', walkingData, walkingError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Walking sessions error:', error);
      }

      // Test food entries
      try {
        const { data: foodData, error: foodError } = await supabase
          .from('food_entries')
          .select('count(*)')
          .eq('user_id', user.id);
        
        console.log('🔍 HistoryDebug: Food entries count:', foodData, foodError);
      } catch (error) {
        console.error('🔍 HistoryDebug: Food entries error:', error);
      }
    };

    testConnections();
  }, [user]);

  return null; // This component doesn't render anything
};