-- Update quotesexperts@gmail.com to be a free user for testing
UPDATE public.profiles 
SET access_level = 'free',
    premium_expires_at = NULL,
    trial_ends_at = NULL,
    updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'quotesexperts@gmail.com'
);