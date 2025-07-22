
-- Create connection_tokens table for WebSocket authentication
CREATE TABLE IF NOT EXISTS connection_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_connection_tokens_token ON connection_tokens(token);
CREATE INDEX IF NOT EXISTS idx_connection_tokens_expires_at ON connection_tokens(expires_at);

-- Enable RLS
ALTER TABLE connection_tokens ENABLE ROW LEVEL SECURITY;

-- Add RLS policy (only service role can access)
CREATE POLICY "Service role can manage connection tokens" ON connection_tokens
  FOR ALL USING (auth.role() = 'service_role');
