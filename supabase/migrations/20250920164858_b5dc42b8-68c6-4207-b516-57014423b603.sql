-- Clean up stale active IF sessions that should be marked as incomplete
UPDATE intermittent_fasting_sessions 
SET 
  status = 'incomplete',
  updated_at = now()
WHERE status = 'active' 
  AND fasting_start_time IS NOT NULL
  AND fasting_start_time < (now() - '24 hours'::INTERVAL);

-- Also clean up sessions that are in 'fasting' or 'eating' status (old statuses) 
-- and convert them to appropriate new statuses
UPDATE intermittent_fasting_sessions 
SET 
  status = CASE 
    WHEN status = 'fasting' AND fasting_start_time < (now() - '24 hours'::INTERVAL) THEN 'incomplete'
    WHEN status = 'eating' AND eating_start_time < (now() - '24 hours'::INTERVAL) THEN 'incomplete' 
    WHEN status = 'fasting' THEN 'active'
    WHEN status = 'eating' THEN 'active'
    ELSE status
  END,
  updated_at = now()
WHERE status IN ('fasting', 'eating');