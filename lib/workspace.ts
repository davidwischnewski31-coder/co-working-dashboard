export type OwnerType = 'human' | 'agent'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkspaceTask {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: TaskStatus
  priority: TaskPriority
  owner: string
  owner_type: OwnerType
  due_date: string | null
  tags: string[]
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type ProjectStatus = 'idea' | 'active' | 'paused' | 'shipped'

export interface WorkspaceProject {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  color: string
  created_at: string
  updated_at: string
}

export type IdeaStatus = 'brainstorm' | 'research' | 'in_progress' | 'shipped'
export type IdeaCategory = 'product' | 'tool' | 'business' | 'research'

export interface WorkspaceIdea {
  id: string
  title: string
  description: string | null
  category: IdeaCategory
  status: IdeaStatus
  owner: string
  owner_type: OwnerType
  created_at: string
  updated_at: string
}

export interface WorkspaceReadingList {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type ArticleStatus = 'unread' | 'reading' | 'read' | 'archived'

export interface WorkspaceArticle {
  id: string
  reading_list_id: string
  url: string
  title: string
  status: ArticleStatus
  added_at: string
  updated_at: string
}

export type ActivityEntityType = 'task' | 'project' | 'idea' | 'article'
export type ActivityAction = 'created' | 'updated' | 'moved' | 'completed' | 'deleted'

export interface WorkspaceActivity {
  id: string
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  actor: string
  actor_type: OwnerType
  message: string
  timestamp: string
}

export interface WorkspaceData {
  tasks: WorkspaceTask[]
  projects: WorkspaceProject[]
  ideas: WorkspaceIdea[]
  readingLists: WorkspaceReadingList[]
  articles: WorkspaceArticle[]
  activities: WorkspaceActivity[]
}

export const STORAGE_KEY = 'co_working_dashboard.workspace.v2'
export const WORKSPACE_EVENT = 'co_working_dashboard:changed'

const PROJECT_IDS = {
  dashboard: 'project_dashboard',
  revenue: 'project_revenue',
  ops: 'project_ops',
  growth: 'project_growth',
} as const

const LIST_IDS = {
  product: 'reading_product',
  market: 'reading_market',
} as const

const SEED_BASE_DATE = new Date('2026-02-20T13:00:00.000Z')

function isoDaysFromNow(days: number): string {
  const next = new Date(SEED_BASE_DATE)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString()
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildSeedWorkspaceData(): WorkspaceData {
  const now = isoDaysFromNow(0)

  const projects: WorkspaceProject[] = [
    {
      id: PROJECT_IDS.dashboard,
      name: 'Co-Working Dashboard',
      description: 'Ship a daily control center that removes task chaos.',
      status: 'active',
      color: '#EF6C00',
      created_at: isoDaysFromNow(-45),
      updated_at: now,
    },
    {
      id: PROJECT_IDS.revenue,
      name: 'Offer & Pricing',
      description: 'Package consulting offers and tighten pricing pages.',
      status: 'active',
      color: '#00796B',
      created_at: isoDaysFromNow(-32),
      updated_at: now,
    },
    {
      id: PROJECT_IDS.ops,
      name: 'Weekly Ops Rhythm',
      description: 'Create repeatable planning/review rituals.',
      status: 'active',
      color: '#546E7A',
      created_at: isoDaysFromNow(-20),
      updated_at: now,
    },
    {
      id: PROJECT_IDS.growth,
      name: 'Audience Growth Experiments',
      description: 'Test content hooks and outbound motions.',
      status: 'idea',
      color: '#8E24AA',
      created_at: isoDaysFromNow(-12),
      updated_at: now,
    },
  ]

  const tasks: WorkspaceTask[] = [
    {
      id: 'task_dashboard_mobile_shell',
      title: 'Ship responsive shell for dashboard',
      description: 'Sidebar drawer + mobile-first spacing so this is usable on phone and laptop.',
      project_id: PROJECT_IDS.dashboard,
      status: 'in_progress',
      priority: 'urgent',
      owner: 'David',
      owner_type: 'human',
      due_date: isoDaysFromNow(1),
      tags: ['ux', 'navigation'],
      created_at: isoDaysFromNow(-4),
      updated_at: now,
      completed_at: null,
    },
    {
      id: 'task_dashboard_local_mode',
      title: 'Enable local-first data mode',
      description: 'Must work even when backend/API is down.',
      project_id: PROJECT_IDS.dashboard,
      status: 'todo',
      priority: 'high',
      owner: 'AI Partner',
      owner_type: 'agent',
      due_date: isoDaysFromNow(0),
      tags: ['reliability'],
      created_at: isoDaysFromNow(-3),
      updated_at: now,
      completed_at: null,
    },
    {
      id: 'task_ops_weekly_review',
      title: 'Draft Friday weekly review template',
      description: 'One page template to close loops and plan next week.',
      project_id: PROJECT_IDS.ops,
      status: 'todo',
      priority: 'high',
      owner: 'David',
      owner_type: 'human',
      due_date: isoDaysFromNow(2),
      tags: ['planning'],
      created_at: isoDaysFromNow(-6),
      updated_at: now,
      completed_at: null,
    },
    {
      id: 'task_growth_hero_copy',
      title: 'Rewrite hero copy for consulting landing',
      description: 'Lead with pain + outcome in first 7 words.',
      project_id: PROJECT_IDS.revenue,
      status: 'backlog',
      priority: 'medium',
      owner: 'AI Partner',
      owner_type: 'agent',
      due_date: isoDaysFromNow(5),
      tags: ['copy', 'offer'],
      created_at: isoDaysFromNow(-8),
      updated_at: now,
      completed_at: null,
    },
    {
      id: 'task_blocked_metrics',
      title: 'Wire real pipeline metrics from CRM export',
      description: 'Blocked until latest CSV arrives from VA.',
      project_id: PROJECT_IDS.revenue,
      status: 'blocked',
      priority: 'high',
      owner: 'David',
      owner_type: 'human',
      due_date: isoDaysFromNow(3),
      tags: ['metrics'],
      created_at: isoDaysFromNow(-5),
      updated_at: now,
      completed_at: null,
    },
    {
      id: 'task_done_prompt_library',
      title: 'Publish first reusable prompt library',
      description: 'Initial v1 shipped to internal workspace.',
      project_id: PROJECT_IDS.ops,
      status: 'done',
      priority: 'medium',
      owner: 'AI Partner',
      owner_type: 'agent',
      due_date: isoDaysFromNow(-2),
      tags: ['systems'],
      created_at: isoDaysFromNow(-14),
      updated_at: isoDaysFromNow(-2),
      completed_at: isoDaysFromNow(-2),
    },
  ]

  const ideas: WorkspaceIdea[] = [
    {
      id: 'idea_context_budget',
      title: 'Context budget dashboard for each AI run',
      description: 'Show token burn and quality score per workflow.',
      category: 'tool',
      status: 'research',
      owner: 'David',
      owner_type: 'human',
      created_at: isoDaysFromNow(-10),
      updated_at: now,
    },
    {
      id: 'idea_client_momentum_report',
      title: 'Weekly client momentum one-pager',
      description: 'Auto-summarize wins, blockers, and asks.',
      category: 'business',
      status: 'brainstorm',
      owner: 'AI Partner',
      owner_type: 'agent',
      created_at: isoDaysFromNow(-3),
      updated_at: now,
    },
    {
      id: 'idea_focus_timer',
      title: 'Focus sprint timer tied to active task',
      description: 'Every sprint writes a short session note to activity.',
      category: 'product',
      status: 'in_progress',
      owner: 'David',
      owner_type: 'human',
      created_at: isoDaysFromNow(-5),
      updated_at: now,
    },
  ]

  const readingLists: WorkspaceReadingList[] = [
    {
      id: LIST_IDS.product,
      name: 'Product Decisions',
      description: 'Articles that affect the roadmap this month.',
      created_at: isoDaysFromNow(-20),
    },
    {
      id: LIST_IDS.market,
      name: 'Market Signals',
      description: 'Positioning, pricing, and GTM references.',
      created_at: isoDaysFromNow(-12),
    },
  ]

  const articles: WorkspaceArticle[] = [
    {
      id: 'article_jobs_to_be_done',
      reading_list_id: LIST_IDS.product,
      url: 'https://hbr.org/2005/12/marketing-malpractice-the-cause-and-the-cure',
      title: 'Marketing Malpractice: The Cause and the Cure',
      status: 'reading',
      added_at: isoDaysFromNow(-6),
      updated_at: now,
    },
    {
      id: 'article_pricing_research',
      reading_list_id: LIST_IDS.market,
      url: 'https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights',
      title: 'McKinsey Growth Insights',
      status: 'unread',
      added_at: isoDaysFromNow(-3),
      updated_at: now,
    },
    {
      id: 'article_landing_page_teardowns',
      reading_list_id: LIST_IDS.market,
      url: 'https://www.cxl.com/blog/',
      title: 'CXL Landing Page Teardowns',
      status: 'unread',
      added_at: isoDaysFromNow(-1),
      updated_at: now,
    },
  ]

  const activities: WorkspaceActivity[] = [
    {
      id: 'act_seed_1',
      entity_type: 'task',
      entity_id: 'task_dashboard_mobile_shell',
      action: 'moved',
      actor: 'David',
      actor_type: 'human',
      message: 'Moved "Ship responsive shell for dashboard" to in progress.',
      timestamp: isoDaysFromNow(-1),
    },
    {
      id: 'act_seed_2',
      entity_type: 'task',
      entity_id: 'task_done_prompt_library',
      action: 'completed',
      actor: 'AI Partner',
      actor_type: 'agent',
      message: 'Completed "Publish first reusable prompt library".',
      timestamp: isoDaysFromNow(-2),
    },
    {
      id: 'act_seed_3',
      entity_type: 'idea',
      entity_id: 'idea_focus_timer',
      action: 'updated',
      actor: 'David',
      actor_type: 'human',
      message: 'Promoted "Focus sprint timer tied to active task" to in progress.',
      timestamp: isoDaysFromNow(-3),
    },
  ]

  return {
    tasks,
    projects,
    ideas,
    readingLists,
    articles,
    activities,
  }
}

export function createEntityId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`

  return `${prefix}_${randomPart}`
}

export function getSeedWorkspaceData(): WorkspaceData {
  return cloneData(buildSeedWorkspaceData())
}

export function loadWorkspaceData(): WorkspaceData {
  if (typeof window === 'undefined') {
    return getSeedWorkspaceData()
  }

  const seed = getSeedWorkspaceData()
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    saveWorkspaceData(seed)
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceData>

    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : seed.tasks,
      projects: Array.isArray(parsed.projects) ? parsed.projects : seed.projects,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : seed.ideas,
      readingLists: Array.isArray(parsed.readingLists) ? parsed.readingLists : seed.readingLists,
      articles: Array.isArray(parsed.articles) ? parsed.articles : seed.articles,
      activities: Array.isArray(parsed.activities) ? parsed.activities : seed.activities,
    }
  } catch {
    saveWorkspaceData(seed)
    return seed
  }
}

export function saveWorkspaceData(data: WorkspaceData): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function emitWorkspaceChanged(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(WORKSPACE_EVENT))
}

export function updateWorkspaceData(updater: (current: WorkspaceData) => WorkspaceData): WorkspaceData {
  const current = loadWorkspaceData()
  const next = updater(current)
  saveWorkspaceData(next)
  emitWorkspaceChanged()
  return next
}

export function subscribeWorkspaceData(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener(WORKSPACE_EVENT, listener)
  return () => window.removeEventListener(WORKSPACE_EVENT, listener)
}
