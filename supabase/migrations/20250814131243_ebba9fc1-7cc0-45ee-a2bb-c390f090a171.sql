-- Fix the inconsistency: trial has expired so user_tier should be free_user
UPDATE public.profiles 
SET user_tier = 'free_user'
WHERE user_id = '84f952e6-690b-473f-b0cc-c579ac077b45'
AND trial_ends_at < now()
AND subscription_status = 'free';

-- Verify the fix
SELECT user_id, subscription_tier, user_tier, trial_started_at, trial_ends_at, subscription_status, payment_provider
FROM public.profiles 
WHERE user_id = '84f952e6-690b-473f-b0cc-c579ac077b45';