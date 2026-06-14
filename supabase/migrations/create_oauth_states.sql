-- Create oauth_states table for temporary OAuth state tracking
CREATE TABLE IF NOT EXISTS oauth_states (
  state uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT now() + INTERVAL '10 minutes'
);

-- Enable RLS
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX idx_oauth_states_user_provider ON oauth_states(user_id, provider);

-- Allow service role to manage oauth_states
CREATE POLICY "Service role can manage oauth states"
  ON oauth_states FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: Create a function to clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
