'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'
import type { OwnerType, TaskPriority } from '@/lib/workspace'

const priorityClass: Record<TaskPriority, string> = {
  low: 'bg-[#F5F4F2] text-[#7A6F65]',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { data, createTask } = useWorkspace()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [ownerType, setOwnerType] = useState<OwnerType>('human')
  const [dueDate, setDueDate] = useState('')

  const project = useMemo(
    () => data.projects.find((item) => item.id === projectId),
    [data.projects, projectId]
  )
  const projectTasks = useMemo(
    () => data.tasks.filter((task) => task.project_id === projectId),
    [data.tasks, projectId]
  )

  const doneCount = projectTasks.filter((task) => task.status === 'done').length
  const activeCount = projectTasks.length - doneCount
  const blockedCount = projectTasks.filter((task) => task.status === 'blocked').length
  const completion = projectTasks.length === 0 ? 0 : Math.round((doneCount / projectTasks.length) * 100)

  function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle || !project) {
      return
    }

    createTask({
      title: normalizedTitle,
      description,
      project_id: project.id,
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

  if (!projectId) {
    return (
      <div className="rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#7A6F65]">Missing project id.</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-4 variant-page">
        <section className="rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[#1C1714]">Project not found</h1>
          <p className="mt-1 text-sm text-[#7A6F65]">
            No project matches id <code>{projectId}</code>.
          </p>
          <p className="mt-2 text-xs text-[#7A6F65]">
            Available ids: {data.projects.map((item) => item.id).join(', ')}
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm font-semibold text-[#7A6F65] transition-colors hover:bg-[#FAFAF9]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Project Detail</p>
            <h1 className="mt-1 text-xl font-semibold text-[#1C1714] sm:text-2xl">{project.name}</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">{project.description || 'No project description yet.'}</p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm font-semibold text-[#7A6F65] transition-colors hover:bg-[#FAFAF9]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-[#FAFAF9] px-3 py-2">
            <p className="text-xs text-[#7A6F65]">Total tasks</p>
            <p className="text-base font-semibold text-[#1C1714]">{projectTasks.length}</p>
          </div>
          <div className="rounded-lg bg-[#FAFAF9] px-3 py-2">
            <p className="text-xs text-[#7A6F65]">Active</p>
            <p className="text-base font-semibold text-[#1C1714]">{activeCount}</p>
          </div>
          <div className="rounded-lg bg-[#FAFAF9] px-3 py-2">
            <p className="text-xs text-[#7A6F65]">Blocked</p>
            <p className={`text-base font-semibold ${blockedCount > 0 ? 'text-red-700' : 'text-[#1C1714]'}`}>
              {blockedCount}
            </p>
          </div>
          <div className="rounded-lg bg-[#FAFAF9] px-3 py-2">
            <p className="text-xs text-[#7A6F65]">Completion</p>
            <p className="text-base font-semibold text-[#1C1714]">{completion}%</p>
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-[#E8E2D8]">
          <div className="h-1.5 rounded-full bg-[#C8620A] transition-all" style={{ width: `${completion}%` }} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#1C1714]">Tasks in this project</h2>
        {projectTasks.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
            No tasks yet for this project.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projectTasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClass[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#7A6F65]">
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.due_date ? (
                    <span className="text-[11px] text-[#7A6F65]">Due {formatDate(task.due_date)}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-[#1C1714]">{task.title}</p>
                {task.description ? <p className="mt-1 text-xs text-[#7A6F65]">{task.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#1C1714]">Add task to this project</h2>
        <form onSubmit={handleCreateTask} className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              Task
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              Description
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
              Priority
            </label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
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
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
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
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
            />
          </div>
          <div className="lg:col-span-12">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
