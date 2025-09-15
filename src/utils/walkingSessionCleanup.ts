import { supabase } from '@/integrations/supabase/client';

/**
 * Cleanup function for stale walking sessions
 * Automatically ends sessions that have been running for too long
 */
export const cleanupStaleWalkingSessions = async (userId: string) => {
  try {
    // Find sessions that have been active for more than 12 hours (likely stale)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    
    const { data: staleSessions, error: fetchError } = await supabase
      .from('walking_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .lt('start_time', twelveHoursAgo);

    if (fetchError) {
      console.error('Error fetching stale sessions:', fetchError);
      return;
    }

    if (staleSessions && staleSessions.length > 0) {
      console.log('🚶 Found stale walking sessions:', staleSessions.length);
      
      // End all stale sessions
      const { error: updateError } = await supabase
        .from('walking_sessions')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString(),
          session_state: null
        })
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .lt('start_time', twelveHoursAgo);

      if (updateError) {
        console.error('Error cleaning up stale sessions:', updateError);
      } else {
        console.log('🚶 Successfully cleaned up stale walking sessions');
      }
    }
  } catch (error) {
    console.error('Error in walkingSessionCleanup:', error);
  }
};

/**
 * Force end the current active session (for emergency cleanup)
 */
export const forceEndCurrentSession = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('walking_sessions')
      .update({
        status: 'cancelled',
        end_time: new Date().toISOString(),
        session_state: null
      })
      .eq('user_id', userId)
      .in('status', ['active', 'paused']);

    if (error) {
      console.error('Error force ending session:', error);
      return false;
    }
    
    console.log('🚶 Force ended current walking session');
    return true;
  } catch (error) {
    console.error('Error in forceEndCurrentSession:', error);
    return false;
  }
};