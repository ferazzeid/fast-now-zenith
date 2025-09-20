-- Add constraints to prevent null values in walking session calculated fields
ALTER TABLE public.walking_sessions 
  ALTER COLUMN duration_minutes SET DEFAULT 0,
  ALTER COLUMN distance SET DEFAULT 0,
  ALTER COLUMN calories_burned SET DEFAULT 0,
  ALTER COLUMN estimated_steps SET DEFAULT 0;

-- Add check constraints to ensure sensible values
ALTER TABLE public.walking_sessions 
  ADD CONSTRAINT check_duration_minutes_non_negative 
    CHECK (duration_minutes >= 0);

ALTER TABLE public.walking_sessions 
  ADD CONSTRAINT check_distance_non_negative 
    CHECK (distance >= 0);

ALTER TABLE public.walking_sessions 
  ADD CONSTRAINT check_calories_non_negative 
    CHECK (calories_burned >= 0);

ALTER TABLE public.walking_sessions 
  ADD CONSTRAINT check_steps_non_negative 
    CHECK (estimated_steps >= 0);

-- Update existing null values to 0 for consistency
UPDATE public.walking_sessions 
SET 
  duration_minutes = COALESCE(duration_minutes, 0),
  distance = COALESCE(distance, 0),
  calories_burned = COALESCE(calories_burned, 0),
  estimated_steps = COALESCE(estimated_steps, 0)
WHERE duration_minutes IS NULL 
   OR distance IS NULL 
   OR calories_burned IS NULL 
   OR estimated_steps IS NULL;