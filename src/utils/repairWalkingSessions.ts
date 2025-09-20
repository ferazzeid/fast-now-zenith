import { supabase } from '@/integrations/supabase/client';

interface BrokenSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  distance: number | null;
  calories_burned: number | null;
  estimated_steps: number | null;
  speed_mph: number | null;
}

interface RepairStats {
  sessionsFound: number;
  sessionsRepaired: number;
  errors: string[];
}

/**
 * Repairs walking sessions with missing calculated values
 */
export const repairWalkingSessions = async (userId?: string): Promise<RepairStats> => {
  console.log('🔧 Starting walking session repair process...');
  
  const stats: RepairStats = {
    sessionsFound: 0,
    sessionsRepaired: 0,
    errors: []
  };

  try {
    // Find sessions with null calculated values but valid start/end times
    let query = supabase
      .from('walking_sessions')
      .select('*')
      .not('start_time', 'is', null)
      .not('end_time', 'is', null)
      .or('duration_minutes.is.null,distance.is.null,calories_burned.is.null,estimated_steps.is.null');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: brokenSessions, error: fetchError } = await query;

    if (fetchError) {
      stats.errors.push(`Failed to fetch broken sessions: ${fetchError.message}`);
      return stats;
    }

    if (!brokenSessions || brokenSessions.length === 0) {
      console.log('✅ No broken sessions found');
      return stats;
    }

    stats.sessionsFound = brokenSessions.length;
    console.log(`🔧 Found ${brokenSessions.length} sessions needing repair`);

    // Get user profiles for calculation
    const userIds = [...new Set(brokenSessions.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, weight, height, default_walking_speed')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Repair each session
    for (const session of brokenSessions) {
      try {
        const profile = profileMap.get(session.user_id);
        const repaired = await repairSingleSession(session, profile);
        
        if (repaired) {
          stats.sessionsRepaired++;
          console.log(`✅ Repaired session ${session.id}`);
        }
      } catch (error) {
        const errorMsg = `Failed to repair session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        stats.errors.push(errorMsg);
        console.error('🚨', errorMsg);
      }
    }

    console.log('🔧 Repair process complete:', stats);
    return stats;

  } catch (error) {
    const errorMsg = `Repair process failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    stats.errors.push(errorMsg);
    console.error('🚨 Repair process error:', errorMsg);
    return stats;
  }
};

/**
 * Repairs a single walking session
 */
const repairSingleSession = async (session: BrokenSession, profile?: any): Promise<boolean> => {
  if (!session.start_time || !session.end_time) {
    console.warn(`⚠️ Session ${session.id} missing start or end time, skipping`);
    return false;
  }

  // Calculate duration
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));

  if (durationMinutes === 0) {
    console.warn(`⚠️ Session ${session.id} has zero duration, skipping`);
    return false;
  }

  // Get session speed (fallback to profile default or system default)
  const sessionSpeed = session.speed_mph || profile?.default_walking_speed || 3.2;

  // Calculate metrics
  const distance = Math.round(((sessionSpeed * durationMinutes) / 60) * 100) / 100;

  // Calculate calories
  let caloriesBurned = 0;
  if (profile?.weight && profile.weight > 0) {
    const speedKmh = sessionSpeed * 1.60934;
    const met = speedKmh < 4.0 ? 2.5 : speedKmh < 5.6 ? 3.0 : speedKmh < 6.4 ? 3.5 : speedKmh < 7.2 ? 4.0 : 4.5;
    const hours = durationMinutes / 60;
    caloriesBurned = Math.round(met * profile.weight * hours);
  } else {
    // Fallback calculation with average weight
    const speedKmh = sessionSpeed * 1.60934;
    const met = speedKmh < 4.0 ? 2.5 : speedKmh < 5.6 ? 3.0 : speedKmh < 6.4 ? 3.5 : speedKmh < 7.2 ? 4.0 : 4.5;
    const hours = durationMinutes / 60;
    caloriesBurned = Math.round(met * 70 * hours); // 70kg average weight
  }

  // Calculate estimated steps
  let estimatedSteps = 0;
  if (profile?.height && profile.height > 0) {
    // Use height-based stride calculation
    const heightCm = profile.height;
    const strideLength = (heightCm * 0.43) / 100; // meters
    const distanceMeters = distance * 1609.34;
    estimatedSteps = Math.round(distanceMeters / strideLength);
  } else {
    // Fallback: steps per minute based on speed
    const stepsPerMinute = sessionSpeed <= 2 ? 80 : sessionSpeed <= 3 ? 100 : sessionSpeed <= 4 ? 120 : sessionSpeed <= 5 ? 140 : 160;
    estimatedSteps = Math.round(stepsPerMinute * durationMinutes);
  }

  // Update the session with calculated values
  const updates: any = {
    updated_at: new Date().toISOString()
  };

  // Only update null fields to preserve existing data
  if (session.duration_minutes === null) updates.duration_minutes = durationMinutes;
  if (session.distance === null) updates.distance = distance;
  if (session.calories_burned === null) updates.calories_burned = caloriesBurned;
  if (session.estimated_steps === null) updates.estimated_steps = estimatedSteps;
  if (session.speed_mph === null) updates.speed_mph = sessionSpeed;

  // Mark as edited if we're updating calculated values
  if (Object.keys(updates).length > 1) {
    updates.is_edited = true;
    updates.edit_reason = 'Retroactive calculation repair';
  }

  const { error } = await supabase
    .from('walking_sessions')
    .update(updates)
    .eq('id', session.id);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }

  console.log(`🔧 Repaired session ${session.id}:`, {
    durationMinutes,
    distance,
    caloriesBurned,
    estimatedSteps,
    sessionSpeed
  });

  return true;
};

/**
 * Repairs walking sessions for the current user
 */
export const repairCurrentUserWalkingSessions = async (): Promise<RepairStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  return repairWalkingSessions(user.id);
};