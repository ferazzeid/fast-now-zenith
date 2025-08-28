-- Add animation control columns for quotes and notes in timers
ALTER TABLE profiles 
ADD COLUMN enable_quotes_in_animations boolean DEFAULT true,
ADD COLUMN enable_notes_in_animations boolean DEFAULT true;