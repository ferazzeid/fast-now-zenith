-- Update user tier for current admin user to fix subscription inconsistency
SELECT public.update_user_tier('84f952e6-690b-473f-b0cc-c579ac077b45');

-- Check current profile state
SELECT user_id, subscription_tier, user_tier, trial_started_at, trial_ends_at, subscription_status, payment_provider
FROM public.profiles 
WHERE user_id = '84f952e6-690b-473f-b0cc-c579ac077b45';