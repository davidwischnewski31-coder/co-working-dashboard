'use client'

import { useMemo } from 'react'
import {
  AlertTriangle,
  BookOpenText,
  CheckCheck,
  Play,
  Radar,
  ShieldCheck,
  Target,
  Workflow,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { IdeaStatus, TaskPriority, WorkspaceTask } from '@/lib/workspace'

const priorityRank: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const priorityTone: Record<TaskPriority, string> = {
  urgent: 'border-red-300/40 bg-red-500/20 text-red-100',
  high: 'border-orange-300/40 bg-orange-500/20 text-orange-100',
  medium: 'border-sky-300/40 bg-sky-500/20 text-sky-100',
  low: 'border-slate-300/40 bg-slate-500/20 text-slate-100',
}

const nextIdeaStatus: Record<IdeaStatus, IdeaStatus> = {
  brainstorm: 'research',
  research: 'in_progress',
  in_progress: 'shipped',
  shipped: 'shipped',
  archived: 'archived',
}

function sortQueue(tasks: WorkspaceTask[]): WorkspaceTask[] {
  return [...tasks].sort((left, right) => {
    const priorityDelta = priorityRank[right.priority] - priorityRank[left.priority]
    if (priorityDelta !== 0) {
      return priorityDelta
    }

    const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER
    const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER

    return leftDue - rightDue
  })
}

function statusLabel(value: string): string {
  return value.replace('_', ' ')
}

export default function MissionControlPage() {
  const { data, moveTask, updateArticleStatus, updateIdeaStatus } = useWorkspace()

  const projectById = useMemo(
    () =>
      new Map(
        data.projects.map((project) => {
          return [project.id, project]
        })
      ),
    [data.projects]
  )

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const blockedTasks = activeTasks.filter((task) => task.status === 'blocked')
  const autopilotQueue = useMemo(() => sortQueue(activeTasks), [activeTasks])
  const doneCount = data.tasks.filter((task) => task.status === 'done').length
  const completionRate = data.tasks.length === 0 ? 0 : Math.round((doneCount / data.tasks.length) * 100)

  const launchCandidate = autopilotQueue.find((task) => task.status === 'todo' || task.status === 'backlog')
  const inProgressMission = autopilotQueue.find((task) => task.status === 'in_progress')
  const ideaRadar = data.ideas.filter((idea) => idea.status !== 'shipped').slice(0, 5)
  const intelFeed = data.articles.filter((article) => article.status !== 'archived').slice(0, 5)
  const commandLog = data.activities.slice(0, 7)

  const projectReactor = useMemo(() => {
    return data.projects.map((project) => {
      const projectTasks = data.tasks.filter((task) => task.project_id === project.id)
      const activeCount = projectTasks.filter((task) => task.status !== 'done').length
      const doneProjectCount = projectTasks.filter((task) => task.status === 'done').length
      const blockedCount = projectTasks.filter((task) => task.status === 'blocked').length

      return {
        project,
        activeCount,
        doneProjectCount,
        blockedCount,
      }
    })
  }, [data.projects, data.tasks])

  function launchNextTask() {
    if (!launchCandidate) {
      return
    }

    moveTask(launchCandidate.id, 'in_progress')
  }

  function clearFirstBlocker() {
    if (blockedTasks.length === 0) {
      return
    }

    moveTask(blockedTasks[0].id, 'todo')
  }

  function closeCurrentMission() {
    if (!inProgressMission) {
      return
    }

    moveTask(inProgressMission.id, 'done')
  }

  return (
    <div className="space-y-6 rounded-3xl bg-[#090f1f] p-4 text-slate-100 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-slate-700 bg-gradient-to-r from-[#101b33] to-[#1f3153] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Version 1</p>
        <h1 className="mt-2 text-2xl font-semibold">Mission Control</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Full operations dashboard for rapid execution. Run the queue, neutralize blockers, and keep every project signal in one
          command surface.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Completion" value={`${completionRate}%`} note="Closed loops" />
        <MetricCard label="Active Missions" value={String(activeTasks.length)} note="Not done" />
        <MetricCard label="Blockers" value={String(blockedTasks.length)} note="Needs intervention" tone="text-red-200" />
        <MetricCard
          label="Open Ideas"
          value={String(data.ideas.filter((idea) => idea.status !== 'shipped').length)}
          note="Strategic backlog"
        />
        <MetricCard
          label="Intel Queue"
          value={String(data.articles.filter((article) => article.status === 'unread').length)}
          note="Unread signals"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-cyan-300" />
              Autopilot Queue
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={launchNextTask}
                disabled={!launchCandidate}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Launch Next
              </button>
              <button
                onClick={closeCurrentMission}
                disabled={!inProgressMission}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40"
              >
                <CheckCheck className="h-4 w-4" />
                Close Current
              </button>
            </div>
          </div>

          <ul className="space-y-3">
            {autopilotQueue.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-700 bg-[#0f172a] px-4 py-6 text-sm text-slate-400">
                No active missions in queue.
              </li>
            ) : null}

            {autopilotQueue.slice(0, 8).map((task, index) => {
              const project = task.project_id ? projectById.get(task.project_id) : null

              return (
                <li key={task.id} className="rounded-xl border border-slate-700 bg-[#0f172a] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">#{index + 1}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityTone[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {statusLabel(task.status)}
                    </span>
                    {project ? (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{project.name}</span>
                    ) : null}
                  </div>

                  <p className="mt-2 font-medium text-slate-100">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Owner: {task.owner}
                    {task.due_date ? ` • Due ${formatDate(task.due_date)}` : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Emergency Lane
            </h3>
            <p className="mt-1 text-sm text-slate-300">Blockers are escalated here until explicitly released.</p>
            <button
              onClick={clearFirstBlocker}
              disabled={blockedTasks.length === 0}
              className="mt-3 rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100 disabled:opacity-40"
            >
              Clear First Blocker
            </button>
            <ul className="mt-3 space-y-2">
              {blockedTasks.slice(0, 3).map((task) => (
                <li key={task.id} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {task.title}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Daily Script
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              <li>1. Launch one high-priority mission.</li>
              <li>2. Eliminate at least one blocker.</li>
              <li>3. Close one mission before shutdown.</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">
            <Workflow className="h-4 w-4" />
            Project Reactor
          </h2>
          <ul className="mt-3 space-y-2">
            {projectReactor.map(({ project, activeCount, doneProjectCount, blockedCount }) => (
              <li key={project.id} className="rounded-lg bg-[#121d34] px-3 py-2">
                <p className="text-sm font-semibold text-slate-100">{project.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {activeCount} active • {doneProjectCount} done • {blockedCount} blocked
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-violet-200">
            <Radar className="h-4 w-4" />
            Idea Radar
          </h2>
          <ul className="mt-3 space-y-2">
            {ideaRadar.length === 0 ? (
              <li className="rounded-lg bg-[#121d34] px-3 py-3 text-xs text-slate-400">No open ideas.</li>
            ) : null}
            {ideaRadar.map((idea) => (
              <li key={idea.id} className="rounded-lg bg-[#121d34] px-3 py-2">
                <p className="text-sm font-semibold text-slate-100">{idea.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">{statusLabel(idea.status)}</span>
                  <button
                    onClick={() => updateIdeaStatus(idea.id, nextIdeaStatus[idea.status])}
                    disabled={idea.status === 'shipped'}
                    className="rounded-md border border-violet-300/30 bg-violet-500/20 px-2 py-1 text-xs font-semibold text-violet-100 disabled:opacity-40"
                  >
                    Advance
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-amber-200">
            <BookOpenText className="h-4 w-4" />
            Intel Feed
          </h2>
          <ul className="mt-3 space-y-2">
            {intelFeed.length === 0 ? (
              <li className="rounded-lg bg-[#121d34] px-3 py-3 text-xs text-slate-400">No intel queued.</li>
            ) : null}
            {intelFeed.map((article) => (
              <li key={article.id} className="rounded-lg bg-[#121d34] px-3 py-2">
                <p className="line-clamp-2 text-sm font-semibold text-slate-100">{article.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">{article.status}</span>
                  <button
                    onClick={() => updateArticleStatus(article.id, 'read')}
                    className="rounded-md border border-amber-300/30 bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-100"
                  >
                    Mark Read
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Command Log</h2>
          <ul className="mt-3 space-y-2">
            {commandLog.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-[#121d34] px-3 py-2">
                <p className="text-xs text-slate-200">{entry.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(entry.timestamp)}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone ?? 'text-slate-100'}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}
