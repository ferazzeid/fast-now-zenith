-- Phase 3A: Google Play Integration Setup
-- Configure Google Play service account and product settings

-- Insert Google Play provider configuration
INSERT INTO public.payment_provider_configs (
  provider,
  is_active,
  config_data
) VALUES (
  'google_play',
  true,
  '{
    "package_name": "com.fastnow.zenith",
    "service_account_key": null,
    "product_ids": {
      "premium_subscription_monthly": {
        "price": "9.99",
        "currency": "USD",
        "type": "subscription",
        "billing_period": "P1M"
      }
    },
    "test_mode": true
  }'::jsonb
)
ON CONFLICT (provider) 
DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create Google Play specific indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_receipts_provider_user 
  ON public.payment_receipts (provider, user_id);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_transaction_id 
  ON public.payment_receipts (transaction_id) 
  WHERE provider = 'google_play';

CREATE INDEX IF NOT EXISTS idx_profiles_google_play_token 
  ON public.profiles (google_play_purchase_token) 
  WHERE google_play_purchase_token IS NOT NULL;

-- Function to configure Google Play service account
CREATE OR REPLACE FUNCTION public.configure_google_play_service_account(
  service_account_json TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate JSON format
  PERFORM service_account_json::jsonb;
  
  -- Update configuration
  UPDATE public.payment_provider_configs 
  SET 
    config_data = config_data || jsonb_build_object('service_account_key', service_account_json),
    updated_at = now()
  WHERE provider = 'google_play';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Google Play provider configuration not found';
  END IF;
END;
$$;