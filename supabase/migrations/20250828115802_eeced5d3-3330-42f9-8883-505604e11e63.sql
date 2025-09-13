-- Clean up non-Stripe payment providers
DELETE FROM payment_provider_configs 
WHERE provider IN ('google_play', 'apple_app_store');

-- Ensure Stripe provider exists with comprehensive config structure
INSERT INTO payment_provider_configs (provider, is_active, config_data)
VALUES (
  'stripe',
  true,
  '{
    "secret_key": "",
    "publishable_key": "",
    "webhook_url": "",
    "test_mode": true,
    "products": {
      "basic": {
        "price_id": "",
        "amount": 999
      },
      "premium": {
        "price_id": "",
        "amount": 1999
      }
    },
    "success_url": "/subscription-success",
    "cancel_url": "/subscription-cancelled"
  }'::jsonb
)
ON CONFLICT (provider) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  updated_at = now();