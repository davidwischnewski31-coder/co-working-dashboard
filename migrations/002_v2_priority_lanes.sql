-- Co-Working Dashboard V2 Migration
-- Updates for priority-based workflow

-- Update tasks status to include 'blocked' and simplify workflow
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK(status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done'));

-- Update default status to 'todo' for new tasks
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'todo';

-- Add assignee column (replaces owner for V2 clarity)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_type TEXT CHECK(assignee_type IN ('human', 'agent', 'unassigned'));

-- Migrate existing data: owner → assignee
UPDATE tasks SET assignee = owner, assignee_type = owner_type WHERE assignee IS NULL;

-- Create index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status ON tasks(priority, status);

-- Add position field for manual ordering within priority lanes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add completed_at for progress tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create view for progress stats
CREATE OR REPLACE VIEW task_stats AS
SELECT
  DATE_TRUNC('week', completed_at) as week,
  COUNT(*) as tasks_completed,
  COUNT(*) FILTER (WHERE assignee_type = 'human') as human_tasks,
  COUNT(*) FILTER (WHERE assignee_type = 'agent') as agent_tasks,
  COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority,
  COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
  COUNT(*) FILTER (WHERE priority = 'low') as low_priority
FROM tasks
WHERE status = 'done' AND completed_at IS NOT NULL
GROUP BY week
ORDER BY week DESC;

COMMENT ON TABLE tasks IS 'V2: Priority-based task management with human-AI collaboration';
