'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, Plus, Target } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { OwnerType, TaskPriority, TaskStatus, WorkspaceTask } from '@/lib/workspace'

const ClientKanbanBoard = dynamic(
  () => import('@/components/kanban/KanbanBoard').then((module) => module.KanbanBoard),
  {
    ssr: false,
    loading: () => <KanbanBoardSkeleton />,
  }
)

type TaskBoardItem = WorkspaceTask & {
  project_name?: string
  project_color?: string
}

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const priorityClasses: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-[#F5F4F2] text-[#7A6F65]',
}

function KanbanBoardSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {[3, 2, 3].map((cardCount, columnIndex) => (
        <div key={`skeleton-col-${columnIndex}`} className="rounded-xl border border-[#E8E2D8] bg-[#FFFDF8] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-[#F5F4F2]" />
            <div className="h-5 w-8 rounded-full bg-[#F5F4F2]" />
          </div>
          <div className="space-y-2 rounded-lg bg-[#FAFAF9] p-2">
            {Array.from({ length: cardCount }).map((_, cardIndex) => (
              <div key={`skeleton-card-${columnIndex}-${cardIndex}`} className="rounded-lg border border-[#ECE7DF] bg-white p-3">
                <div className="h-3 w-16 rounded bg-[#F5F4F2] animate-pulse" />
                <div className="mt-3 h-3 w-4/5 rounded bg-[#F5F4F2] animate-pulse" />
                <div className="mt-2 h-3 w-2/3 rounded bg-[#F5F4F2] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanbanPageContent() {
  const { data, isReady, createTask, moveTask } = useWorkspace()
  const searchParams = useSearchParams()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [ownerType, setOwnerType] = useState<OwnerType>('human')
  const [projectId, setProjectId] = useState<string>('all')
  const [dueDate, setDueDate] = useState('')
  const [formExpanded, setFormExpanded] = useState(false)

  const [ownerFilter, setOwnerFilter] = useState<'all' | OwnerType>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')

  const projectParam = searchParams.get('project')
  const statusParam = searchParams.get('status')

  useEffect(() => {
    setProjectFilter(projectParam ?? 'all')
  }, [projectParam])

  useEffect(() => {
    if (
      statusParam === 'backlog' ||
      statusParam === 'todo' ||
      statusParam === 'in_progress' ||
      statusParam === 'blocked' ||
      statusParam === 'done'
    ) {
      setStatusFilter(statusParam)
      return
    }

    setStatusFilter('all')
  }, [statusParam])

  const tasks = useMemo<TaskBoardItem[]>(() => {
    return data.tasks.map((task) => {
      const project = data.projects.find((item) => item.id === task.project_id)
      return {
        ...task,
        project_name: project?.name,
        project_color: project?.color,
      }
    })
  }, [data.projects, data.tasks])

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => (ownerFilter === 'all' ? true : task.owner_type === ownerFilter))
      .filter((task) => (projectFilter === 'all' ? true : task.project_id === projectFilter))
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .sort((left, right) => {
        const statusScore = left.status === 'done' ? 1 : 0
        const rightStatusScore = right.status === 'done' ? 1 : 0
        if (statusScore !== rightStatusScore) {
          return statusScore - rightStatusScore
        }
        return priorityOrder[right.priority] - priorityOrder[left.priority]
      })
  }, [ownerFilter, projectFilter, statusFilter, tasks])

  const focusTasks = useMemo(
    () => filteredTasks.filter((task) => task.status !== 'done').slice(0, 4),
    [filteredTasks]
  )

  const activeTaskCount = filteredTasks.filter((task) => task.status !== 'done').length
  const doneTaskCount = filteredTasks.filter((task) => task.status === 'done').length

  const primaryTask = useMemo(
    () => filteredTasks.find((task) => task.status !== 'done') ?? null,
    [filteredTasks]
  )

  const overdueDays = useMemo(() => {
    if (!primaryTask?.due_date) {
      return 0
    }

    const diff = Date.now() - new Date(primaryTask.due_date).getTime()
    if (diff <= 0) {
      return 0
    }

    return Math.ceil(diff / 86_400_000)
  }, [primaryTask?.due_date])

  function handleStart(taskId: string) {
    moveTask(taskId, 'in_progress')
  }

  function handleMarkDone(taskId: string) {
    moveTask(taskId, 'done')
  }

  function handleMarkBlocked(taskId: string) {
    moveTask(taskId, 'blocked')
  }

  function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      return
    }

    createTask({
      title: normalizedTitle,
      description,
      project_id: projectId === 'all' ? null : projectId,
      priority,
      owner_type: ownerType,
      due_date: dueDate ? new Date(`${dueDate}T09:00:00`).toISOString() : null,
    })

    setTitle('')
    setDescription('')
    setPriority('medium')
    setOwnerType('human')
    setDueDate('')
    setFormExpanded(false)
  }

  async function handleTaskMove(taskId: string, nextStatus: string) {
    moveTask(taskId, nextStatus as TaskStatus)
  }

  if (!isReady) {
    return (
      <div className="space-y-6 variant-page variant-page-kanban">
        <JourneyPanel page="kanban" />
        <section className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
          <KanbanBoardSkeleton />
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6 variant-page variant-page-kanban">
      <JourneyPanel page="kanban" />

      {primaryTask && (
        <section className="rounded-2xl border border-[#E8E2D8] border-l-4 border-l-[#C8620A] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6F65]">Now — Primary Task</p>
              <h2 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">{primaryTask.title}</h2>
              {primaryTask.description && (
                <p className="text-sm text-[#7A6F65]">{primaryTask.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[primaryTask.priority]}`}>
                  {primaryTask.priority}
                </span>
                {primaryTask.project_name && (
                  <span className="rounded-full border border-[#E8E2D8] bg-[#FAFAF9] px-2.5 py-1 text-xs text-[#7A6F65]">
                    {primaryTask.project_name}
                  </span>
                )}
                {primaryTask.due_date && (
                  <span className={`text-xs ${overdueDays > 0 ? 'font-semibold text-red-700' : 'text-[#7A6F65]'}`}>
                    Due {new Date(primaryTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {overdueDays > 0 ? (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {overdueDays} day{overdueDays === 1 ? '' : 's'} overdue
                  </span>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => handleStart(primaryTask.id)}
                  className="rounded-xl border border-[#E8E2D8] bg-white px-4 py-2 text-sm font-semibold text-[#7A6F65] transition-colors hover:bg-[#FAFAF9]"
                >
                  Start
                </button>
                <button
                  onClick={() => handleMarkDone(primaryTask.id)}
                  className="rounded-xl bg-[#C8620A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
                >
                  Mark Done
                </button>
              </div>
              <button
                onClick={() => handleMarkBlocked(primaryTask.id)}
                className="mt-2 text-xs text-[#7A6F65] underline-offset-2 transition-colors hover:text-red-700 hover:underline"
              >
                I&apos;m blocked
              </button>
            </div>
          </div>
        </section>
      )}

      <section
        className={`rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 ${
          primaryTask ? 'bg-[#FFFDF8] shadow-none' : 'bg-white shadow-sm'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Task Board</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Capture quickly, prioritize clearly, and move work from chaos to done.
            </p>
          </div>
          <div className="hidden rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6F65] sm:block">
            Local-first mode
          </div>
        </div>

        {!formExpanded ? (
          <button
            type="button"
            onClick={() => setFormExpanded(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#E8E2D8] px-4 py-3 text-sm text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
          >
            <Plus className="h-4 w-4" />
            Add a task...
          </button>
        ) : (
          <form onSubmit={handleCreateTask} className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Task
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What has to happen next?"
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Context
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional detail"
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Project
              </label>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              >
                <option value="all">No project</option>
                {data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Owner
              </label>
              <select
                value={ownerType}
                onChange={(event) => setOwnerType(event.target.value as OwnerType)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              >
                <option value="human">David</option>
                <option value="agent">AI Partner</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Due
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              />
            </div>

            <div className="lg:col-span-12 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setFormExpanded(false)}
                className="text-sm text-[#7A6F65] hover:text-[#1C1714]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#F5F4F2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </span>

            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value as 'all' | OwnerType)}
              className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#7A6F65]"
            >
              <option value="all">All owners</option>
              <option value="human">David only</option>
              <option value="agent">AI only</option>
            </select>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#7A6F65]"
            >
              <option value="all">All projects</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
              className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#7A6F65]"
            >
              <option value="all">All statuses</option>
              <option value="backlog">Backlog</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <p className="text-sm text-[#7A6F65]">
              <span className="font-semibold text-[#1C1714]">{activeTaskCount}</span> active •{' '}
              <span className="font-semibold text-[#1C1714]">{doneTaskCount}</span> done
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            {data.tasks.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-6 text-center">
                <p className="text-base font-semibold text-[#1C1714]">No tasks yet</p>
                <p className="mt-1 text-sm text-[#7A6F65]">Your board is empty. Start by adding the first task.</p>
                <button
                  type="button"
                  onClick={() => setFormExpanded(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
                >
                  <Plus className="h-4 w-4" />
                  Add your first task
                </button>
              </div>
            ) : (
              <ClientKanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            <h2 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              <Target className="h-4 w-4 text-[#C8620A]" />
              Top Focus
            </h2>
            <ul className="space-y-2">
              {focusTasks.length === 0 && (
                <li className="rounded-lg border border-dashed border-[#E8E2D8] px-3 py-3 text-sm text-[#7A6F65]">
                  No focus tasks right now.
                </li>
              )}
              {focusTasks.map((task) => (
                <li key={task.id} className="rounded-lg bg-[#FAFAF9] px-3 py-2">
                  <p className="text-sm font-medium text-[#1C1714]">{task.title}</p>
                  <p className="text-xs text-[#7A6F65]">
                    {task.project_name ?? 'No project'} • {task.owner}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Queue health</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#7A6F65]">Backlog</span>
                <span className="font-semibold text-[#1C1714]">
                  {filteredTasks.filter(t => t.status === 'backlog').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7A6F65]">In progress</span>
                <span className="font-semibold text-[#1C1714]">
                  {filteredTasks.filter(t => t.status === 'in_progress').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={filteredTasks.filter(t => t.status === 'blocked').length > 0 ? 'text-red-700' : 'text-[#7A6F65]'}>
                  Blocked
                </span>
                <span className={`font-semibold ${filteredTasks.filter(t => t.status === 'blocked').length > 0 ? 'text-red-700' : 'text-[#1C1714]'}`}>
                  {filteredTasks.filter(t => t.status === 'blocked').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7A6F65]">Done this session</span>
                <span className="font-semibold text-[#1C1714]">
                  {filteredTasks.filter(t => t.status === 'done').length}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <KanbanPageContent />
    </Suspense>
  )
}
