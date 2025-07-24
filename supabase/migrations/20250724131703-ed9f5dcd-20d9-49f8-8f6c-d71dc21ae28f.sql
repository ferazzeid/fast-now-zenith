-- Phase 1: Critical Security Fixes

-- 1. Add API key encryption functionality
-- Create a function to encrypt/decrypt API keys (using built-in Postgres pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt API keys before storage
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(encrypt(api_key::bytea, 'your-encryption-key-here'::bytea, 'aes'), 'base64');
$$;

-- Create a function to decrypt API keys for use
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT convert_from(decrypt(decode(encrypted_key, 'base64'), 'your-encryption-key-here'::bytea, 'aes'), 'UTF8');
$$;

-- 2. Add input validation table for sanitization rules
CREATE TABLE IF NOT EXISTS public.input_validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  max_length integer DEFAULT 1000,
  allowed_patterns text[], -- Array of allowed regex patterns
  blocked_patterns text[], -- Array of blocked regex patterns (XSS, injection)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on validation rules
ALTER TABLE public.input_validation_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage validation rules
CREATE POLICY "Admins can manage validation rules" 
ON public.input_validation_rules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 4. Add function to validate and sanitize input
CREATE OR REPLACE FUNCTION public.validate_input(
  field_name text,
  input_value text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 5. Insert default validation rules
INSERT INTO public.input_validation_rules (field_name, max_length, blocked_patterns) VALUES
  ('title', 200, ARRAY['<script', 'javascript:', 'data:text/html']),
  ('content', 5000, ARRAY['<script', 'javascript:', 'data:text/html']),
  ('description', 1000, ARRAY['<script', 'javascript:', 'data:text/html']),
  ('display_name', 100, ARRAY['<script', 'javascript:', 'data:text/html'])
ON CONFLICT DO NOTHING;

-- 6. Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _event_type text,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, event_type, details)
  VALUES (_user_id, _event_type, _details);
END;
$$;

-- 7. Add triggers for automatic timestamp updates
CREATE TRIGGER update_input_validation_rules_updated_at
  BEFORE UPDATE ON public.input_validation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();