-- Update the default activity level from 'sedentary' to 'lightly_active'
ALTER TABLE profiles ALTER COLUMN activity_level SET DEFAULT 'lightly_active';