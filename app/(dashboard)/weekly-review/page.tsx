'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleAlert, Clock3 } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { daysSince, formatDate, formatDateTime, formatDaysInStatus } from '@/lib/utils'

const WEEK_WINDOW_DAYS = 7

export default function WeeklyReviewPage() {
  const { data } = useWorkspace()

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - WEEK_WINDOW_DAYS)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + WEEK_WINDOW_DAYS)

  const completedThisWeek = data.tasks
    .filter((task) => task.status === 'done' && task.completed_at && new Date(task.completed_at) >= weekStart)
    .sort((left, right) => new Date(right.completed_at ?? 0).getTime() - new Date(left.completed_at ?? 0).getTime())

  const slippedTasks = data.tasks
    .filter((task) => task.status !== 'done' && task.due_date && new Date(task.due_date) < now)
    .sort((left, right) => new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime())

  const blockedTasks = data.tasks.filter((task) => task.status === 'blocked')
  const stuckTasks = data.tasks
    .filter((task) => task.status !== 'done' && daysSince(task.updated_at) >= 3)
    .sort((left, right) => daysSince(right.updated_at) - daysSince(left.updated_at))

  const dueThisWeek = data.tasks.filter(
    (task) => task.status !== 'done' && task.due_date && new Date(task.due_date) >= now && new Date(task.due_date) <= weekEnd
  )

  const latestRun = data.agentRuns
    .filter((run) => run.board === 'a')
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]

  const suggestions: string[] = []
  if (slippedTasks.length > 0) {
    suggestions.push(`Re-plan ${slippedTasks.length} slipped task${slippedTasks.length === 1 ? '' : 's'} before adding new scope.`)
  }
  if (blockedTasks.length > 0) {
    suggestions.push(`Run an unblock pass on ${blockedTasks.length} blocked task${blockedTasks.length === 1 ? '' : 's'} and set next check points.`)
  }
  if (stuckTasks.length > 0) {
    suggestions.push(`Escalate ${stuckTasks.length} stuck item${stuckTasks.length === 1 ? '' : 's'} (${formatDaysInStatus(stuckTasks[0].updated_at)} at the top).`)
  }
  if (dueThisWeek.length > 0) {
    suggestions.push(`Protect focus time for ${dueThisWeek.length} task${dueThisWeek.length === 1 ? '' : 's'} due in the next 7 days.`)
  }
  if (suggestions.length === 0) {
    suggestions.push('Momentum is clean this week. Promote one backlog item with highest leverage.')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#E8E2D8] bg-[rgba(250,249,247,0.94)] p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-[#1C1714] sm:text-3xl">
          Close the loop on what shipped, what slipped, and what needs intervention.
        </h1>
        <p className="mt-2 text-sm text-[#7A6F65]">
          Window: {formatDate(weekStart)} - {formatDate(now)}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Done This Week" value={completedThisWeek.length} icon={<CheckCircle2 className="h-4 w-4" />} />
        <MetricCard label="Slipped" value={slippedTasks.length} icon={<Clock3 className="h-4 w-4" />} />
        <MetricCard label="Blocked" value={blockedTasks.length} icon={<CircleAlert className="h-4 w-4" />} />
        <MetricCard label="Stuck 3d+" value={stuckTasks.length} icon={<Clock3 className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1C1714]">Done This Week</h2>
            <Link href="/kanban?status=done" className="text-xs font-semibold text-[#C8620A] hover:underline">
              Open Done
            </Link>
          </div>
          {completedThisWeek.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
              No completed tasks in the last 7 days.
            </p>
          ) : (
            <ul className="space-y-2">
              {completedThisWeek.slice(0, 12).map((task) => (
                <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                  <p className="text-sm font-semibold text-[#1C1714]">{task.title}</p>
                  <p className="mt-1 text-[11px] text-[#7A6F65]">
                    Completed {task.completed_at ? formatDateTime(task.completed_at) : '-'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#E5CAD0] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1C1714]">Slipped / Stuck</h2>
            <Link href="/kanban" className="text-xs font-semibold text-[#C8620A] hover:underline">
              Open Kanban
            </Link>
          </div>
          {slippedTasks.length === 0 && stuckTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E5CAD0] bg-[#FFF5F7] px-3 py-4 text-sm text-[#7D4C56]">
              No slipped or stuck items right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {[...slippedTasks, ...stuckTasks.filter((task) => !slippedTasks.some((slipped) => slipped.id === task.id))]
                .slice(0, 12)
                .map((task) => (
                  <li key={task.id} className="rounded-lg border border-[#EED7DB] bg-[#FFF8F9] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1C1714]">{task.title}</p>
                    <p className="mt-1 text-[11px] text-[#7D4C56]">
                      {task.due_date && new Date(task.due_date) < now ? `Due ${formatDate(task.due_date)} · ` : ''}
                      {formatDaysInStatus(task.updated_at)}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1C1714]">Review Prompts</h2>
          <Link href="/overview" className="inline-flex items-center gap-1 text-xs font-semibold text-[#C8620A] hover:underline">
            Back to Overview
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {latestRun ? (
          <p className="mb-3 rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#7A6F65]">
            Last analysis run: {formatDateTime(latestRun.timestamp)} - {latestRun.summary}
          </p>
        ) : null}
        <ul className="space-y-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]">
              {suggestion}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#F5F4F2] p-2 text-[#7A644F]">{icon}</div>
      <p className="text-sm font-medium text-[#7A6F65]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1C1714] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
    </div>
  )
}
