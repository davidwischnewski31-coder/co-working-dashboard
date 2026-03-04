'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ListTodo,
  Sparkles,
  Target,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { TaskPriority, WorkspaceTask } from '@/lib/workspace'

const priorityRank: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const priorityClasses: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-slate-100 text-slate-700',
}

function sortFocusTasks(tasks: WorkspaceTask[]): WorkspaceTask[] {
  return [...tasks].sort((left, right) => {
    const priorityDiff = priorityRank[right.priority] - priorityRank[left.priority]
    if (priorityDiff !== 0) {
      return priorityDiff
    }

    const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER
    const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER

    return leftDue - rightDue
  })
}

export default function OverviewPage() {
  const { data } = useWorkspace()

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const doneTasks = data.tasks.filter((task) => task.status === 'done')
  const blockedTasks = activeTasks.filter((task) => task.status === 'blocked')
  const unreadArticles = data.articles.filter((article) => article.status === 'unread')

  const topTasks = sortFocusTasks(activeTasks).slice(0, 5)
  const recentActivities = data.activities.slice(0, 6)

  return (
    <div className="space-y-6 variant-page variant-page-overview">
      <JourneyPanel page="overview" />
      <section className="rounded-3xl border border-[#e8dac2] bg-gradient-to-br from-[#fff2df] via-[#fff7ed] to-[#eef8f4] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Command Center
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Run the day from one place and keep momentum visible.
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">
              This workspace is local-first: capture tasks fast, prioritize ruthlessly, and keep execution moving even if backend services fail.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/kanban"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ef6c00] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d55a00]"
            >
              Open Task Board
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/ideas"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e4d8c3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Review Ideas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Tasks"
          value={activeTasks.length}
          note="Everything not done"
          icon={<ListTodo className="h-4 w-4" />}
        />
        <MetricCard
          label="Completed"
          value={doneTasks.length}
          note="Closed loops"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Blocked"
          value={blockedTasks.length}
          note="Needs unblock"
          icon={<CircleAlert className="h-4 w-4" />}
        />
        <MetricCard
          label="Unread Articles"
          value={unreadArticles.length}
          note="Decision fuel"
          icon={<Clock3 className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Focus Queue</h2>
              <p className="text-sm text-slate-500">Highest leverage tasks to tackle next.</p>
            </div>
            <Target className="h-5 w-5 text-orange-600" />
          </div>

          {topTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#eadfcf] bg-[#fffcf7] px-4 py-6 text-sm text-slate-500">
              No active tasks. Capture one in the task board to kick things off.
            </p>
          ) : (
            <ul className="space-y-3">
              {topTasks.map((task) => {
                const projectName = data.projects.find((project) => project.id === task.project_id)?.name

                return (
                  <li
                    key={task.id}
                    className="rounded-xl border border-[#efe4d4] bg-[#fffcf8] p-4 transition-colors hover:border-[#e4d2b8]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}>
                        {task.priority}
                      </span>
                      {projectName && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {projectName}
                        </span>
                      )}
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">
                        {task.owner}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-slate-900">{task.title}</p>
                    {task.due_date && (
                      <p className="mt-1 text-xs text-slate-500">Due {formatDate(task.due_date)}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Current Friction</h2>
            <p className="mb-4 text-sm text-slate-500">What is slowing execution right now.</p>

            <div className="space-y-2 text-sm text-slate-700">
              <p className="rounded-lg bg-[#fff6ea] px-3 py-2">
                <span className="font-semibold text-orange-700">{blockedTasks.length}</span> blocked tasks
              </p>
              <p className="rounded-lg bg-[#f2fbf7] px-3 py-2">
                <span className="font-semibold text-emerald-700">{unreadArticles.length}</span> unread articles
              </p>
              <p className="rounded-lg bg-[#f4f8ff] px-3 py-2">
                <span className="font-semibold text-blue-700">{data.ideas.filter((idea) => idea.status !== 'shipped').length}</span> open ideas in funnel
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <p className="mb-4 text-sm text-slate-500">Latest actions across your workspace.</p>

            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="rounded-lg border border-[#efe4d4] bg-[#fffdf9] px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(activity.timestamp)}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: number
  note: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#e7dcc8] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#fff3e7] p-2 text-orange-700">{icon}</div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}
