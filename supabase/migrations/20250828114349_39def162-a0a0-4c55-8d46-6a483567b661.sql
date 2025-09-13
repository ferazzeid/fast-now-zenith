-- Clean up unused Google Analytics settings
DELETE FROM shared_settings 
WHERE setting_key IN ('google_analytics_service_account', 'google_analytics_property_id');