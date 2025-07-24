-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Add adjustable request limits to shared_settings
INSERT INTO public.shared_settings (setting_key, setting_value) 
VALUES 
  ('monthly_request_limit', '1000'),
  ('free_request_limit', '15')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Create usage analytics table for business intelligence
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'limit_reached', 'warning_80', 'warning_90', 'subscription_upgrade', etc.
  requests_count INTEGER,
  subscription_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on usage_analytics
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for usage_analytics
CREATE POLICY "Admins can view all analytics" ON public.usage_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert analytics" ON public.usage_analytics
FOR INSERT
WITH CHECK (true);

-- Create function to track usage events
CREATE OR REPLACE FUNCTION public.track_usage_event(
  _user_id UUID,
  _event_type TEXT,
  _requests_count INTEGER DEFAULT NULL,
  _subscription_status TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_analytics (user_id, event_type, requests_count, subscription_status)
  VALUES (_user_id, _event_type, _requests_count, _subscription_status);
END;
$$;