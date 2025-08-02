-- Add multi-platform payment support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS subscription_product_id TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_id TEXT;

-- Create table for payment provider configurations
CREATE TABLE IF NOT EXISTS public.payment_provider_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  config_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment provider configs
ALTER TABLE public.payment_provider_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage payment provider configs
CREATE POLICY "Admins can manage payment provider configs" 
ON public.payment_provider_configs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for receipt validation logs
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  receipt_data JSONB NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending',
  validation_response JSONB,
  subscription_id TEXT,
  transaction_id TEXT,
  product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for payment receipts
CREATE POLICY "Users can insert their own payment receipts" 
ON public.payment_receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment provider configurations
INSERT INTO public.payment_provider_configs (provider, config_data, is_active) 
VALUES 
  ('stripe', '{}', true),
  ('google_play', '{"service_account_key": null, "package_name": "app.lovable.de91d618edcf40eb8e117c45904095be"}', false),
  ('apple_app_store', '{"shared_secret": null, "bundle_id": "app.lovable.de91d618edcf40eb8e117c45904095be"}', false)
ON CONFLICT (provider) DO NOTHING;

-- Create function to detect platform and return appropriate payment provider
CREATE OR REPLACE FUNCTION public.get_payment_provider_for_platform(_platform TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE _platform
    WHEN 'android' THEN
      RETURN 'google_play';
    WHEN 'ios' THEN
      RETURN 'apple_app_store';
    ELSE
      RETURN 'stripe';
  END CASE;
END;
$function$;

-- Create function to update subscription from receipt validation
CREATE OR REPLACE FUNCTION public.update_subscription_from_receipt(
  _user_id UUID,
  _provider TEXT,
  _subscription_id TEXT,
  _product_id TEXT,
  _status TEXT,
  _expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update user's subscription status
  UPDATE public.profiles 
  SET 
    subscription_status = _status,
    payment_provider = _provider,
    platform_subscription_id = _subscription_id,
    subscription_product_id = _product_id,
    subscription_end_date = _expires_at,
    subscription_tier = CASE 
      WHEN _status IN ('active', 'trialing') THEN 'paid'
      ELSE 'free'
    END,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Update user tier
  PERFORM public.update_user_tier(_user_id);
END;
$function$;

-- Add trigger for updated_at on payment_provider_configs
CREATE TRIGGER update_payment_provider_configs_updated_at
  BEFORE UPDATE ON public.payment_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on payment_receipts
CREATE TRIGGER update_payment_receipts_updated_at
  BEFORE UPDATE ON public.payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();