import type {
  IdeaStatus,
  TaskPriority,
  TaskStatus,
  WorkspaceData,
  WorkspaceProject,
  WorkspaceTask,
} from '@/lib/workspace'

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const STATUS_SCORE: Record<TaskStatus, number> = {
  in_progress: 5,
  blocked: 4,
  todo: 3,
  backlog: 2,
  done: 1,
}

export function sortTasksByUrgency(tasks: WorkspaceTask[]): WorkspaceTask[] {
  return [...tasks].sort((left, right) => {
    const priorityDelta = PRIORITY_SCORE[right.priority] - PRIORITY_SCORE[left.priority]
    if (priorityDelta !== 0) {
      return priorityDelta
    }

    const statusDelta = STATUS_SCORE[right.status] - STATUS_SCORE[left.status]
    if (statusDelta !== 0) {
      return statusDelta
    }

    const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER
    const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER
    return leftDue - rightDue
  })
}

export function getMostUrgentTask(data: WorkspaceData): WorkspaceTask | null {
  const active = data.tasks.filter((task) => task.status !== 'done')
  return sortTasksByUrgency(active)[0] ?? null
}

export function getProjectTaskStats(data: WorkspaceData): Map<string, { total: number; done: number; blocked: number; active: number }> {
  const stats = new Map<string, { total: number; done: number; blocked: number; active: number }>()

  for (const project of data.projects) {
    stats.set(project.id, { total: 0, done: 0, blocked: 0, active: 0 })
  }

  for (const task of data.tasks) {
    if (!task.project_id) {
      continue
    }

    const current = stats.get(task.project_id)
    if (!current) {
      continue
    }

    current.total += 1
    if (task.status === 'done') {
      current.done += 1
    } else {
      current.active += 1
    }

    if (task.status === 'blocked') {
      current.blocked += 1
    }
  }

  return stats
}

export function getProjectById(data: WorkspaceData, projectId: string | null): WorkspaceProject | null {
  if (!projectId) {
    return null
  }

  return data.projects.find((project) => project.id === projectId) ?? null
}

export function getIdeaNextStatus(status: IdeaStatus): IdeaStatus {
  if (status === 'brainstorm') return 'research'
  if (status === 'research') return 'in_progress'
  return 'shipped'
}

function daysAgo(input: string): number {
  const now = Date.now()
  const then = new Date(input).getTime()
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)))
}

export function isTaskOverdue(task: WorkspaceTask): boolean {
  if (!task.due_date || task.status === 'done') {
    return false
  }

  return new Date(task.due_date).getTime() < Date.now()
}

export function isStale(updatedAt: string, thresholdDays = 7): boolean {
  return daysAgo(updatedAt) >= thresholdDays
}

export function isRecent(updatedAt: string, thresholdDays = 2): boolean {
  return daysAgo(updatedAt) <= thresholdDays
}

export function summarizeMorningBrief(data: WorkspaceData): {
  stats: Array<{ label: string; value: number }>
  sentence: string
} {
  const active = data.tasks.filter((task) => task.status !== 'done')
  const urgent = active.filter((task) => task.priority === 'urgent').length
  const blocked = active.filter((task) => task.status === 'blocked').length
  const unread = data.articles.filter((article) => article.status === 'unread').length
  const topTask = getMostUrgentTask(data)

  const sentence = topTask
    ? `You have ${urgent} urgent tasks, ${blocked} blockers, and ${unread} unread articles. Your highest-leverage move is \"${topTask.title}\".`
    : `You have ${blocked} blockers and ${unread} unread articles. Capture your next move to keep momentum.`

  return {
    stats: [
      { label: 'urgent', value: urgent },
      { label: 'blocked', value: blocked },
      { label: 'unread', value: unread },
    ],
    sentence,
  }
}

function bucketActivitiesByDay(data: WorkspaceData, days: number, projectId?: string): number[] {
  const buckets = Array.from({ length: days }, () => 0)
  const now = Date.now()

  for (const activity of data.activities) {
    if (projectId) {
      const task = data.tasks.find((item) => item.id === activity.entity_id)
      if (!task || task.project_id !== projectId) {
        continue
      }
    }

    const delta = Math.floor((now - new Date(activity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    if (delta >= 0 && delta < days) {
      buckets[days - delta - 1] += 1
    }
  }

  return buckets
}

export function getProjectSparkline(data: WorkspaceData, projectId: string): number[] {
  return bucketActivitiesByDay(data, 7, projectId)
}

export function getGlobalSparkline(data: WorkspaceData): number[] {
  return bucketActivitiesByDay(data, 7)
}

function countActivityWindow(data: WorkspaceData, fromDays: number, toDays: number): number {
  return data.activities.filter((entry) => {
    const delta = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    return delta >= fromDays && delta < toDays
  }).length
}

export function calculateMomentumScore(data: WorkspaceData): { score: number; delta: number } {
  const completed = data.tasks.filter((task) => task.status === 'done').length
  const totalTasks = Math.max(1, data.tasks.length)
  const shippedIdeas = data.ideas.filter((idea) => idea.status === 'shipped').length
  const readArticles = data.articles.filter((article) => article.status === 'read').length
  const blocked = data.tasks.filter((task) => task.status === 'blocked').length

  const base = Math.round(
    ((completed / totalTasks) * 45 +
      (shippedIdeas / Math.max(1, data.ideas.length)) * 25 +
      (readArticles / Math.max(1, data.articles.length)) * 20 +
      Math.max(0, 10 - blocked * 3))
  )

  const score = Math.max(0, Math.min(100, base))

  const thisWeek = countActivityWindow(data, 0, 7)
  const lastWeek = countActivityWindow(data, 7, 14)
  const delta = thisWeek - lastWeek

  return { score, delta }
}
