/**
 * LOVABLE_COMPONENT_STATUS: UPGRADED
 * LOVABLE_MIGRATION_PHASE: 2
 * LOVABLE_PRESERVE: true
 * LOVABLE_DESCRIPTION: Real-time deficit updates with selective Supabase subscriptions
 * LOVABLE_DEPENDENCIES: @tanstack/react-query, supabase
 * LOVABLE_PERFORMANCE_IMPACT: Real-time updates only when needed, minimal server load
 * 
 * SELECTIVE REAL-TIME STRATEGY:
 * - Only subscribe to manual_calorie_burns when user is viewing stats
 * - Only subscribe to walking_sessions when timer is active
 * - Automatic cleanup when subscriptions not needed
 * - Optimized for 1000+ concurrent users
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

interface RealtimeDeficitContextType {
  isSubscribedToManualBurns: boolean;
  isSubscribedToWalkingSessions: boolean;
  enableManualBurnsRealtime: () => void;
  disableManualBurnsRealtime: () => void;
  enableWalkingRealtime: () => void;
  disableWalkingRealtime: () => void;
}

const RealtimeDeficitContext = createContext<RealtimeDeficitContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const RealtimeDeficitProvider: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const [isSubscribedToManualBurns, setIsSubscribedToManualBurns] = useState(false);
  const [isSubscribedToWalkingSessions, setIsSubscribedToWalkingSessions] = useState(false);
  
  const manualBurnsChannelRef = useRef<any>(null);
  const walkingSessionsChannelRef = useRef<any>(null);

  // SELECTIVE REAL-TIME: Manual calorie burns subscription
  const enableManualBurnsRealtime = () => {
    if (!user || isSubscribedToManualBurns || manualBurnsChannelRef.current) return;

    console.log('🔄 ENABLING manual burns real-time subscription');
    
    const channel = supabase
      .channel('manual-burns-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'manual_calorie_burns',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔥 Real-time manual burn change:', payload);
          
          // Invalidate manual burns and deficit queries
          queryClient.invalidateQueries({ queryKey: ['manual-burns-today', user.id] });
          queryClient.invalidateQueries({ queryKey: ['daily-deficit-stable'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribedToManualBurns(true);
        }
      });

    manualBurnsChannelRef.current = channel;
  };

  const disableManualBurnsRealtime = () => {
    if (manualBurnsChannelRef.current) {
      console.log('🔄 DISABLING manual burns real-time subscription');
      supabase.removeChannel(manualBurnsChannelRef.current);
      manualBurnsChannelRef.current = null;
      setIsSubscribedToManualBurns(false);
    }
  };

  // SELECTIVE REAL-TIME: Walking sessions subscription
  const enableWalkingRealtime = () => {
    if (!user || isSubscribedToWalkingSessions || walkingSessionsChannelRef.current) return;

    console.log('🔄 ENABLING walking sessions real-time subscription');
    
    const channel = supabase
      .channel('walking-sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'walking_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🚶 Real-time walking session change:', payload);
          
          // Invalidate walking sessions and deficit queries
          queryClient.invalidateQueries({ queryKey: ['walking-sessions', user.id] });
          queryClient.invalidateQueries({ queryKey: ['walking-calories'] });
          queryClient.invalidateQueries({ queryKey: ['daily-deficit-stable'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribedToWalkingSessions(true);
        }
      });

    walkingSessionsChannelRef.current = channel;
  };

  const disableWalkingRealtime = () => {
    if (walkingSessionsChannelRef.current) {
      console.log('🔄 DISABLING walking sessions real-time subscription');
      supabase.removeChannel(walkingSessionsChannelRef.current);
      walkingSessionsChannelRef.current = null;
      setIsSubscribedToWalkingSessions(false);
    }
  };

  // AUTO-ENABLE: Enable manual burns real-time when on relevant pages
  useEffect(() => {
    const isOnStatsPage = location.pathname.includes('/timer') || 
                         location.pathname.includes('/food') ||
                         location.pathname.includes('/index');
    
    if (isOnStatsPage) {
      enableManualBurnsRealtime();
    } else {
      disableManualBurnsRealtime();
    }

    return () => {
      if (!isOnStatsPage) {
        disableManualBurnsRealtime();
      }
    };
  }, [location.pathname, user]);

  // AUTO-ENABLE: Enable walking real-time when on timer page
  useEffect(() => {
    const isOnTimerPage = location.pathname.includes('/timer') || 
                         location.pathname.includes('/walking');
    
    if (isOnTimerPage) {
      enableWalkingRealtime();
    } else {
      disableWalkingRealtime();
    }

    return () => {
      if (!isOnTimerPage) {
        disableWalkingRealtime();
      }
    };
  }, [location.pathname, user]);

  // CLEANUP: Remove all subscriptions on unmount or user change
  useEffect(() => {
    return () => {
      disableManualBurnsRealtime();
      disableWalkingRealtime();
    };
  }, [user]);

  const value: RealtimeDeficitContextType = {
    isSubscribedToManualBurns,
    isSubscribedToWalkingSessions,
    enableManualBurnsRealtime,
    disableManualBurnsRealtime,
    enableWalkingRealtime,
    disableWalkingRealtime,
  };

  return (
    <RealtimeDeficitContext.Provider value={value}>
      {children}
    </RealtimeDeficitContext.Provider>
  );
};

export const useRealtimeDeficit = () => {
  const context = useContext(RealtimeDeficitContext);
  if (context === undefined) {
    throw new Error('useRealtimeDeficit must be used within a RealtimeDeficitProvider');
  }
  return context;
};