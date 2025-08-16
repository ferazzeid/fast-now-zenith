-- Remove free_request_limit setting from shared_settings
DELETE FROM shared_settings WHERE setting_key = 'free_request_limit';