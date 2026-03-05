'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Lightbulb,
  ListTodo,
  ShieldAlert,
  Target,
} from 'lucide-react'
import { AgentLogContent } from '@/components/dashboard/AgentLogContent'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDateTime, formatDaysInStatus } from '@/lib/utils'
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
  medium: 'bg-[#F5F4F2] text-[#7A644F]',
  low: 'bg-[#FAFAF9] text-[#7A6F65]',
}

const AGENT_SCHEDULE = ['07:00', '12:00', '15:00', '17:00', '20:00']

type ScheduleState = 'past' | 'next' | 'future'
type RecommendationItem = {
  id: string
  title: string
  detail: string
  actionLabel: string
  run: () => void
}

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
  const router = useRouter()
  const { data, createInboxItem, moveTask, runAgentSweep, updateTask, setAgentRunning, isAgentRunning } = useWorkspace()

  const [editingBlockerId, setEditingBlockerId] = useState<string | null>(null)
  const [blockedBy, setBlockedBy] = useState('')
  const [dependency, setDependency] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [checkAgainAt, setCheckAgainAt] = useState('')
  const [blockOwner, setBlockOwner] = useState<OwnerType>('human')
  const [agentRunState, setAgentRunState] = useState<'idle' | 'running' | 'done'>('idle')
  const [agentRunLogs, setAgentRunLogs] = useState<string[]>([])
  const [agentRunSummary, setAgentRunSummary] = useState<string | null>(null)
  const [pendingRecommendation, setPendingRecommendation] = useState<RecommendationItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [agentLogOpen, setAgentLogOpen] = useState(false)
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [activitySearch, setActivitySearch] = useState('')
  const [retroNote, setRetroNote] = useState('')
  const runTokenRef = useRef(0)

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const doneTasks = data.tasks.filter((task) => task.status === 'done')
  const blockedTasks = activeTasks.filter((task) => task.status === 'blocked')
  const backlogTasks = data.tasks.filter((task) => task.status === 'backlog')
  const inboxPending = data.inbox.filter((item) => item.board === 'a' && item.status === 'new')
  const inboxDecisions = inboxPending.filter((item) => item.type === 'decision_needed')

  const topPriorities = sortFocusTasks(activeTasks.filter((task) => task.status !== 'blocked')).slice(0, 3)

  const todayEvents = useMemo(() => {
    return data.calendarEvents
      .filter((event) => event.board === 'a' && isToday(event.start_at))
      .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime())
  }, [data.calendarEvents])

  const todayPlanTasks = sortFocusTasks(
    activeTasks.filter(
      (task) =>
        task.status !== 'done' &&
        ((task.due_date && isToday(task.due_date)) || task.priority === 'urgent')
    )
  ).slice(0, 6)

  const hourNow = new Date().getHours()
  const dailyPhase = hourNow < 12 ? 'morning' : hourNow < 17 ? 'midday' : 'evening'
  const ideasCapturedToday = data.ideas.filter((idea) => isToday(idea.created_at))
  const completedToday = doneTasks.filter((task) => task.completed_at && isToday(task.completed_at))
  const activityItems = activityExpanded ? data.activities : data.activities.slice(0, 5)

  const lastAgentRun = data.agentRuns
    .filter((run) => run.board === 'a')
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]
  const schedulePoints = getSchedulePoints(AGENT_SCHEDULE)
  const hasAgentPreparedPlan = Boolean(lastAgentRun && lastAgentRun.actions.length > 0)
  const lastRunLabel = lastAgentRun
    ? `${new Date(lastAgentRun.timestamp).toLocaleString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Vienna',
      })} - ${lastAgentRun.summary}`
    : 'Not run yet - click \"Run Analysis\" to start.'

  useEffect(() => {
    return () => {
      runTokenRef.current += 1
      setAgentRunning(false)
    }
  }, [setAgentRunning])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const now = new Date()
    for (const task of blockedTasks) {
      if (!task.check_again_at || new Date(task.check_again_at) >= now) {
        continue
      }

      const taskToken = `Task: ${task.id} —`
      const alreadyFlagged = data.inbox.some(
        (item) => item.type === 'overdue_flag' && item.status === 'new' && (item.body ?? '').includes(taskToken)
      )

      if (alreadyFlagged) {
        continue
      }

      createInboxItem({
        type: 'overdue_flag',
        title: `Blocker overdue: ${task.title}`,
        body: `Task: ${task.id} — ${task.title} overdue since ${task.check_again_at}`,
        source: 'Agent',
        board: 'a',
      })
    }
  }, [blockedTasks, createInboxItem, data.inbox])

  const recommendationItems = (() => {
    const suggestions: RecommendationItem[] = []

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
          router.push('/shared/calendar')
        },
      })
    }

    return suggestions.slice(0, 4)
  })()

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

  async function runAgentSimulation() {
    if (agentRunState === 'running') {
      return
    }

    const token = Date.now()
    runTokenRef.current = token
    setAgentRunState('running')
    setAgentRunLogs([])
    setAgentRunSummary(null)
    setAgentRunning(true)

    const steps = [
      'Reviewing tasks...',
      'Checking blocked items...',
      'Updating priorities...',
      'Preparing recommendations...',
    ]

    for (const step of steps) {
      await new Promise((resolve) => window.setTimeout(resolve, 480))
      if (runTokenRef.current !== token) {
        return
      }
      setAgentRunLogs((current) => [...current, step])
    }

    await new Promise((resolve) => window.setTimeout(resolve, 420))
    if (runTokenRef.current !== token) {
      return
    }

    setAgentRunning(false)
    setAgentRunSummary('Analysis done — 3 tasks reviewed, 1 flagged.')
    setAgentRunState('done')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#E8E2D8] bg-[rgba(250,249,247,0.94)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-[#1C1714] sm:text-3xl">
              Today Plan, priorities, blockers, and agent ops in one control view.
            </h1>
            <button
              type="button"
              onClick={() => setAgentLogOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D8] bg-white px-2.5 py-1 text-xs font-semibold text-[#7A644F]"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isAgentRunning ? 'bg-green-500 animate-pulse' : 'bg-[#D0C8BE]'}`} />
              Agent log
            </button>
            <div className="pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6F65]">Agent schedule (CET)</p>
              <div className="relative mt-2">
                <div className="absolute left-3 right-3 top-2 h-px bg-[#D0C8BE]" />
                <ol className="relative flex items-start justify-between gap-2">
                  {schedulePoints.map((point) => (
                    <li key={point.time} className="flex flex-col items-center gap-1">
                      <span
                        className={`h-4 w-4 rounded-full border-2 ${
                          point.state === 'next'
                            ? 'border-[#C8620A] bg-[#C8620A] shadow-[0_0_0_3px_rgba(200,98,10,0.18)]'
                            : point.state === 'past'
                              ? 'border-[#B0A898] bg-[#B0A898]'
                              : 'border-[#D0C8BE] bg-white'
                        }`}
                      />
                      <span className="text-[10px] font-semibold tracking-[0.04em] text-[#7A6F65]">{point.time}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-2 text-xs text-[#7A6F65]">Last run: {lastRunLabel}</p>
            </div>
          </div>
          <MomentumHero doneCount={doneTasks.length} blockedCount={blockedTasks.length} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]">
            Open Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/kanban" className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#7A644F] transition-colors hover:bg-[#F5F4F2]">
            Open Kanban
          </Link>
          {agentRunState === 'idle' ? (
            <button
              onClick={runAgentSimulation}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#7A644F] transition-colors hover:bg-[#F5F4F2]"
            >
              Run Analysis
            </button>
          ) : (
            <div className="min-w-[260px] rounded-xl border border-[#E8E2D8] bg-white px-3 py-2.5">
              <p className="text-sm font-semibold text-[#7A644F]">
                {agentRunState === 'running' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#E8E2D8] border-t-[#C8620A] animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Done'
                )}
              </p>
              {agentRunLogs.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {agentRunLogs.map((line) => (
                    <li key={line} className="text-xs text-[#7A6F65]">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
              {agentRunSummary ? (
                <p className="mt-1 text-xs font-medium text-[#3D2A18]">{agentRunSummary}</p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active Tasks" value={activeTasks.length} icon={<ListTodo className="h-4 w-4" />} />
        <MetricCard label="Blocked" value={blockedTasks.length} icon={<CircleAlert className="h-4 w-4" />} />
        <MetricCard label="Pending Inbox" value={inboxPending.length} icon={<ClipboardList className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1C1714]">
              <CalendarDays className="h-5 w-5 text-[#7A644F]" />
              Today Plan
            </h2>
            <div className="flex items-center gap-2">
              {hasAgentPreparedPlan ? (
                <span className="rounded-full border border-[#E8E2D8] bg-[#F5F4F2] px-2.5 py-1 text-[11px] font-semibold text-[#7A644F]">
                  Agent prepared
                </span>
              ) : null}
              <span className="text-xs uppercase tracking-[0.12em] text-[#7A6F65]">Execution first</span>
            </div>
          </div>

          {todayPlanTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-5 text-sm text-[#7A6F65]">
              No tasks due today - check your backlog.
            </p>
          ) : (
            <ol className="space-y-2">
              {todayPlanTasks.map((task, index) => (
                <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                  <p className="text-sm font-semibold text-[#1C1714]">
                    {index + 1}. {task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7A6F65]">
                    {task.due_date && isToday(task.due_date) ? 'Due today' : 'No due date'} · {task.priority}
                    {task.priority === 'urgent' ? ' urgent' : ' priority'}
                    {' · '}
                    {formatDaysInStatus(task.updated_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6F65]">Meetings</p>
            {todayEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-3 text-sm text-[#7A6F65]">
                No meetings scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayEvents.map((event) => (
                  <li key={event.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1C1714]">{event.title}</p>
                    <p className="mt-1 text-xs text-[#7A6F65]">{formatDateTime(event.start_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1C1714]">
              <Target className="h-5 w-5 text-[#7A644F]" />
              Top 3 Priorities
            </h2>
            <Link href="/kanban" className="text-xs font-semibold text-[#C8620A] hover:underline">View board</Link>
          </div>

          {topPriorities.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
              No active priorities right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {topPriorities.map((task) => (
                <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClasses[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.due_date ? <span className="text-[11px] text-[#7A6F65]">Due {formatDate(task.due_date)}</span> : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#1C1714]">{task.title}</p>
                  <p className="mt-1 text-[11px] text-[#7A6F65]">{formatDaysInStatus(task.updated_at)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button onClick={() => moveTask(task.id, 'in_progress')} className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] hover:border-[#C8620A] hover:text-[#C8620A]">Start</button>
                    <button onClick={() => moveTask(task.id, 'done')} className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] hover:border-[#C8620A] hover:text-[#C8620A]">Done</button>
                    <button onClick={() => moveTask(task.id, 'blocked')} className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] hover:border-red-300 hover:text-red-700">Block</button>
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
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1C1714]">
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
                    <p className="text-sm font-semibold text-[#1C1714]">{task.title}</p>
                    <div className="mt-1 space-y-1 text-xs text-[#7D4C56]">
                      <p>Blocked by: {task.blocked_by ?? 'Not set'}</p>
                      <p>Dependency: {task.dependency ?? 'Not set'}</p>
                      <p>Next step: {task.next_unblock_step ?? 'Not set'}</p>
                      <p>Check again: {task.check_again_at ? formatDateTime(task.check_again_at) : 'Not set'}</p>
                      <p>Aging: {formatDaysInStatus(task.updated_at)}</p>
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
                          <input value={blockedBy} onChange={(event) => setBlockedBy(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1C1714]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Dependency
                          <input value={dependency} onChange={(event) => setDependency(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1C1714]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56] sm:col-span-2">
                          Next Unblock Step
                          <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1C1714]" />
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Owner
                          <select value={blockOwner} onChange={(event) => setBlockOwner(event.target.value as OwnerType)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1C1714]">
                            <option value="human">David</option>
                            <option value="agent">AI Partner</option>
                          </select>
                        </label>
                        <label className="text-[11px] text-[#7D4C56]">
                          Check Again
                          <input type="datetime-local" value={checkAgainAt} onChange={(event) => setCheckAgainAt(event.target.value)} className="mt-1 w-full rounded-md border border-[#E5CAD0] bg-white px-2 py-1.5 text-xs text-[#1C1714]" />
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
          <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1C1714]">
                <Bot className="h-5 w-5 text-[#7A644F]" />
                Recommendations
              </h2>
              <button type="button" onClick={() => setAgentLogOpen(true)} className="text-xs font-semibold text-[#C8620A] hover:underline">Log</button>
            </div>

            {recommendationItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
                No urgent recommendations right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {recommendationItems.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                    <p className="text-sm font-semibold text-[#1C1714]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#7A6F65]">{item.detail}</p>
                    <button
                      onClick={() => setPendingRecommendation(item)}
                      className="mt-2 rounded-md border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                    >
                      {item.actionLabel}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pendingRecommendation ? (
              <div className="mt-3 rounded-lg border border-[#E8E2D8] bg-[#F5F4F2] p-3">
                <p className="text-sm font-semibold text-[#1C1714]">Confirm: {pendingRecommendation.title}</p>
                <p className="mt-1 text-xs text-[#7A6F65]">{pendingRecommendation.detail}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      pendingRecommendation.run()
                      setToast(pendingRecommendation.actionLabel)
                      setPendingRecommendation(null)
                    }}
                    className="rounded-md bg-[#C8620A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#A04D06]"
                  >
                    {pendingRecommendation.actionLabel}
                  </button>
                  <button
                    onClick={() => setPendingRecommendation(null)}
                    className="text-xs text-[#7A6F65] hover:text-[#1C1714]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[#1C1714]">
              <Lightbulb className="h-5 w-5 text-[#7A644F]" />
              {dailyPhase === 'morning' ? 'Morning Focus' : dailyPhase === 'midday' ? 'Midday Check-in' : 'Evening Wind-down'}
            </h2>

            {dailyPhase === 'morning' ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-[#1C1714]">Today&apos;s plan from Kanban</p>
                {todayPlanTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-3 text-sm text-[#7A6F65]">
                    No due-today tasks yet. Pull one backlog item into To Do.
                  </p>
                ) : (
                  <ol className="space-y-1.5">
                    {todayPlanTasks.slice(0, 4).map((task, index) => (
                      <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714]">
                        {index + 1}. {task.title}
                      </li>
                    ))}
                  </ol>
                )}
                <p className="text-xs text-[#7A6F65]">Momentum note: start the highest-friction task first to compound execution.</p>
              </div>
            ) : null}

            {dailyPhase === 'midday' ? (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1714]">Blocked tasks</p>
                  {blockedTasks.length === 0 ? (
                    <p className="mt-1 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#7A6F65]">
                      No blocked tasks right now.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1.5">
                      {blockedTasks.slice(0, 4).map((task) => (
                        <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714]">
                          {task.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1714]">Ideas captured today</p>
                  {ideasCapturedToday.length === 0 ? (
                    <p className="mt-1 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#7A6F65]">
                      No new ideas captured today.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1.5">
                      {ideasCapturedToday.slice(0, 4).map((idea) => (
                        <li key={idea.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714]">
                          {idea.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {dailyPhase === 'evening' ? (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1714]">Completed today</p>
                  {completedToday.length === 0 ? (
                    <p className="mt-1 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#7A6F65]">
                      No completed tasks logged today yet.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1.5">
                      {completedToday.slice(0, 5).map((task) => (
                        <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714]">
                          {task.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Quick Retro (optional)</span>
                  <textarea
                    value={retroNote}
                    onChange={(event) => setRetroNote(event.target.value)}
                    rows={2}
                    placeholder="What worked, what blocked you, what to adjust tomorrow?"
                    className="mt-1 w-full resize-none rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
                  />
                </label>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#1C1714]">Activity</h2>
              <button
                type="button"
                onClick={() => setActivityExpanded((current) => !current)}
                className="text-xs font-semibold text-[#C8620A] hover:underline"
              >
                {activityExpanded ? 'Show less' : 'All activity'}
              </button>
            </div>

            <input
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              placeholder="Search activity (coming soon)"
              className="mt-3 w-full rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2 text-sm text-[#1C1714] outline-none"
            />

            <ul className="mt-3 space-y-2">
              {activityItems.map((activity) => (
                <li key={activity.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2">
                  <p className="text-sm text-[#1C1714]">{activity.message}</p>
                  <p className="mt-0.5 text-[11px] text-[#7A6F65]">{formatDateTime(activity.timestamp)}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {agentLogOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setAgentLogOpen(false)}
            aria-label="Close agent log"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl overflow-y-auto border-l border-[#E8E2D8] bg-[#FAF9F7] p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1C1714]">Agent Log</h3>
              <button
                type="button"
                onClick={() => setAgentLogOpen(false)}
                className="rounded-md border border-[#E8E2D8] bg-white px-2.5 py-1 text-xs font-semibold text-[#7A644F] hover:bg-[#F5F4F2]"
              >
                Close
              </button>
            </div>
            <AgentLogContent embedded />
          </aside>
        </>
      ) : null}

      {toast ? (
        <div className="fixed bottom-12 right-4 z-50 rounded-xl border border-[#E8E2D8] bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm font-medium text-[#1C1714]">Done: {toast}</p>
        </div>
      ) : null}
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
    <div className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#F5F4F2] p-2 text-[#7A644F]">{icon}</div>
      <p className="text-sm font-medium text-[#7A6F65]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1C1714] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
    </div>
  )
}

function MomentumHero({ doneCount, blockedCount }: { doneCount: number; blockedCount: number }) {
  const score = Math.max(0, Math.min(100, doneCount * 12 + Math.max(0, 44 - blockedCount * 10)))

  return (
    <div className="rounded-2xl border border-[#E8E2D8] bg-white px-4 py-3 text-right">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6F65]">Momentum</p>
      <p className="mt-1 font-[family-name:var(--font-dashboard-mono)] text-4xl font-semibold tabular-nums text-[#1C1714]">{score}</p>
      <p className="mt-1 text-xs text-[#7A6F65]">
        {doneCount} done · {blockedCount} blocked
      </p>
    </div>
  )
}
