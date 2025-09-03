-- Fix all goal idea URLs to use correct domain
UPDATE shared_settings 
SET setting_value = REPLACE(
  setting_value::text, 
  'https://fastnow.zenithins.com', 
  'https://fastnow.app'
)::jsonb
WHERE setting_key = 'admin_goal_ideas' 
  AND setting_value::text LIKE '%fastnow.zenithins.com%';