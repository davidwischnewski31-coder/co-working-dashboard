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
  type ArticleStatus,
  type IdeaCategory,
  type IdeaStatus,
  type OwnerType,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
  type WorkspaceActivity,
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

interface WorkspaceContextValue {
  data: WorkspaceData
  isReady: boolean
  resetToDemoData: () => void
  createTask: (input: CreateTaskInput) => void
  updateTask: (taskId: string, input: UpdateTaskInput) => void
  moveTask: (taskId: string, nextStatus: TaskStatus) => void
  createProject: (input: CreateProjectInput) => void
  createIdea: (input: CreateIdeaInput) => void
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void
  createReadingList: (input: CreateReadingListInput) => void
  addArticle: (input: AddArticleInput) => void
  updateArticleStatus: (articleId: string, status: ArticleStatus) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

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
    activities: [activity, ...current.activities].slice(0, 200),
  }
}

const colorPalette = ['#EF6C00', '#00796B', '#546E7A', '#8E24AA', '#2E7D32', '#1565C0']

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => getSeedWorkspaceData())
  const [isReady, setIsReady] = useState(false)

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
              status: 'todo',
              priority: input.priority ?? 'medium',
              owner: ownerName(ownerType),
              owner_type: ownerType,
              due_date: input.due_date ?? null,
              tags: input.tags ?? [],
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
        if (!target || target.status === status) {
          return current
        }

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
          message: `Moved idea "${target.title}" to ${statusLabel(status)}.`,
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

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      data,
      isReady,
      resetToDemoData,
      createTask,
      updateTask,
      moveTask,
      createProject,
      createIdea,
      updateIdeaStatus,
      createReadingList,
      addArticle,
      updateArticleStatus,
    }),
    [
      addArticle,
      createIdea,
      createProject,
      createReadingList,
      createTask,
      data,
      isReady,
      moveTask,
      resetToDemoData,
      updateArticleStatus,
      updateIdeaStatus,
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
