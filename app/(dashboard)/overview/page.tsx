'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Lightbulb,
  ListTodo,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { calculateMomentumScore } from '@/components/variants/shared/variantData'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { OwnerType, TaskPriority, WorkspaceTask } from '@/lib/workspace'

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
  low: 'bg-[#E8ECF1] text-[#465161]',
}

const AGENT_BRIEF_WINDOWS = ['07:00', '20:00']
const AGENT_SCHEDULE = ['07:00', '12:00', '15:00', '17:00', '20:00']

type ScheduleState = 'past' | 'next' | 'future'

function isToday(value: string): boolean {
  const now = new Date()
  const target = new Date(value)

  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  )
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

function getSchedulePoints(schedule: string[]): Array<{ time: string; state: ScheduleState }> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  const nowTotalMinutes = hour * 60 + minute

  const scheduleMinutes = schedule.map((time) => {
    const [hoursString, minutesString] = time.split(':')
    return Number(hoursString) * 60 + Number(minutesString)
  })

  let nextIndex = scheduleMinutes.findIndex((value) => value >= nowTotalMinutes)
  let pastAll = false

  if (nextIndex === -1) {
    nextIndex = 0
    pastAll = true
  }

  return schedule.map((time, index) => {
    if (index === nextIndex) {
      return { time, state: 'next' as const }
    }

    if (pastAll || index < nextIndex) {
      return { time, state: 'past' as const }
    }

    return { time, state: 'future' as const }
  })
}

export default function OverviewPage() {
  const { data, moveTask, runAgentSweep, updateTask } = useWorkspace()

  const [editingBlockerId, setEditingBlockerId] = useState<string | null>(null)
  const [blockedBy, setBlockedBy] = useState('')
  const [dependency, setDependency] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [checkAgainAt, setCheckAgainAt] = useState('')
  const [blockOwner, setBlockOwner] = useState<OwnerType>('human')

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const doneTasks = data.tasks.filter((task) => task.status === 'done')
  const blockedTasks = activeTasks.filter((task) => task.status === 'blocked')
  const backlogTasks = data.tasks.filter((task) => task.status === 'backlog')
  const inboxPending = data.inbox.filter((item) => item.board === 'a' && item.status === 'new')
  const inboxDecisions = inboxPending.filter((item) => item.type === 'decision')

  const topPriorities = sortFocusTasks(activeTasks.filter((task) => task.status !== 'blocked')).slice(0, 3)

  const todayEvents = useMemo(() => {
    return data.calendarEvents
      .filter((event) => event.board === 'a' && isToday(event.start_at))
      .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime())
  }, [data.calendarEvents])

  const todayPlanTasks = useMemo(() => {
    return sortFocusTasks(
      activeTasks.filter(
        (task) =>
          task.status !== 'done' &&
          ((task.due_date && isToday(task.due_date)) || task.priority === 'urgent')
      )
    ).slice(0, 6)
  }, [activeTasks])

  const lastAgentRun = data.agentRuns
    .filter((run) => run.board === 'a')
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]
  const schedulePoints = getSchedulePoints(AGENT_SCHEDULE)
  const hasAgentPreparedPlan = Boolean(lastAgentRun && lastAgentRun.actions.length > 0)

  const recommendationItems = useMemo(() => {
    const suggestions: Array<{
      id: string
      title: string
      detail: string
      actionLabel: string
      run: () => void
    }> = []

    if (inboxDecisions.length > 0) {
      suggestions.push({
        id: 'decision-sweep',
        title: `${inboxDecisions.length} decision item${inboxDecisions.length === 1 ? '' : 's'} waiting`,
        detail: 'Run the agent to transform decision requests into actionable backlog entries.',
        actionLabel: 'Run Agent Sweep',
        run: () => runAgentSweep({ board: 'a', run_type: 'manual' }),
      })
    }

    const blockerWithoutNextStep = blockedTasks.find((task) => !task.next_unblock_step)
    if (blockerWithoutNextStep) {
      suggestions.push({
        id: 'blocker-next-step',
        title: `Blocker missing next step: ${blockerWithoutNextStep.title}`,
        detail: 'Fill blocked by/dependency/next step so the agent can escalate correctly.',
        actionLabel: 'Open Blocker Form',
        run: () => openBlockerEditor(blockerWithoutNextStep),
      })
    }

    const promoteCandidate = sortFocusTasks(backlogTasks)[0]
    if (promoteCandidate) {
      suggestions.push({
        id: 'promote-backlog',
        title: `Promote backlog item: ${promoteCandidate.title}`,
        detail: 'Move one high-value backlog task into todo so it becomes executable today.',
        actionLabel: 'Move to To Do',
        run: () => moveTask(promoteCandidate.id, 'todo'),
      })
    }

    if (todayEvents.length === 0 && topPriorities.length > 0) {
      suggestions.push({
        id: 'calendar-gap',
        title: 'No meetings in Today Plan',
        detail: 'Use this calendar gap for a deep focus block on your top priority.',
        actionLabel: 'Open Calendar',
        run: () => {
          window.location.href = '/shared/calendar'
        },
      })
    }

    return suggestions.slice(0, 4)
  }, [backlogTasks, blockedTasks, inboxDecisions.length, moveTask, runAgentSweep, todayEvents.length, topPriorities.length])

  function openBlockerEditor(task: WorkspaceTask) {
    setEditingBlockerId(task.id)
    setBlockedBy(task.blocked_by ?? '')
    setDependency(task.dependency ?? '')
    setNextStep(task.next_unblock_step ?? '')
    setCheckAgainAt(task.check_again_at ? new Date(task.check_again_at).toISOString().slice(0, 16) : '')
    setBlockOwner(task.owner_type)
  }

  function resetBlockerEditor() {
    setEditingBlockerId(null)
    setBlockedBy('')
    setDependency('')
    setNextStep('')
    setCheckAgainAt('')
    setBlockOwner('human')
  }

  function saveBlocker(taskId: string) {
    updateTask(taskId, {
      status: 'blocked',
      owner_type: blockOwner,
      blocked_by: blockedBy || null,
      dependency: dependency || null,
      next_unblock_step: nextStep || null,
      check_again_at: checkAgainAt ? new Date(checkAgainAt).toISOString() : null,
    })
    resetBlockerEditor()
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#CBD4E1] bg-[#F8FBFF] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#CBD4E1] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#506079]">
              <Sparkles className="h-3.5 w-3.5" />
              Board A - Execution OS
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[#1A2433] sm:text-3xl">
              Today Plan, priorities, blockers, and agent ops in one control view.
            </h1>
            <div className="pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6A7892]">Agent schedule (CET)</p>
              <div className="relative mt-2">
                <div className="absolute left-3 right-3 top-2 h-px bg-[#D0C8BE]" />
                <ol className="relative flex items-start justify-between gap-2">
                  {schedulePoints.map((point) => (
                    <li key={point.time} className="flex flex-col items-center gap-1">
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          point.state === 'next'
                            ? 'border-[#C8620A] bg-[#C8620A]'
                            : point.state === 'past'
                              ? 'border-[#D0C8BE] bg-[#D0C8BE]'
                              : 'border-[#D0C8BE] bg-white'
                        }`}
                      />
                      <span className="text-[10px] font-semibold tracking-[0.04em] text-[#6A7892]">{point.time}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <MomentumHero doneCount={doneTasks.length} blockedCount={blockedTasks.length} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-xl bg-[#2453A6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A4286]">
            Open Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/kanban" className="inline-flex items-center gap-2 rounded-xl border border-[#CBD4E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#415069] transition-colors hover:bg-[#EEF3FA]">
            Open Kanban
          </Link>
          <button
            onClick={() => runAgentSweep({ board: 'a', run_type: 'manual' })}
            className="inline-flex items-center gap-2 rounded-xl border border-[#CBD4E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#415069] transition-colors hover:bg-[#EEF3FA]"
          >
            Run Agent Now
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active Tasks" value={activeTasks.length} icon={<ListTodo className="h-4 w-4" />} />
        <MetricCard label="Blocked" value={blockedTasks.length} icon={<CircleAlert className="h-4 w-4" />} />
        <MetricCard label="Pending Inbox" value={inboxPending.length} icon={<ClipboardList className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1A2433]">
              <CalendarDays className="h-5 w-5 text-[#2453A6]" />
              Today Plan
            </h2>
            <div className="flex items-center gap-2">
              {hasAgentPreparedPlan ? (
                <span className="rounded-full border border-[#CBD4E1] bg-[#EEF3FA] px-2.5 py-1 text-[11px] font-semibold text-[#415069]">
                  Agent prepared
                </span>
              ) : null}
              <span className="text-xs uppercase tracking-[0.12em] text-[#6A7892]">Execution first</span>
            </div>
          </div>

          {todayPlanTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-5 text-sm text-[#6A7892]">
              No tasks due today - check your backlog.
            </p>
          ) : (
            <ol className="space-y-2">
              {todayPlanTasks.map((task, index) => (
                <li key={task.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] px-3 py-2.5">
                  <p className="text-sm font-semibold text-[#1A2433]">
                    {index + 1}. {task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5E6B82]">
                    {task.due_date && isToday(task.due_date) ? 'Due today' : 'No due date'} · {task.priority}
                    {task.priority === 'urgent' ? ' urgent' : ' priority'}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6A7892]">Meetings</p>
            {todayEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-3 text-sm text-[#6A7892]">
                No meetings scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayEvents.map((event) => (
                  <li key={event.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1A2433]">{event.title}</p>
                    <p className="mt-1 text-xs text-[#5E6B82]">{formatDateTime(event.start_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1A2433]">
              <Target className="h-5 w-5 text-[#2453A6]" />
              Top 3 Priorities
            </h2>
            <Link href="/kanban" className="text-xs font-semibold text-[#2453A6] hover:underline">View board</Link>
          </div>

          {topPriorities.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-4 text-sm text-[#6A7892]">
              No active priorities right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {topPriorities.map((task) => (
                <li key={task.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClasses[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.due_date ? <span className="text-[11px] text-[#6A7892]">Due {formatDate(task.due_date)}</span> : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#1A2433]">{task.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button onClick={() => moveTask(task.id, 'in_progress')} className="rounded-md border border-[#CBD4E1] bg-white px-2 py-1 text-[11px] font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">Start</button>
                    <button onClick={() => moveTask(task.id, 'done')} className="rounded-md border border-[#CBD4E1] bg-white px-2 py-1 text-[11px] font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">Done</button>
                    <button onClick={() => moveTask(task.id, 'blocked')} className="rounded-md border border-[#CBD4E1] bg-white px-2 py-1 text-[11px] font-semibold text-[#415069] hover:border-red-300 hover:text-red-700">Block</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <article className="rounded-2xl border border-[#E5CAD0] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1A2433]">
              <ShieldAlert className="h-5 w-5 text-[#B33A4C]" />
              Blockers
            </h2>
            <span className="rounded-full bg-[#FDECEE] px-2.5 py-1 text-xs font-semibold text-[#B33A4C]">
              {blockedTasks.length}
            </span>
          </div>

          {blockedTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E5CAD0] bg-[#FFF5F7] px-3 py-4 text-sm text-[#7D4C56]">
              No blocked tasks right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {blockedTasks.map((task) => {
                const isEditing = editingBlockerId === task.id
                return (
                  <li key={task.id} className="rounded-lg border border-[#EED7DB] bg-[#FFF8F9] p-3">
                    <p className="text-sm font-semibold text-[#1A2433]">{task.title}</p>
                    <div className="mt-1 space-y-1 text-xs text-[#7D4C56]">
                      <p>Blocked by: {task.blocked_by ?? 'Not set'}</p>
                      <p>Dependency: {task.dependency ?? 'Not set'}</p>
                      <p>Next step: {task.next_unblock_step ?? 'Not set'}</p>
                      <p>Check again: {task.check_again_at ? formatDateTime(task.check_again_at) : 'Not set'}</p>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => openBlockerEditor(task)}
                        className="mt-2 rounded-md border border-[#E5CAD0] bg-white px-2 py-1 text-[11px] font-semibold text-[#7D4C56] hover:border-[#B33A4C] hover:text-[#B33A4C]"
                      >
                        Edit Blocker Fields
                      </button>
                    ) : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="text-[11px] text-[#7D4C56]">
                          Blocked By
                          <input value={blockedBy} onChange={(event) => setBlockedBy(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1A2433]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Dependency
                          <input value={dependency} onChange={(event) => setDependency(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1A2433]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56] sm:col-span-2">
                          Next Unblock Step
                          <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1A2433]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Owner
                          <select value={blockOwner} onChange={(event) => setBlockOwner(event.target.value as OwnerType)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1A2433]">
                            <option value="human">David</option>
                            <option value="agent">AI Partner</option>
                          </select>
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Check Again
                          <input type="datetime-local" value={checkAgainAt} onChange={(event) => setCheckAgainAt(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1A2433]" />
                        </label>
                        <div className="sm:col-span-2 flex gap-2">
                          <button onClick={() => saveBlocker(task.id)} className="rounded-md bg-[#B33A4C] px-2.5 py-1.5 text-[11px] font-semibold text-white">Save</button>
                          <button onClick={resetBlockerEditor} className="rounded-md border border-[#E5CAD0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7D4C56]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-2xl border border-[#CAD5E4] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1A2433]">
                <Bot className="h-5 w-5 text-[#2453A6]" />
                Agent Recommendations
              </h2>
              <Link href="/agent-log" className="text-xs font-semibold text-[#2453A6] hover:underline">Log</Link>
            </div>

            {recommendationItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-4 text-sm text-[#6A7892]">
                Agent sees no urgent recommendations right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {recommendationItems.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] p-3">
                    <p className="text-sm font-semibold text-[#1A2433]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#5E6B82]">{item.detail}</p>
                    <button
                      onClick={item.run}
                      className="mt-2 rounded-md border border-[#CBD4E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#415069] transition-colors hover:border-[#2453A6] hover:text-[#2453A6]"
                    >
                      {item.actionLabel}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-[#CAD5E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1A2433]">
              <Lightbulb className="h-5 w-5 text-[#2453A6]" />
              Morning / Evening Brief
            </h2>
            <p className="mt-1 text-sm text-[#5E6B82]">
              Brief windows (CET): {AGENT_BRIEF_WINDOWS.join(' · ')}
            </p>
            {lastAgentRun ? (
              <div className="mt-3 rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] px-3 py-2">
                <p className="text-sm font-semibold text-[#1A2433]">Last run</p>
                <p className="mt-1 text-xs text-[#5E6B82]">{lastAgentRun.summary}</p>
                <p className="mt-1 text-[11px] text-[#7B89A1]">{formatDateTime(lastAgentRun.timestamp)}</p>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-[#CAD5E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#1A2433]">Recent Activity</h2>
            <ul className="mt-3 space-y-2">
              {data.activities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] px-3 py-2">
                  <p className="text-sm text-[#1A2433]">{activity.message}</p>
                  <p className="mt-0.5 text-[11px] text-[#6A7892]">{formatDateTime(activity.timestamp)}</p>
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
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#CBD4E1] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#EEF3FA] p-2 text-[#415069]">{icon}</div>
      <p className="text-sm font-medium text-[#5E6B82]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1A2433] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
    </div>
  )
}

function MomentumHero({ doneCount, blockedCount }: { doneCount: number; blockedCount: number }) {
  const score = Math.max(0, Math.min(100, doneCount * 12 + Math.max(0, 44 - blockedCount * 10)))

  return (
    <div className="rounded-2xl border border-[#CBD4E1] bg-white px-4 py-3 text-right">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5E6B82]">Momentum</p>
      <p className="mt-1 font-[family-name:var(--font-dashboard-mono)] text-4xl font-semibold tabular-nums text-[#1A2433]">{score}</p>
      <p className="text-xs text-[#5E6B82]">
        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
        {doneCount} done · <CircleAlert className="mx-1 inline h-3.5 w-3.5" />
        {blockedCount} blocked
      </p>
    </div>
  )
}
