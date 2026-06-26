-- Add archived column to kanban_tasks
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS archived boolean default false;
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create index for archived filtering
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_archived ON kanban_tasks(archived);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_archived_at ON kanban_tasks(archived_at);
