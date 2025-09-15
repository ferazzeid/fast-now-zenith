-- Clean up stale walking sessions (older than 8 hours)
UPDATE walking_sessions 
SET status = 'cancelled', 
    end_time = NOW(), 
    session_state = NULL 
WHERE status IN ('active', 'paused') 
  AND start_time < NOW() - INTERVAL '8 hours';