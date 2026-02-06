-- Co-Working Dashboard Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects (synced from davidai + dashboard-created)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('idea', 'active', 'paused', 'shipped')) DEFAULT 'idea',
  color TEXT DEFAULT '#6B7280',
  external_source TEXT, -- 'davidai', 'github', null (dashboard-created)
  external_id TEXT,     -- path or repo name
  metadata JSONB,       -- flexible data (tags, links, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_external ON projects(external_source, external_id);
CREATE UNIQUE INDEX idx_projects_external_unique ON projects(external_source, external_id) 
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- Tasks (Kanban board items)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT CHECK(status IN ('backlog', 'todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  owner TEXT NOT NULL,           -- 'David' | agent name
  owner_type TEXT CHECK(owner_type IN ('human', 'agent')) NOT NULL,
  agent_metadata JSONB,          -- { model, iterations, tokens } for agents
  tags TEXT[],
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_owner ON tasks(owner, owner_type);

-- Ideas (brainstorm → research → shipped)
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                 -- 'product', 'tool', 'business', 'research'
  status TEXT CHECK(status IN ('brainstorm', 'research', 'in_progress', 'shipped')) DEFAULT 'brainstorm',
  owner TEXT NOT NULL DEFAULT 'David',
  owner_type TEXT CHECK(owner_type IN ('human', 'agent')) DEFAULT 'human',
  metadata JSONB,                -- links, notes, related projects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_category ON ideas(category);

-- Reading Lists
CREATE TABLE reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles in reading lists
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_list_id UUID NOT NULL REFERENCES reading_lists(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  status TEXT CHECK(status IN ('unread', 'reading', 'read', 'archived')) DEFAULT 'unread',
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_articles_list ON articles(reading_list_id);
CREATE INDEX idx_articles_status ON articles(status);

-- Activity log (audit trail for attribution)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,     -- 'task', 'project', 'idea', 'article'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,          -- 'created', 'updated', 'completed', 'moved'
  actor TEXT NOT NULL,           -- 'David' | agent name
  actor_type TEXT CHECK(actor_type IN ('human', 'agent')) NOT NULL,
  changes JSONB,                 -- { before: {...}, after: {...} }
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_actor ON activity_log(actor, actor_type);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
