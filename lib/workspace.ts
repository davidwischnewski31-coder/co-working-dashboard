export type OwnerType = 'human' | 'agent'
export type WorkspaceBoard = 'a' | 'b'

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
  blocked_by: string | null
  dependency: string | null
  next_unblock_step: string | null
  check_again_at: string | null
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

export type IdeaStatus = 'brainstorm' | 'research' | 'in_progress' | 'shipped' | 'archived'
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

export type InboxItemType = 'task' | 'link' | 'note' | 'email' | 'decision'
export type InboxItemStatus = 'new' | 'processed'
export type InboxUrgency = 'auto' | 'now' | 'today' | 'week' | 'later'

export interface WorkspaceInboxItem {
  id: string
  board: WorkspaceBoard
  title: string
  type: InboxItemType
  urgency: InboxUrgency
  source_url: string | null
  notes: string | null
  status: InboxItemStatus
  created_by: string
  created_at: string
  processed_at: string | null
}

export type SharedTodoStatus = 'todo' | 'in_progress' | 'done'
export type SharedTodoAssignee = 'david' | 'girlfriend' | 'agent' | 'both'
export type SharedTodoRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface WorkspaceSharedTodo {
  id: string
  title: string
  assignee: SharedTodoAssignee
  status: SharedTodoStatus
  due_date: string | null
  notes: string | null
  recurrence: SharedTodoRecurrence
  recurrence_end: string | null
  created_at: string
  updated_at: string
}

export type ShoppingCategory = 'groceries' | 'household' | 'pharmacy' | 'other'

export interface WorkspaceShoppingItem {
  id: string
  title: string
  quantity: string | null
  category: ShoppingCategory
  checked: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkspaceCalendarEvent {
  id: string
  board: WorkspaceBoard
  title: string
  description: string | null
  start_at: string
  end_at: string
  all_day: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type AgentRunType = 'manual' | 'scheduled'

export interface WorkspaceAgentRun {
  id: string
  board: WorkspaceBoard
  run_type: AgentRunType
  scheduled_for: string | null
  timestamp: string
  summary: string
  actions: string[]
}

export type ActivityEntityType =
  | 'task'
  | 'project'
  | 'idea'
  | 'article'
  | 'workspace'
  | 'inbox'
  | 'calendar'
  | 'shared_todo'
  | 'shopping'
  | 'agent_run'

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
  inbox: WorkspaceInboxItem[]
  sharedTodos: WorkspaceSharedTodo[]
  shoppingItems: WorkspaceShoppingItem[]
  calendarEvents: WorkspaceCalendarEvent[]
  agentRuns: WorkspaceAgentRun[]
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

function isoAt(days: number, hour: number, minute = 0): string {
  const next = new Date(SEED_BASE_DATE)
  next.setUTCDate(next.getUTCDate() + days)
  next.setUTCHours(hour, minute, 0, 0)
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
      blocked_by: null,
      dependency: null,
      next_unblock_step: null,
      check_again_at: null,
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
      blocked_by: null,
      dependency: null,
      next_unblock_step: null,
      check_again_at: null,
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
      blocked_by: null,
      dependency: null,
      next_unblock_step: null,
      check_again_at: null,
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
      blocked_by: null,
      dependency: null,
      next_unblock_step: null,
      check_again_at: null,
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
      blocked_by: 'VA CSV handoff',
      dependency: 'Fresh CRM export file',
      next_unblock_step: 'Ping VA and request file by 14:00 CET',
      check_again_at: isoAt(0, 14, 0),
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
      blocked_by: null,
      dependency: null,
      next_unblock_step: null,
      check_again_at: null,
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

  const inbox: WorkspaceInboxItem[] = [
    {
      id: 'inbox_seed_1',
      board: 'a',
      title: 'Review attached pricing teardown links from today',
      type: 'link',
      urgency: 'today',
      source_url: 'https://www.cxl.com/blog/',
      notes: 'Pull the 3 strongest ideas and convert to backlog tasks.',
      status: 'new',
      created_by: 'David',
      created_at: isoDaysFromNow(0),
      processed_at: null,
    },
    {
      id: 'inbox_seed_2',
      board: 'a',
      title: 'Choose one launch narrative for dashboard relaunch',
      type: 'decision',
      urgency: 'week',
      source_url: null,
      notes: 'Need 3 options + recommendation.',
      status: 'new',
      created_by: 'David',
      created_at: isoDaysFromNow(-1),
      processed_at: null,
    },
  ]

  const sharedTodos: WorkspaceSharedTodo[] = [
    {
      id: 'shared_todo_seed_1',
      title: 'Book spring trip accommodation',
      assignee: 'both',
      status: 'todo',
      due_date: isoDaysFromNow(10),
      notes: 'Decide city first, then lock dates.',
      recurrence: 'none',
      recurrence_end: null,
      created_at: isoDaysFromNow(-2),
      updated_at: now,
    },
    {
      id: 'shared_todo_seed_2',
      title: 'Take out recycling',
      assignee: 'both',
      status: 'in_progress',
      due_date: isoDaysFromNow(1),
      notes: null,
      recurrence: 'weekly',
      recurrence_end: null,
      created_at: isoDaysFromNow(-1),
      updated_at: now,
    },
  ]

  const shoppingItems: WorkspaceShoppingItem[] = [
    {
      id: 'shopping_seed_1',
      title: 'Tomatoes',
      quantity: '6',
      category: 'groceries',
      checked: false,
      created_by: 'David',
      created_at: isoDaysFromNow(-1),
      updated_at: now,
    },
    {
      id: 'shopping_seed_2',
      title: 'Dish soap',
      quantity: '1 bottle',
      category: 'household',
      checked: true,
      created_by: 'Girlfriend',
      created_at: isoDaysFromNow(-2),
      updated_at: now,
    },
  ]

  const calendarEvents: WorkspaceCalendarEvent[] = [
    {
      id: 'event_seed_a_1',
      board: 'a',
      title: 'Product standup',
      description: 'Review blockers and assign next actions.',
      start_at: isoAt(0, 8, 30),
      end_at: isoAt(0, 9, 0),
      all_day: false,
      created_by: 'David',
      created_at: isoDaysFromNow(-1),
      updated_at: now,
    },
    {
      id: 'event_seed_a_2',
      board: 'a',
      title: 'Client strategy call',
      description: null,
      start_at: isoAt(0, 14, 0),
      end_at: isoAt(0, 15, 0),
      all_day: false,
      created_by: 'David',
      created_at: isoDaysFromNow(-1),
      updated_at: now,
    },
    {
      id: 'event_seed_1',
      board: 'b',
      title: 'Dinner with friends',
      description: 'Italian place near the center.',
      start_at: isoAt(2, 18, 30),
      end_at: isoAt(2, 21, 0),
      all_day: false,
      created_by: 'David',
      created_at: isoDaysFromNow(-1),
      updated_at: now,
    },
    {
      id: 'event_seed_2',
      board: 'b',
      title: 'Shared planning session',
      description: null,
      start_at: isoAt(0, 19, 0),
      end_at: isoAt(0, 20, 0),
      all_day: false,
      created_by: 'Girlfriend',
      created_at: isoDaysFromNow(-2),
      updated_at: now,
    },
  ]

  const agentRuns: WorkspaceAgentRun[] = [
    {
      id: 'agent_run_seed_1',
      board: 'a',
      run_type: 'scheduled',
      scheduled_for: '2026-02-23T07:00@Europe/Vienna',
      timestamp: isoDaysFromNow(-1),
      summary: 'Processed 1 inbox item and moved it to backlog.',
      actions: ['Moved "Prepare morning sync note for dashboard roadmap" to backlog.'],
    },
    {
      id: 'agent_run_seed_2',
      board: 'a',
      run_type: 'scheduled',
      scheduled_for: '2026-02-23T20:00@Europe/Vienna',
      timestamp: isoAt(-1, 20, 0),
      summary: 'Evening brief generated with next-day recommendations.',
      actions: ['Suggested top 3 priorities for tomorrow and flagged 1 blocker.'],
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
      entity_type: 'shared_todo',
      entity_id: 'shared_todo_seed_2',
      action: 'updated',
      actor: 'Girlfriend',
      actor_type: 'human',
      message: 'Updated shared todo "Take out recycling".',
      timestamp: isoDaysFromNow(-1),
    },
  ]

  return {
    tasks,
    projects,
    ideas,
    readingLists,
    articles,
    inbox,
    sharedTodos,
    shoppingItems,
    calendarEvents,
    agentRuns,
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
      inbox: Array.isArray(parsed.inbox) ? parsed.inbox : seed.inbox,
      sharedTodos: Array.isArray(parsed.sharedTodos) ? parsed.sharedTodos : seed.sharedTodos,
      shoppingItems: Array.isArray(parsed.shoppingItems) ? parsed.shoppingItems : seed.shoppingItems,
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : seed.calendarEvents,
      agentRuns: Array.isArray(parsed.agentRuns) ? parsed.agentRuns : seed.agentRuns,
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
