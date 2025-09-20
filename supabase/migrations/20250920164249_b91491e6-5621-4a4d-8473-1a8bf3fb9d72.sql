-- Phase 1: Standardize status system across all session types

-- First, update intermittent_fasting_sessions to use unified status values
-- Convert old statuses to new standardized ones
UPDATE intermittent_fasting_sessions 
SET status = CASE 
  WHEN status = 'fasting' OR status = 'eating' THEN 'active'
  WHEN status = 'expired' THEN 'incomplete' 
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'canceled' THEN 'cancelled'
  ELSE status
END;

-- Add missing history tracking fields to intermittent_fasting_sessions
ALTER TABLE intermittent_fasting_sessions 
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS original_fasting_window_hours integer,
ADD COLUMN IF NOT EXISTS original_eating_window_hours integer,
ADD COLUMN IF NOT EXISTS original_fasting_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS original_eating_start_time timestamp with time zone;

-- Add missing history tracking fields to fasting_sessions (extended fasting)
ALTER TABLE fasting_sessions 
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS original_duration_seconds integer,
ADD COLUMN IF NOT EXISTS original_goal_duration_seconds integer,
ADD COLUMN IF NOT EXISTS original_start_time timestamp with time zone;

-- Ensure walking_sessions has consistent status values (already has edit fields)
-- Update any inconsistent statuses in walking_sessions if they exist
UPDATE walking_sessions 
SET status = CASE 
  WHEN status = 'active' THEN 'active'
  WHEN status = 'completed' THEN 'completed'  
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'incomplete'
END
WHERE status NOT IN ('active', 'completed', 'cancelled', 'incomplete');

-- Clean up stale intermittent fasting sessions (older than 24 hours and still active)
UPDATE intermittent_fasting_sessions 
SET 
  status = 'incomplete',
  eating_end_time = COALESCE(eating_end_time, fasting_start_time + (fasting_window_hours + eating_window_hours || ' hours')::INTERVAL),
  updated_at = now()
WHERE status = 'active' 
  AND created_at < (now() - '24 hours'::INTERVAL);

-- Clean up stale extended fasting sessions (older than goal duration + 1 hour and still active)  
UPDATE fasting_sessions 
SET 
  status = 'incomplete',
  end_time = COALESCE(end_time, start_time + (COALESCE(goal_duration_seconds, 259200) || ' seconds')::INTERVAL),
  duration_seconds = COALESCE(duration_seconds, EXTRACT(EPOCH FROM (COALESCE(end_time, start_time + (COALESCE(goal_duration_seconds, 259200) || ' seconds')::INTERVAL) - start_time))::integer),
  updated_at = now()
WHERE status = 'active' 
  AND start_time < (now() - (COALESCE(goal_duration_seconds, 259200) + 3600) * '1 second'::INTERVAL);