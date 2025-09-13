-- Update FASTNOW90 coupon to never expire
UPDATE coupon_codes 
SET expires_at = NULL, 
    updated_at = now()
WHERE code = 'FASTNOW90';