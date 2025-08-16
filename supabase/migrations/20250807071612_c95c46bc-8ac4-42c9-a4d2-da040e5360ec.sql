-- Add unique constraint to prevent multiple active fasting sessions per user
ALTER TABLE public.fasting_sessions 
ADD CONSTRAINT unique_active_fasting_session 
EXCLUDE (user_id WITH =) WHERE (status = 'active');

-- Clean up any existing duplicate active sessions (keep the most recent one)
WITH duplicate_active_sessions AS (
  SELECT id, user_id, start_time,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY start_time DESC) as rn
  FROM public.fasting_sessions 
  WHERE status = 'active'
)
UPDATE public.fasting_sessions 
SET status = 'cancelled', end_time = now()
WHERE id IN (
  SELECT id FROM duplicate_active_sessions WHERE rn > 1
);

-- Add similar constraint for walking sessions if needed
ALTER TABLE public.walking_sessions 
ADD CONSTRAINT unique_active_walking_session 
EXCLUDE (user_id WITH =) WHERE (status = 'active');

-- Clean up any existing duplicate active walking sessions
WITH duplicate_active_walking AS (
  SELECT id, user_id, start_time,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY start_time DESC) as rn
  FROM public.walking_sessions 
  WHERE status = 'active'
)
UPDATE public.walking_sessions 
SET status = 'cancelled', end_time = now()
WHERE id IN (
  SELECT id FROM duplicate_active_walking WHERE rn > 1
);