-- Add new columns to kanban_tasks
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS category text default 'task';
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS tags text[] default '{}';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_category ON kanban_tasks(category);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON kanban_tasks(due_date);
