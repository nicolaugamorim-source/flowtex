CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  action_type text,
  action_result text,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages USING btree (user_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own chat messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);
