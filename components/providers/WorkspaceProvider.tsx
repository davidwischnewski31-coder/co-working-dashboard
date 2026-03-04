'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createEntityId,
  getSeedWorkspaceData,
  loadWorkspaceData,
  subscribeWorkspaceData,
  updateWorkspaceData,
  type ActivityAction,
  type ActivityEntityType,
  type AgentRunType,
  type ArticleStatus,
  type IdeaCategory,
  type IdeaStatus,
  type InboxItemType,
  type OwnerType,
  type ProjectStatus,
  type SharedTodoAssignee,
  type SharedTodoRecurrence,
  type SharedTodoStatus,
  type ShoppingCategory,
  type TaskPriority,
  type TaskStatus,
  type WorkspaceActivity,
  type WorkspaceBoard,
  type WorkspaceCalendarEvent,
  type WorkspaceData,
} from '@/lib/workspace'

interface CreateTaskInput {
  title: string
  description?: string
  project_id?: string | null
  priority?: TaskPriority
  owner_type?: OwnerType
  due_date?: string | null
  tags?: string[]
  status?: TaskStatus
  blocked_by?: string | null
  dependency?: string | null
  next_unblock_step?: string | null
  check_again_at?: string | null
}

interface UpdateTaskInput {
  title?: string
  description?: string | null
  project_id?: string | null
  priority?: TaskPriority
  owner_type?: OwnerType
  due_date?: string | null
  tags?: string[]
  status?: TaskStatus
  blocked_by?: string | null
  dependency?: string | null
  next_unblock_step?: string | null
  check_again_at?: string | null
}

interface CreateProjectInput {
  name: string
  description?: string
  status?: ProjectStatus
  color?: string
}

interface CreateIdeaInput {
  title: string
  description?: string
  category?: IdeaCategory
  status?: IdeaStatus
  owner_type?: OwnerType
}

interface CreateReadingListInput {
  name: string
  description?: string
}

interface AddArticleInput {
  reading_list_id: string
  url: string
  title?: string
}

interface CreateInboxItemInput {
  title: string
  type: InboxItemType
  body?: string | null
  source?: string
  board?: WorkspaceBoard
}

interface RunAgentSweepInput {
  board?: WorkspaceBoard
  run_type?: AgentRunType
  scheduled_for?: string | null
}

interface CreateSharedTodoInput {
  title: string
  assignee?: SharedTodoAssignee
  due_date?: string | null
  notes?: string | null
  status?: SharedTodoStatus
  recurrence?: SharedTodoRecurrence
  recurrence_end?: string | null
}

interface UpdateSharedTodoInput {
  title?: string
  assignee?: SharedTodoAssignee
  due_date?: string | null
  notes?: string | null
  status?: SharedTodoStatus
  recurrence?: SharedTodoRecurrence
  recurrence_end?: string | null
}

interface CreateShoppingItemInput {
  title: string
  quantity?: string | null
  category?: ShoppingCategory
  created_by?: string
}

interface UpdateShoppingItemInput {
  title?: string
  quantity?: string | null
  category?: ShoppingCategory
  checked?: boolean
}

interface CreateCalendarEventInput {
  board?: WorkspaceBoard
  title: string
  description?: string | null
  start_at: string
  end_at: string
  all_day?: boolean
  created_by?: string
}

interface UpdateCalendarEventInput {
  title?: string
  description?: string | null
  start_at?: string
  end_at?: string
  all_day?: boolean
}

interface WorkspaceContextValue {
  data: WorkspaceData
  isReady: boolean
  isAgentRunning: boolean
  setAgentRunning: (running: boolean) => void
  resetToDemoData: () => void
  logNavigation: (path: string) => void
  createTask: (input: CreateTaskInput) => void
  updateTask: (taskId: string, input: UpdateTaskInput) => void
  moveTask: (taskId: string, nextStatus: TaskStatus) => void
  createProject: (input: CreateProjectInput) => void
  createIdea: (input: CreateIdeaInput) => void
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void
  createReadingList: (input: CreateReadingListInput) => void
  addArticle: (input: AddArticleInput) => void
  updateArticleStatus: (articleId: string, status: ArticleStatus) => void
  createInboxItem: (input: CreateInboxItemInput) => void
  markInboxItemProcessed: (itemId: string) => void
  runAgentSweep: (input?: RunAgentSweepInput) => void
  createSharedTodo: (input: CreateSharedTodoInput) => void
  updateSharedTodo: (todoId: string, input: UpdateSharedTodoInput) => void
  deleteSharedTodo: (todoId: string) => void
  createShoppingItem: (input: CreateShoppingItemInput) => void
  updateShoppingItem: (itemId: string, input: UpdateShoppingItemInput) => void
  deleteShoppingItem: (itemId: string) => void
  createCalendarEvent: (input: CreateCalendarEventInput) => void
  updateCalendarEvent: (eventId: string, input: UpdateCalendarEventInput) => void
  deleteCalendarEvent: (eventId: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const AGENT_SCHEDULE_HOURS = [7, 12, 15, 17, 20]
const AGENT_TIMEZONE = 'Europe/Vienna'

function statusLabel(status: string): string {
  return status.replace('_', ' ')
}

function ownerName(ownerType: OwnerType): string {
  return ownerType === 'human' ? 'David' : 'AI Partner'
}

function appendActivity(
  current: WorkspaceData,
  entry: {
    entity_type: ActivityEntityType
    entity_id: string
    action: ActivityAction
    actor: string
    actor_type: OwnerType
    message: string
  }
): WorkspaceData {
  const activity: WorkspaceActivity = {
    id: createEntityId('act'),
    timestamp: new Date().toISOString(),
    ...entry,
  }

  return {
    ...current,
    activities: [activity, ...current.activities].slice(0, 500),
  }
}

function getViennaParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: AGENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

function getScheduleSlotKey(date: Date): string | null {
  const parts = getViennaParts(date)
  if (parts.minute !== 0 || !AGENT_SCHEDULE_HOURS.includes(parts.hour)) {
    return null
  }

  const year = parts.year.toString().padStart(4, '0')
  const month = parts.month.toString().padStart(2, '0')
  const day = parts.day.toString().padStart(2, '0')
  const hour = parts.hour.toString().padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:00@${AGENT_TIMEZONE}`
}

function inboxTypeToPriority(type: InboxItemType): TaskPriority {
  if (type === 'overdue_flag') return 'urgent'
  if (type === 'decision_needed') return 'high'
  if (type === 'shared_update') return 'medium'
  return 'medium'
}

function addRecurrence(dateIso: string, recurrence: SharedTodoRecurrence): string {
  const date = new Date(dateIso)
  if (recurrence === 'daily') {
    date.setDate(date.getDate() + 1)
  } else if (recurrence === 'weekly') {
    date.setDate(date.getDate() + 7)
  } else if (recurrence === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  }

  return date.toISOString()
}

function shouldCreateRecurringCopy(
  recurrence: SharedTodoRecurrence,
  nextDue: string | null,
  recurrenceEnd: string | null
): boolean {
  if (recurrence === 'none') {
    return false
  }

  if (!nextDue) {
    return true
  }

  if (!recurrenceEnd) {
    return true
  }

  return new Date(nextDue).getTime() <= new Date(recurrenceEnd).getTime()
}

const colorPalette = ['#EF6C00', '#00796B', '#546E7A', '#8E24AA', '#2E7D32', '#1565C0']

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => getSeedWorkspaceData())
  const [isReady, setIsReady] = useState(false)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const setAgentRunning = useCallback((running: boolean) => {
    setIsAgentRunning(running)
  }, [])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setData(loadWorkspaceData())
      setIsReady(true)
    })

    const unsubscribe = subscribeWorkspaceData(() => {
      setData(loadWorkspaceData())
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      unsubscribe()
    }
  }, [])

  const applyUpdate = useCallback((updater: (current: WorkspaceData) => WorkspaceData) => {
    const next = updateWorkspaceData(updater)
    setData(next)
  }, [])

  const resetToDemoData = useCallback(() => {
    const seed = getSeedWorkspaceData()
    applyUpdate(() => seed)
  }, [applyUpdate])

  const logNavigation = useCallback(
    (path: string) => {
      const normalizedPath = path.trim()
      if (!normalizedPath || normalizedPath === '/') {
        return
      }

      applyUpdate((current) => {
        const message = `Visited ${normalizedPath}.`
        const latest = current.activities[0]
        const recentDuplicate =
          latest &&
          latest.message === message &&
          Date.now() - new Date(latest.timestamp).getTime() < 30_000

        if (recentDuplicate) {
          return current
        }

        return appendActivity(current, {
          entity_type: 'workspace',
          entity_id: normalizedPath,
          action: 'updated',
          actor: 'David',
          actor_type: 'human',
          message,
        })
      })
    },
    [applyUpdate]
  )

  const createTask = useCallback(
    (input: CreateTaskInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const ownerType = input.owner_type ?? 'human'
        const taskId = createEntityId('task')

        const next: WorkspaceData = {
          ...current,
          tasks: [
            {
              id: taskId,
              title: normalizedTitle,
              description: input.description?.trim() || null,
              project_id: input.project_id ?? null,
              status: input.status ?? 'todo',
              priority: input.priority ?? 'medium',
              owner: ownerName(ownerType),
              owner_type: ownerType,
              due_date: input.due_date ?? null,
              tags: input.tags ?? [],
              blocked_by: input.blocked_by ?? null,
              dependency: input.dependency ?? null,
              next_unblock_step: input.next_unblock_step ?? null,
              check_again_at: input.check_again_at ?? null,
              created_at: now,
              updated_at: now,
              completed_at: null,
            },
            ...current.tasks,
          ],
        }

        return appendActivity(next, {
          entity_type: 'task',
          entity_id: taskId,
          action: 'created',
          actor: ownerName(ownerType),
          actor_type: ownerType,
          message: `Created task "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateTask = useCallback(
    (taskId: string, input: UpdateTaskInput) => {
      applyUpdate((current) => {
        const target = current.tasks.find((task) => task.id === taskId)
        if (!target) {
          return current
        }

        const now = new Date().toISOString()
        const nextTasks = current.tasks.map((task) => {
          if (task.id !== taskId) {
            return task
          }

          const nextStatus = input.status ?? task.status
          const becameDone = task.status !== 'done' && nextStatus === 'done'

          return {
            ...task,
            title: input.title?.trim() || task.title,
            description: input.description ?? task.description,
            project_id: input.project_id ?? task.project_id,
            priority: input.priority ?? task.priority,
            owner_type: input.owner_type ?? task.owner_type,
            owner: ownerName(input.owner_type ?? task.owner_type),
            due_date: input.due_date ?? task.due_date,
            tags: input.tags ?? task.tags,
            blocked_by: input.blocked_by ?? task.blocked_by,
            dependency: input.dependency ?? task.dependency,
            next_unblock_step: input.next_unblock_step ?? task.next_unblock_step,
            check_again_at: input.check_again_at ?? task.check_again_at,
            status: nextStatus,
            completed_at: becameDone ? now : nextStatus !== 'done' ? null : task.completed_at,
            updated_at: now,
          }
        })

        const updated = nextTasks.find((task) => task.id === taskId)
        if (!updated) {
          return current
        }

        const next = {
          ...current,
          tasks: nextTasks,
        }

        return appendActivity(next, {
          entity_type: 'task',
          entity_id: taskId,
          action: 'updated',
          actor: updated.owner,
          actor_type: updated.owner_type,
          message: `Updated task "${updated.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const moveTask = useCallback(
    (taskId: string, nextStatus: TaskStatus) => {
      applyUpdate((current) => {
        const target = current.tasks.find((task) => task.id === taskId)
        if (!target || target.status === nextStatus) {
          return current
        }

        const now = new Date().toISOString()
        const nextTasks = current.tasks.map((task) => {
          if (task.id !== taskId) {
            return task
          }

          const isComplete = nextStatus === 'done'

          return {
            ...task,
            status: nextStatus,
            completed_at: isComplete ? now : null,
            updated_at: now,
          }
        })

        const next = {
          ...current,
          tasks: nextTasks,
        }

        return appendActivity(next, {
          entity_type: 'task',
          entity_id: taskId,
          action: nextStatus === 'done' ? 'completed' : 'moved',
          actor: target.owner,
          actor_type: target.owner_type,
          message:
            nextStatus === 'done'
              ? `Completed "${target.title}".`
              : `Moved "${target.title}" to ${statusLabel(nextStatus)}.`,
        })
      })
    },
    [applyUpdate]
  )

  const createProject = useCallback(
    (input: CreateProjectInput) => {
      const normalizedName = input.name.trim()
      if (!normalizedName) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const projectId = createEntityId('project')
        const color = input.color ?? colorPalette[current.projects.length % colorPalette.length]

        const next: WorkspaceData = {
          ...current,
          projects: [
            {
              id: projectId,
              name: normalizedName,
              description: input.description?.trim() || null,
              status: input.status ?? 'active',
              color,
              created_at: now,
              updated_at: now,
            },
            ...current.projects,
          ],
        }

        return appendActivity(next, {
          entity_type: 'project',
          entity_id: projectId,
          action: 'created',
          actor: 'David',
          actor_type: 'human',
          message: `Created project "${normalizedName}".`,
        })
      })
    },
    [applyUpdate]
  )

  const createIdea = useCallback(
    (input: CreateIdeaInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const ownerType = input.owner_type ?? 'human'
        const ideaId = createEntityId('idea')

        const next: WorkspaceData = {
          ...current,
          ideas: [
            {
              id: ideaId,
              title: normalizedTitle,
              description: input.description?.trim() || null,
              category: input.category ?? 'product',
              status: input.status ?? 'brainstorm',
              owner: ownerName(ownerType),
              owner_type: ownerType,
              created_at: now,
              updated_at: now,
            },
            ...current.ideas,
          ],
        }

        return appendActivity(next, {
          entity_type: 'idea',
          entity_id: ideaId,
          action: 'created',
          actor: ownerName(ownerType),
          actor_type: ownerType,
          message: `Captured idea "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateIdeaStatus = useCallback(
    (ideaId: string, status: IdeaStatus) => {
      applyUpdate((current) => {
        const target = current.ideas.find((idea) => idea.id === ideaId)
        if (!target) {
          return current
        }

        const statusUnchanged = target.status === status
        const now = new Date().toISOString()
        const nextIdeas = current.ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, status, updated_at: now } : idea
        )

        const next = {
          ...current,
          ideas: nextIdeas,
        }

        return appendActivity(next, {
          entity_type: 'idea',
          entity_id: ideaId,
          action: 'updated',
          actor: target.owner,
          actor_type: target.owner_type,
          message: statusUnchanged
            ? `Refreshed idea "${target.title}".`
            : `Moved idea "${target.title}" to ${statusLabel(status)}.`,
        })
      })
    },
    [applyUpdate]
  )

  const createReadingList = useCallback(
    (input: CreateReadingListInput) => {
      const normalizedName = input.name.trim()
      if (!normalizedName) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const listId = createEntityId('list')

        const next = {
          ...current,
          readingLists: [
            {
              id: listId,
              name: normalizedName,
              description: input.description?.trim() || null,
              created_at: now,
            },
            ...current.readingLists,
          ],
        }

        return appendActivity(next, {
          entity_type: 'article',
          entity_id: listId,
          action: 'created',
          actor: 'David',
          actor_type: 'human',
          message: `Created reading list "${normalizedName}".`,
        })
      })
    },
    [applyUpdate]
  )

  const addArticle = useCallback(
    (input: AddArticleInput) => {
      const normalizedUrl = input.url.trim()
      if (!normalizedUrl) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const articleId = createEntityId('article')

        const hostname = (() => {
          try {
            return new URL(normalizedUrl).hostname.replace('www.', '')
          } catch {
            return normalizedUrl
          }
        })()

        const title = input.title?.trim() || hostname

        const next = {
          ...current,
          articles: [
            {
              id: articleId,
              reading_list_id: input.reading_list_id,
              url: normalizedUrl,
              title,
              status: 'unread' as ArticleStatus,
              added_at: now,
              updated_at: now,
            },
            ...current.articles,
          ],
        }

        return appendActivity(next, {
          entity_type: 'article',
          entity_id: articleId,
          action: 'created',
          actor: 'David',
          actor_type: 'human',
          message: `Added article "${title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateArticleStatus = useCallback(
    (articleId: string, status: ArticleStatus) => {
      applyUpdate((current) => {
        const target = current.articles.find((article) => article.id === articleId)
        if (!target || target.status === status) {
          return current
        }

        const now = new Date().toISOString()
        const nextArticles = current.articles.map((article) =>
          article.id === articleId ? { ...article, status, updated_at: now } : article
        )

        const next = {
          ...current,
          articles: nextArticles,
        }

        return appendActivity(next, {
          entity_type: 'article',
          entity_id: articleId,
          action: 'updated',
          actor: 'David',
          actor_type: 'human',
          message: `Marked article "${target.title}" as ${statusLabel(status)}.`,
        })
      })
    },
    [applyUpdate]
  )

  const createInboxItem = useCallback(
    (input: CreateInboxItemInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const inboxId = createEntityId('inbox')

        const next = {
          ...current,
          inbox: [
            {
              id: inboxId,
              board: input.board ?? 'a',
              title: normalizedTitle,
              type: input.type,
              body: input.body?.trim() || null,
              source: input.source?.trim() || 'David',
              status: 'new' as const,
              created_at: now,
              processed_at: null,
            },
            ...current.inbox,
          ],
        }

        return appendActivity(next, {
          entity_type: 'inbox',
          entity_id: inboxId,
          action: 'created',
          actor: 'David',
          actor_type: 'human',
          message: `Captured inbox item "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const markInboxItemProcessed = useCallback(
    (itemId: string) => {
      applyUpdate((current) => {
        const target = current.inbox.find((item) => item.id === itemId)
        if (!target || target.status === 'processed') {
          return current
        }

        const now = new Date().toISOString()
        const nextInbox = current.inbox.map((item) =>
          item.id === itemId ? { ...item, status: 'processed' as const, processed_at: now } : item
        )

        const next = {
          ...current,
          inbox: nextInbox,
        }

        return appendActivity(next, {
          entity_type: 'inbox',
          entity_id: itemId,
          action: 'updated',
          actor: 'AI Partner',
          actor_type: 'agent',
          message: `Marked inbox item "${target.title}" as processed.`,
        })
      })
    },
    [applyUpdate]
  )

  const runAgentSweep = useCallback(
    (input: RunAgentSweepInput = {}) => {
      const board = input.board ?? 'a'
      const runType = input.run_type ?? 'manual'
      const scheduledFor = input.scheduled_for ?? null

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const pendingInbox = current.inbox.filter((item) => item.board === board && item.status === 'new')

        let next: WorkspaceData = current
        const actions: string[] = []

        if (pendingInbox.length > 0) {
          const createdTasks = pendingInbox.map((item) => {
            const taskPriority = inboxTypeToPriority(item.type)
            const title = item.type === 'decision_needed' ? `Decision: ${item.title}` : item.title

            const descriptionParts = [
              item.body,
              item.source ? `Source: ${item.source}` : null,
              item.type === 'decision_needed'
                ? 'Agent output required: provide 3 options and one clear recommendation.'
                : `Captured from inbox (${item.type}).`,
            ].filter(Boolean)

            actions.push(`Moved "${item.title}" to backlog (${taskPriority}).`)

            return {
              id: createEntityId('task'),
              title,
              description: descriptionParts.join('\n\n') || null,
              project_id: null,
              status: 'backlog' as TaskStatus,
              priority: taskPriority,
              owner: 'AI Partner',
              owner_type: 'agent' as OwnerType,
              due_date: null,
              tags: ['inbox', item.type],
              blocked_by: null,
              dependency: null,
              next_unblock_step: null,
              check_again_at: null,
              created_at: now,
              updated_at: now,
              completed_at: null,
            }
          })

          const pendingSet = new Set(pendingInbox.map((item) => item.id))

          next = {
            ...next,
            tasks: [...createdTasks, ...next.tasks],
            inbox: next.inbox.map((item) =>
              pendingSet.has(item.id)
                ? {
                    ...item,
                    status: 'processed' as const,
                    processed_at: now,
                  }
                : item
            ),
          }
        } else {
          actions.push('No new inbox items to process.')
        }

        const runId = createEntityId('agent_run')
        const summary =
          pendingInbox.length > 0
            ? `Processed ${pendingInbox.length} inbox item${pendingInbox.length === 1 ? '' : 's'} into backlog.`
            : 'No inbox items were ready.'

        next = {
          ...next,
          agentRuns: [
            {
              id: runId,
              board,
              run_type: runType,
              scheduled_for: scheduledFor,
              timestamp: now,
              summary,
              actions,
            },
            ...next.agentRuns,
          ],
        }

        return appendActivity(next, {
          entity_type: 'agent_run',
          entity_id: runId,
          action: 'created',
          actor: 'AI Partner',
          actor_type: 'agent',
          message: `Agent sweep (${board.toUpperCase()}) completed. ${summary}`,
        })
      })
    },
    [applyUpdate]
  )

  const createSharedTodo = useCallback(
    (input: CreateSharedTodoInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const todoId = createEntityId('shared_todo')

        const next = {
          ...current,
          sharedTodos: [
            {
              id: todoId,
              title: normalizedTitle,
              assignee: input.assignee ?? 'both',
              status: input.status ?? 'todo',
              due_date: input.due_date ?? null,
              notes: input.notes?.trim() || null,
              recurrence: input.recurrence ?? 'none',
              recurrence_end: input.recurrence_end ?? null,
              created_at: now,
              updated_at: now,
            },
            ...current.sharedTodos,
          ],
        }

        return appendActivity(next, {
          entity_type: 'shared_todo',
          entity_id: todoId,
          action: 'created',
          actor: 'David',
          actor_type: 'human',
          message: `Created shared todo "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateSharedTodo = useCallback(
    (todoId: string, input: UpdateSharedTodoInput) => {
      applyUpdate((current) => {
        const target = current.sharedTodos.find((todo) => todo.id === todoId)
        if (!target) {
          return current
        }

        const now = new Date().toISOString()
        const nextStatus = input.status ?? target.status
        const nextRecurrence = input.recurrence ?? target.recurrence
        const nextRecurrenceEnd = input.recurrence_end ?? target.recurrence_end
        const becameDone = target.status !== 'done' && nextStatus === 'done'

        const nextTodos = current.sharedTodos.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                title: input.title?.trim() || todo.title,
                assignee: input.assignee ?? todo.assignee,
                status: nextStatus,
                due_date: input.due_date ?? todo.due_date,
                notes: input.notes ?? todo.notes,
                recurrence: nextRecurrence,
                recurrence_end: nextRecurrenceEnd,
                updated_at: now,
              }
            : todo
        )

        let extendedTodos = nextTodos

        if (becameDone && nextRecurrence !== 'none') {
          const baseDue = input.due_date ?? target.due_date ?? now
          const nextDue = addRecurrence(baseDue, nextRecurrence)

          if (shouldCreateRecurringCopy(nextRecurrence, nextDue, nextRecurrenceEnd)) {
            const recurringId = createEntityId('shared_todo')
            const recurringTodo = {
              id: recurringId,
              title: input.title?.trim() || target.title,
              assignee: input.assignee ?? target.assignee,
              status: 'todo' as const,
              due_date: nextDue,
              notes: input.notes ?? target.notes,
              recurrence: nextRecurrence,
              recurrence_end: nextRecurrenceEnd,
              created_at: now,
              updated_at: now,
            }

            extendedTodos = [recurringTodo, ...extendedTodos]
          }
        }

        const next = {
          ...current,
          sharedTodos: extendedTodos,
        }

        return appendActivity(next, {
          entity_type: 'shared_todo',
          entity_id: todoId,
          action: 'updated',
          actor: 'David',
          actor_type: 'human',
          message: `Updated shared todo "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const deleteSharedTodo = useCallback(
    (todoId: string) => {
      applyUpdate((current) => {
        const target = current.sharedTodos.find((todo) => todo.id === todoId)
        if (!target) {
          return current
        }

        const next = {
          ...current,
          sharedTodos: current.sharedTodos.filter((todo) => todo.id !== todoId),
        }

        return appendActivity(next, {
          entity_type: 'shared_todo',
          entity_id: todoId,
          action: 'deleted',
          actor: 'David',
          actor_type: 'human',
          message: `Deleted shared todo "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const createShoppingItem = useCallback(
    (input: CreateShoppingItemInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const itemId = createEntityId('shopping')

        const next = {
          ...current,
          shoppingItems: [
            {
              id: itemId,
              title: normalizedTitle,
              quantity: input.quantity?.trim() || null,
              category: input.category ?? 'groceries',
              checked: false,
              created_by: input.created_by ?? 'David',
              created_at: now,
              updated_at: now,
            },
            ...current.shoppingItems,
          ],
        }

        return appendActivity(next, {
          entity_type: 'shopping',
          entity_id: itemId,
          action: 'created',
          actor: input.created_by ?? 'David',
          actor_type: 'human',
          message: `Added shopping item "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateShoppingItem = useCallback(
    (itemId: string, input: UpdateShoppingItemInput) => {
      applyUpdate((current) => {
        const target = current.shoppingItems.find((item) => item.id === itemId)
        if (!target) {
          return current
        }

        const now = new Date().toISOString()

        const next = {
          ...current,
          shoppingItems: current.shoppingItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  title: input.title?.trim() || item.title,
                  quantity: input.quantity ?? item.quantity,
                  category: input.category ?? item.category,
                  checked: input.checked ?? item.checked,
                  updated_at: now,
                }
              : item
          ),
        }

        return appendActivity(next, {
          entity_type: 'shopping',
          entity_id: itemId,
          action: 'updated',
          actor: 'David',
          actor_type: 'human',
          message: `Updated shopping item "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const deleteShoppingItem = useCallback(
    (itemId: string) => {
      applyUpdate((current) => {
        const target = current.shoppingItems.find((item) => item.id === itemId)
        if (!target) {
          return current
        }

        const next = {
          ...current,
          shoppingItems: current.shoppingItems.filter((item) => item.id !== itemId),
        }

        return appendActivity(next, {
          entity_type: 'shopping',
          entity_id: itemId,
          action: 'deleted',
          actor: 'David',
          actor_type: 'human',
          message: `Deleted shopping item "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const createCalendarEvent = useCallback(
    (input: CreateCalendarEventInput) => {
      const normalizedTitle = input.title.trim()
      if (!normalizedTitle) {
        return
      }

      applyUpdate((current) => {
        const now = new Date().toISOString()
        const eventId = createEntityId('calendar')

        const nextEvent: WorkspaceCalendarEvent = {
          id: eventId,
          board: input.board ?? 'b',
          title: normalizedTitle,
          description: input.description?.trim() || null,
          start_at: input.start_at,
          end_at: input.end_at,
          all_day: Boolean(input.all_day),
          created_by: input.created_by ?? 'David',
          created_at: now,
          updated_at: now,
        }

        const next = {
          ...current,
          calendarEvents: [nextEvent, ...current.calendarEvents],
        }

        return appendActivity(next, {
          entity_type: 'calendar',
          entity_id: eventId,
          action: 'created',
          actor: input.created_by ?? 'David',
          actor_type: 'human',
          message: `Created calendar event "${normalizedTitle}".`,
        })
      })
    },
    [applyUpdate]
  )

  const updateCalendarEvent = useCallback(
    (eventId: string, input: UpdateCalendarEventInput) => {
      applyUpdate((current) => {
        const target = current.calendarEvents.find((event) => event.id === eventId)
        if (!target) {
          return current
        }

        const now = new Date().toISOString()
        const nextEvents = current.calendarEvents.map((event) =>
          event.id === eventId
            ? {
                ...event,
                title: input.title?.trim() || event.title,
                description: input.description ?? event.description,
                start_at: input.start_at ?? event.start_at,
                end_at: input.end_at ?? event.end_at,
                all_day: input.all_day ?? event.all_day,
                updated_at: now,
              }
            : event
        )

        const next = {
          ...current,
          calendarEvents: nextEvents,
        }

        return appendActivity(next, {
          entity_type: 'calendar',
          entity_id: eventId,
          action: 'updated',
          actor: 'David',
          actor_type: 'human',
          message: `Updated calendar event "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  const deleteCalendarEvent = useCallback(
    (eventId: string) => {
      applyUpdate((current) => {
        const target = current.calendarEvents.find((event) => event.id === eventId)
        if (!target) {
          return current
        }

        const next = {
          ...current,
          calendarEvents: current.calendarEvents.filter((event) => event.id !== eventId),
        }

        return appendActivity(next, {
          entity_type: 'calendar',
          entity_id: eventId,
          action: 'deleted',
          actor: 'David',
          actor_type: 'human',
          message: `Deleted calendar event "${target.title}".`,
        })
      })
    },
    [applyUpdate]
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      const slotKey = getScheduleSlotKey(new Date())
      if (!slotKey) {
        return
      }

      const alreadyRan = data.agentRuns.some(
        (run) => run.board === 'a' && run.run_type === 'scheduled' && run.scheduled_for === slotKey
      )

      if (alreadyRan) {
        return
      }

      runAgentSweep({
        board: 'a',
        run_type: 'scheduled',
        scheduled_for: slotKey,
      })
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [data.agentRuns, runAgentSweep])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      data,
      isReady,
      isAgentRunning,
      setAgentRunning,
      resetToDemoData,
      logNavigation,
      createTask,
      updateTask,
      moveTask,
      createProject,
      createIdea,
      updateIdeaStatus,
      createReadingList,
      addArticle,
      updateArticleStatus,
      createInboxItem,
      markInboxItemProcessed,
      runAgentSweep,
      createSharedTodo,
      updateSharedTodo,
      deleteSharedTodo,
      createShoppingItem,
      updateShoppingItem,
      deleteShoppingItem,
      createCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
    }),
    [
      addArticle,
      createCalendarEvent,
      createIdea,
      createInboxItem,
      createProject,
      createReadingList,
      createSharedTodo,
      createShoppingItem,
      createTask,
      data,
      deleteCalendarEvent,
      deleteSharedTodo,
      deleteShoppingItem,
      isReady,
      isAgentRunning,
      logNavigation,
      markInboxItemProcessed,
      moveTask,
      resetToDemoData,
      runAgentSweep,
      setAgentRunning,
      updateArticleStatus,
      updateCalendarEvent,
      updateIdeaStatus,
      updateSharedTodo,
      updateShoppingItem,
      updateTask,
    ]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }

  return context
}
