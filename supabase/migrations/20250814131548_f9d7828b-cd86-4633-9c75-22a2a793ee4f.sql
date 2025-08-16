-- Force the user_tier update since the automatic logic isn't working
UPDATE public.profiles 
SET user_tier = 'free_user'
WHERE user_id = '84f952e6-690b-473f-b0cc-c579ac077b45';

-- Verify the update worked
SELECT user_id, subscription_tier, user_tier, trial_started_at, trial_ends_at, subscription_status
FROM public.profiles 
WHERE user_id = '84f952e6-690b-473f-b0cc-c579ac077b45';