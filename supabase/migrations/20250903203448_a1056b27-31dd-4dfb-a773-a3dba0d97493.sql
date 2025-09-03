-- Clean up legacy admin_goal_ideas from shared_settings 
-- The app now uses system_motivators as single source of truth
DELETE FROM shared_settings 
WHERE setting_key = 'admin_goal_ideas';