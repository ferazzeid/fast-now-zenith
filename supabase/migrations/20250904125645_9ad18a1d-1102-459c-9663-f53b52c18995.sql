-- Remove the old predefined_motivators from shared_settings
DELETE FROM shared_settings WHERE setting_key = 'predefined_motivators';