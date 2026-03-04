'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Clock3, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

const DAILY_WINDOWS = ['07:00', '12:00', '15:00', '17:00', '20:00']

type DailyWindow = 'morning' | 'evening'

type ChecklistItem = {
  id: string
  label: string
  detail: string
}

const MORNING_ITEMS: ChecklistItem[] = [
  {
    id: 'morning-plan',
    label: 'Lock today plan',
    detail: 'Pick top 3 priorities and define first deep-focus block.',
  },
  {
    id: 'morning-inbox',
    label: 'Triage inbox',
    detail: 'Process or snooze decision-needed and overdue items.',
  },
  {
    id: 'morning-blockers',
    label: 'Check blockers',
    detail: 'Update blocked_by, dependency, and next unblock step.',
  },
  {
    id: 'morning-start',
    label: 'Start first execution task',
    detail: 'Move one task from todo/backlog into in_progress.',
  },
]

const EVENING_ITEMS: ChecklistItem[] = [
  {
    id: 'evening-close',
    label: 'Close loop on today work',
    detail: 'Mark done, blocked, or next status for active tasks.',
  },
  {
    id: 'evening-capture',
    label: 'Capture loose inputs',
    detail: 'Move unresolved notes into Inbox or Unified Capture.',
  },
  {
    id: 'evening-tomorrow',
    label: 'Stage tomorrow top priorities',
    detail: 'Set due dates and priorities for the next session.',
  },
  {
    id: 'evening-handoff',
    label: 'Leave handoff note for agent',
    detail: 'State what should be reviewed in the next scheduled run.',
  },
]

function getViennaParts(date: Date): { year: number; month: number; day: number; hour: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
  }
}

function viennaDateKey(date: Date): string {
  const parts = getViennaParts(date)
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`
}

function defaultWindow(date: Date): DailyWindow {
  const parts = getViennaParts(date)
  return parts.hour < 14 ? 'morning' : 'evening'
}

function storageKeyForDay(date: Date): string {
  return `co_working_dashboard.daily_workflow.${viennaDateKey(date)}`
}

export default function DailyWorkflowPage() {
  const { data, createInboxItem } = useWorkspace()

  const [windowMode, setWindowMode] = useState<DailyWindow>(() => defaultWindow(new Date()))
  const [checks, setChecks] = useState<Record<DailyWindow, string[]>>({ morning: [], evening: [] })
  const [handoff, setHandoff] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const storageKey = useMemo(() => storageKeyForDay(new Date()), [])

  const todayTasks = data.tasks.filter((task) => task.status !== 'done')
  const dueToday = todayTasks.filter((task) => {
    if (!task.due_date) {
      return false
    }

    const due = getViennaParts(new Date(task.due_date))
    const current = getViennaParts(new Date())

    return due.year === current.year && due.month === current.month && due.day === current.day
  })
  const blockedCount = todayTasks.filter((task) => task.status === 'blocked').length

  const latestAgentRun = data.agentRuns
    .filter((run) => run.board === 'a')
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]

  const items = windowMode === 'morning' ? MORNING_ITEMS : EVENING_ITEMS

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as Record<DailyWindow, string[]>
      if (parsed && Array.isArray(parsed.morning) && Array.isArray(parsed.evening)) {
        setChecks(parsed)
      }
    } catch {
      // ignore malformed local state
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(checks))
  }, [checks, storageKey])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  function toggleCheck(itemId: string) {
    setChecks((current) => {
      const inWindow = current[windowMode]
      const nextWindow = inWindow.includes(itemId)
        ? inWindow.filter((value) => value !== itemId)
        : [...inWindow, itemId]

      return {
        ...current,
        [windowMode]: nextWindow,
      }
    })
  }

  function sendHandoffToInbox() {
    const normalized = handoff.trim()
    if (!normalized) {
      return
    }

    createInboxItem({
      board: 'a',
      type: 'agent_suggestion',
      title: 'Daily handoff note',
      body: normalized,
      source: 'David',
    })

    setHandoff('')
    setToast('Handoff note sent to Inbox')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#CBD4E1] bg-[#F8FBFF] p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#CBD4E1] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#506079]">
          <Sparkles className="h-3.5 w-3.5" />
          Board A - Daily Workflow
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#1A2433] sm:text-3xl">
          Morning and evening execution shell.
        </h1>
        <p className="mt-2 text-sm text-[#5E6B82]">
          Use this page as your operating ritual. The agent windows stay visible so handoffs are timed.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Due Today" value={dueToday.length} />
        <MetricCard label="Blocked" value={blockedCount} />
        <MetricCard label="Agent Windows" value={DAILY_WINDOWS.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWindowMode('morning')}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                windowMode === 'morning'
                  ? 'border-[#2453A6] bg-[#EEF3FA] text-[#1A2433]'
                  : 'border-[#CBD4E1] bg-white text-[#5E6B82] hover:bg-[#F8FBFF]'
              }`}
            >
              <SunMedium className="h-4 w-4" />
              Morning
            </button>
            <button
              onClick={() => setWindowMode('evening')}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                windowMode === 'evening'
                  ? 'border-[#2453A6] bg-[#EEF3FA] text-[#1A2433]'
                  : 'border-[#CBD4E1] bg-white text-[#5E6B82] hover:bg-[#F8FBFF]'
              }`}
            >
              <MoonStar className="h-4 w-4" />
              Evening
            </button>
          </div>

          <h2 className="text-base font-semibold text-[#1A2433]">
            {windowMode === 'morning' ? 'Morning Brief Checklist' : 'Evening Wrap Checklist'}
          </h2>
          <p className="mt-1 text-sm text-[#5E6B82]">
            {checks[windowMode].length}/{items.length} complete
          </p>

          <ul className="mt-3 space-y-2">
            {items.map((item) => {
              const checked = checks[windowMode].includes(item.id)
              return (
                <li
                  key={item.id}
                  className={`rounded-lg border px-3 py-2.5 ${
                    checked ? 'border-[#CBD4E1] bg-[#EEF3FA]' : 'border-[#D7E0EB] bg-[#F8FBFF]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        checked ? 'border-[#2453A6] bg-[#2453A6] text-white' : 'border-[#A8B5C8] bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span>
                      <p className="text-sm font-semibold text-[#1A2433]">{item.label}</p>
                      <p className="mt-0.5 text-xs text-[#5E6B82]">{item.detail}</p>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </article>

        <div className="space-y-6">
          <article className="rounded-2xl border border-[#CAD5E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#1A2433]">
              <Clock3 className="h-4 w-4 text-[#2453A6]" />
              Agent Windows (CET)
            </h2>
            <p className="mt-1 text-sm text-[#5E6B82]">{DAILY_WINDOWS.join(' · ')}</p>
            {latestAgentRun ? (
              <p className="mt-3 rounded-lg border border-[#CBD4E1] bg-[#EEF3FA] px-3 py-2 text-xs text-[#415069]">
                Last run: {formatDateTime(latestAgentRun.timestamp)} - {latestAgentRun.summary}
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-2 text-xs text-[#5E6B82]">
                No agent run yet today.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-[#CAD5E4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-[#1A2433]">Handoff Note</h2>
            <p className="mt-1 text-sm text-[#5E6B82]">
              Send context for the next agent run. This creates a Board A inbox item.
            </p>

            <textarea
              rows={4}
              value={handoff}
              onChange={(event) => setHandoff(event.target.value)}
              placeholder="What should the agent review next?"
              className="mt-3 w-full resize-none rounded-xl border border-[#CBD4E1] bg-[#F8FBFF] px-3 py-2.5 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendHandoffToInbox}
                className="rounded-lg bg-[#2453A6] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A4286]"
              >
                Send to Inbox
              </button>
              <Link
                href="/capture"
                className="inline-flex items-center gap-1 rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm font-semibold text-[#415069] hover:bg-[#EEF3FA]"
              >
                Open Capture
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-12 right-4 z-50 rounded-xl border border-[#CBD4E1] bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm font-medium text-[#1A2433]">{toast}</p>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#CBD4E1] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-[#5E6B82]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1A2433] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
    </div>
  )
}
