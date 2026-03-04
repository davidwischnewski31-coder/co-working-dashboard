'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { Filter, Plus, Target } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { OwnerType, TaskPriority, TaskStatus, WorkspaceTask } from '@/lib/workspace'

const ClientKanbanBoard = dynamic(
  () => import('@/components/kanban/KanbanBoard').then((module) => module.KanbanBoard),
  {
    ssr: false,
    loading: () => <div className="h-72 rounded-xl border border-dashed border-[#e6dac6] bg-[#fffdf8]" />,
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

export default function KanbanPage() {
  const { data, createTask, moveTask } = useWorkspace()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [ownerType, setOwnerType] = useState<OwnerType>('human')
  const [projectId, setProjectId] = useState<string>('all')
  const [dueDate, setDueDate] = useState('')

  const [ownerFilter, setOwnerFilter] = useState<'all' | OwnerType>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

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
      .sort((left, right) => {
        const statusScore = left.status === 'done' ? 1 : 0
        const rightStatusScore = right.status === 'done' ? 1 : 0
        if (statusScore !== rightStatusScore) {
          return statusScore - rightStatusScore
        }
        return priorityOrder[right.priority] - priorityOrder[left.priority]
      })
  }, [ownerFilter, projectFilter, tasks])

  const focusTasks = useMemo(
    () => filteredTasks.filter((task) => task.status !== 'done').slice(0, 4),
    [filteredTasks]
  )

  const activeTaskCount = filteredTasks.filter((task) => task.status !== 'done').length
  const doneTaskCount = filteredTasks.filter((task) => task.status === 'done').length

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
  }

  async function handleTaskMove(taskId: string, nextStatus: string) {
    moveTask(taskId, nextStatus as TaskStatus)
  }

  return (
    <div className="space-y-6 variant-page variant-page-kanban">
      <JourneyPanel page="kanban" />
      <section className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Task Board</h1>
            <p className="mt-1 text-sm text-slate-500">
              Capture quickly, prioritize clearly, and move work from chaos to done.
            </p>
          </div>
          <div className="hidden rounded-xl bg-[#fff5e8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 sm:block">
            Local-first mode
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Task
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What has to happen next?"
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Context
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional detail"
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Project
            </label>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Priority
            </label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Owner
            </label>
            <select
              value={ownerType}
              onChange={(event) => setOwnerType(event.target.value as OwnerType)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              <option value="human">David</option>
              <option value="agent">AI Partner</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Due
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="lg:col-span-12">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ef6c00] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d75b00]"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#fff5e8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </span>

            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value as 'all' | OwnerType)}
              className="rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All owners</option>
              <option value="human">David only</option>
              <option value="agent">AI only</option>
            </select>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All projects</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{activeTaskCount}</span> active •{' '}
              <span className="font-semibold text-slate-900">{doneTaskCount}</span> done
            </p>
          </div>

          <div className="rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
            <ClientKanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
            <h2 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
              <Target className="h-4 w-4 text-orange-600" />
              Top Focus
            </h2>
            <ul className="space-y-2">
              {focusTasks.length === 0 && (
                <li className="rounded-lg border border-dashed border-[#e7dbc8] px-3 py-3 text-sm text-slate-500">
                  No focus tasks right now.
                </li>
              )}
              {focusTasks.map((task) => (
                <li key={task.id} className="rounded-lg bg-[#fffaf2] px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.project_name ?? 'No project'} • {task.owner}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Execution rule</h2>
            <p className="text-sm text-slate-600">
              Keep backlog thin. Promote only what you plan to execute in the next 72 hours.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
