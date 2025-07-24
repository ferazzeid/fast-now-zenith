-- Fix Security Linter Issues

-- 1. Update functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT encode(encrypt(api_key::bytea, 'your-encryption-key-here'::bytea, 'aes'), 'base64');
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT convert_from(decrypt(decode(encrypted_key, 'base64'), 'your-encryption-key-here'::bytea, 'aes'), 'UTF8');
$$;

CREATE OR REPLACE FUNCTION public.validate_input(
  field_name text,
  input_value text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  validation_rule RECORD;
  is_valid boolean := true;
  sanitized_value text := input_value;
  errors text[] := '{}';
BEGIN
  -- Get validation rules for this field
  SELECT * INTO validation_rule 
  FROM public.input_validation_rules 
  WHERE field_name = validate_input.field_name;
  
  IF FOUND THEN
    -- Check length
    IF validation_rule.max_length IS NOT NULL AND length(input_value) > validation_rule.max_length THEN
      is_valid := false;
      errors := array_append(errors, 'Input exceeds maximum length');
    END IF;
    
    -- Basic XSS prevention - remove script tags and javascript: protocols
    sanitized_value := regexp_replace(sanitized_value, '<script[^>]*>.*?</script>', '', 'gi');
    sanitized_value := regexp_replace(sanitized_value, 'javascript:', '', 'gi');
    sanitized_value := regexp_replace(sanitized_value, 'data:text/html', '', 'gi');
    
    -- Remove potentially dangerous HTML attributes
    sanitized_value := regexp_replace(sanitized_value, 'on\w+\s*=', '', 'gi');
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'sanitized_value', sanitized_value,
    'errors', errors
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _event_type text,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, event_type, details)
  VALUES (_user_id, _event_type, _details);
END;
$$;