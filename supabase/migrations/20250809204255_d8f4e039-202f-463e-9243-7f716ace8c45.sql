-- Update fasting sessions that are marked as completed but didn't reach their goal
UPDATE fasting_sessions 
SET status = 'incomplete'
WHERE status = 'completed' 
  AND duration_seconds IS NOT NULL 
  AND goal_duration_seconds IS NOT NULL 
  AND duration_seconds < goal_duration_seconds;