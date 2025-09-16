-- Fix the data inconsistency in walking sessions
-- Sessions that are cancelled should not have active session_state
UPDATE walking_sessions 
SET session_state = 'completed',
    updated_at = now()
WHERE status = 'cancelled' AND session_state = 'active';