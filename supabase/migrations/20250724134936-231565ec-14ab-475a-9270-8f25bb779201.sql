-- Remove overkill security infrastructure

-- Drop security audit log table
DROP TABLE IF EXISTS public.security_audit_log CASCADE;

-- Drop input validation rules table  
DROP TABLE IF EXISTS public.input_validation_rules CASCADE;

-- Drop validation function
DROP FUNCTION IF EXISTS public.validate_input(text, text) CASCADE;

-- Drop security logging function
DROP FUNCTION IF EXISTS public.log_security_event(uuid, text, jsonb) CASCADE;