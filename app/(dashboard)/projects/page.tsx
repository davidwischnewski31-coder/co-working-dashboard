'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@/lib/workspace'

const projectStatusClasses: Record<ProjectStatus, string> = {
  idea: 'border border-dashed border-[#D4C4A8] bg-[#FFF7EB] text-[#7A3908]',
  active: 'bg-[#F5F4F2] text-[#1C1714]',
  paused: 'bg-[#FAFAF9] text-[#7A6F65]',
  shipped: 'bg-emerald-50 text-emerald-700',
}

export default function ProjectsPage() {
  const { data, createProject } = useWorkspace()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')

  const stats = useMemo(() => {
    const projectStats = new Map<
      string,
      {
        total: number
        active: number
        done: number
        blocked: number
      }
    >()

    for (const project of data.projects) {
      projectStats.set(project.id, { total: 0, active: 0, done: 0, blocked: 0 })
    }

    for (const task of data.tasks) {
      if (!task.project_id) {
        continue
      }

      const current = projectStats.get(task.project_id)
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

    return projectStats
  }, [data.projects, data.tasks])

  const unassignedTasks = data.tasks.filter((task) => !task.project_id && task.status !== 'done').length

  function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = name.trim()
    if (!normalizedName) {
      return
    }

    createProject({
      name: normalizedName,
      description,
      status,
    })

    setName('')
    setDescription('')
    setStatus('active')
  }

  return (
    <div className="space-y-6 variant-page variant-page-projects">
      <JourneyPanel page="projects" />
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Projects</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Keep each initiative scoped, visible, and connected to real execution.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F4F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
            <Briefcase className="h-3.5 w-3.5" />
            {data.projects.length} active projects
          </span>
        </div>

        <form onSubmit={handleCreateProject} className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              Project Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name your next initiative"
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
            />
          </div>

          <div className="lg:col-span-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              Description
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What outcome are you trying to produce?"
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
            >
              <option value="idea">Idea</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="shipped">Shipped</option>
            </select>
          </div>

          <div className="lg:col-span-1 lg:self-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8620A] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </section>

      {unassignedTasks > 0 ? (
        <section className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-4 py-3 text-sm text-[#7A6F65]">
          <span className="font-semibold text-[#1C1714]">{unassignedTasks}</span> active tasks are currently unassigned to a project.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.projects.map((project) => {
          const projectStats = stats.get(project.id) ?? { total: 0, active: 0, done: 0, blocked: 0 }
          const hasDoneWork = projectStats.done > 0
          const isInProgressWithoutDone = projectStats.done === 0 && projectStats.active > 0
          const isNotStarted = projectStats.done === 0 && projectStats.active === 0
          const completion =
            projectStats.total === 0 ? 0 : Math.round((projectStats.done / projectStats.total) * 100)

          return (
            <article
              key={project.id}
              className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                    aria-hidden
                  />
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1714]">{project.name}</h2>
                    <p className="mt-1 text-sm text-[#7A6F65]">
                      {project.description || 'No project description yet.'}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${projectStatusClasses[project.status]}`}>
                  {project.status}
                </span>
              </header>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#7A6F65]">
                    <span>Completion</span>
                    {isNotStarted ? (
                      <span className="font-medium text-[#7A6F65]">Not started</span>
                    ) : isInProgressWithoutDone ? (
                      <span className="font-medium text-[#7A6F65]">In progress</span>
                    ) : (
                      <span className="font-semibold text-[#1C1714]">{completion}%</span>
                    )}
                  </div>
                  {hasDoneWork ? (
                    <div className="h-1.5 rounded-full bg-[#E8E2D8]">
                      <div
                        className="h-1.5 rounded-full bg-[#C8620A] transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  ) : isInProgressWithoutDone ? (
                    <div className="h-1.5 rounded-full bg-[#E8E2D8]">
                      <div className="h-1.5 w-2/5 rounded-full bg-[#C8620A] animate-pulse" />
                    </div>
                  ) : (
                    <div className="h-1.5 w-full rounded-full border border-dashed border-[#D0C8BE]" />
                  )}
                </div>

                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-[#FAFAF9] px-2 py-2 text-center">
                    <dt className="text-[#7A6F65]">Active</dt>
                    <dd className="mt-0.5 font-semibold text-[#1C1714]">{projectStats.active}</dd>
                  </div>
                  <div className="rounded-lg bg-[#FAFAF9] px-2 py-2 text-center">
                    <dt className="text-[#7A6F65]">Done</dt>
                    <dd className="mt-0.5 font-semibold text-[#1C1714]">{projectStats.done}</dd>
                  </div>
                  <div className="rounded-lg bg-[#FAFAF9] px-2 py-2 text-center">
                    <dt className="text-[#7A6F65]">Blocked</dt>
                    <dd className="mt-0.5 font-semibold text-[#1C1714]">{projectStats.blocked}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-[#E8E2D8] pt-3">
                  <p className="text-xs text-[#7A6F65]">Updated {formatDate(project.updated_at)}</p>
                  <Link
                    href={`/kanban?project=${project.id}`}
                    className="text-xs font-medium text-[#C8620A] hover:underline"
                  >
                    View tasks →
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
