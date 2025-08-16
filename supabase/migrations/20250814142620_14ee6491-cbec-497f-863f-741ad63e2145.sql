-- Fix subscription status consistency
-- When trial_ends_at is in the future and user is not paid, status should be 'trial'
UPDATE profiles 
SET subscription_status = 'trial'
WHERE trial_ends_at > now() 
  AND subscription_status = 'free' 
  AND (subscription_tier IS NULL OR subscription_tier = 'free');