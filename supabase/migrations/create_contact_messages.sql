-- Create contact_messages table for the public /contact form
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS — no public policies at all. The form is unauthenticated (a
-- prospect, not a logged-in user), so inserts go through the service role
-- client in app/api/contact/route.ts instead of a public INSERT policy.
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage contact messages"
  ON contact_messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
