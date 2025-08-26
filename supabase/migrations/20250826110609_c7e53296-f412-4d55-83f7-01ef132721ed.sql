-- Clear the old content_rotation_data to force use of new individual content fields
UPDATE fasting_hours 
SET content_rotation_data = NULL 
WHERE content_rotation_data IS NOT NULL;