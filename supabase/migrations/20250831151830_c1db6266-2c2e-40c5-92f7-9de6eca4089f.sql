-- Update existing users who have moderately_active to lightly_active as the new default
UPDATE profiles 
SET activity_level = 'lightly_active' 
WHERE activity_level = 'moderately_active';