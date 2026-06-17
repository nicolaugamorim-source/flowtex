-- Create kanban_tasks table
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  column_id text NOT NULL DEFAULT 'todo' CHECK (column_id IN ('todo', 'in_progress', 'review', 'done')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks"
  ON kanban_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON kanban_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON kanban_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON kanban_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to manage all tasks
CREATE POLICY "Service role can manage tasks"
  ON kanban_tasks FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_kanban_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_kanban_tasks_timestamp_trigger ON kanban_tasks;
CREATE TRIGGER update_kanban_tasks_timestamp_trigger
  BEFORE UPDATE ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_tasks_timestamp();

-- Create indexes for common queries
CREATE INDEX idx_kanban_tasks_user_id ON kanban_tasks(user_id);
CREATE INDEX idx_kanban_tasks_column_id ON kanban_tasks(column_id);
