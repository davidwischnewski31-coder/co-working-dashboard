'use client'

import { useEffect, useMemo, useState } from 'react'
import { Inbox, Link2, ListTodo, Mail, NotebookPen, Play, Plus, Scale } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { InboxItemType, InboxUrgency } from '@/lib/workspace'
import { formatDateTime } from '@/lib/utils'

const TYPE_META: Record<InboxItemType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  task: { label: 'Task', icon: ListTodo },
  link: { label: 'Link', icon: Link2 },
  note: { label: 'Note', icon: NotebookPen },
  email: { label: 'Email', icon: Mail },
  decision: { label: 'Decision', icon: Scale },
}

const URGENCY_META: Record<InboxUrgency, string> = {
  auto: 'Auto',
  now: 'Now',
  today: 'Today',
  week: 'This Week',
  later: 'Later',
}

const SCHEDULE = ['07:00', '12:00', '15:00', '17:00', '20:00']

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    Boolean(target.closest('[contenteditable="true"]'))
  )
}

export default function InboxPage() {
  const { data, createInboxItem, markInboxItemProcessed, runAgentSweep } = useWorkspace()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<InboxItemType>('task')
  const [urgency, setUrgency] = useState<InboxUrgency>('auto')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [focusedPendingIndex, setFocusedPendingIndex] = useState<number | null>(null)

  const inboxItems = useMemo(() => data.inbox.filter((item) => item.board === 'a'), [data.inbox])
  const pending = inboxItems.filter((item) => item.status === 'new')
  const processed = inboxItems.filter((item) => item.status === 'processed')

  const decisionPending = pending.filter((item) => item.type === 'decision').length
  const backlogCount = data.tasks.filter((task) => task.status === 'backlog').length

  useEffect(() => {
    if (pending.length === 0) {
      setFocusedPendingIndex(null)
      return
    }

    if (focusedPendingIndex === null || focusedPendingIndex >= pending.length) {
      setFocusedPendingIndex(0)
    }
  }, [focusedPendingIndex, pending.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingElement(event.target)) {
        return
      }

      if (event.key === 'j') {
        event.preventDefault()
        if (pending.length === 0) {
          return
        }
        setFocusedPendingIndex((current) => {
          if (current === null) {
            return 0
          }
          return Math.min(current + 1, pending.length - 1)
        })
      }

      if (event.key === 'k') {
        event.preventDefault()
        if (pending.length === 0) {
          return
        }
        setFocusedPendingIndex((current) => {
          if (current === null) {
            return 0
          }
          return Math.max(current - 1, 0)
        })
      }

      if (event.key === 'Enter' && focusedPendingIndex !== null) {
        const current = pending[focusedPendingIndex]
        if (!current) {
          return
        }
        event.preventDefault()
        markInboxItemProcessed(current.id)
      }

      if (event.key === 'Escape') {
        setFocusedPendingIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedPendingIndex, markInboxItemProcessed, pending])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    createInboxItem({
      board: 'a',
      title,
      type,
      urgency,
      source_url: sourceUrl,
      notes,
    })

    setTitle('')
    setType('task')
    setUrgency('auto')
    setSourceUrl('')
    setNotes('')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#CBD4E1] bg-[#F8FBFF] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A2433] sm:text-2xl">Inbox Hub</h1>
            <p className="mt-1 text-sm text-[#5E6B82]">
              Capture links, tasks, notes, emails, and decisions. Agent sweeps convert pending items to actionable backlog.
            </p>
          </div>
          <button
            onClick={() => runAgentSweep({ board: 'a', run_type: 'manual' })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2453A6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A4286]"
          >
            <Play className="h-4 w-4" />
            Run Agent Now
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Pending Inbox" value={pending.length} />
          <Metric label="Decisions Pending" value={decisionPending} />
          <Metric label="Backlog Tasks" value={backlogCount} />
          <Metric label="Processed" value={processed.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#1A2433]">Capture Item</h2>
        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6A7892]">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What should the agent process?"
              className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6A7892]">Type</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as InboxItemType)}
              className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
            >
              <option value="task">Task</option>
              <option value="decision">Decision</option>
              <option value="link">Link</option>
              <option value="note">Note</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6A7892]">Urgency</label>
            <select
              value={urgency}
              onChange={(event) => setUrgency(event.target.value as InboxUrgency)}
              className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
            >
              <option value="auto">Auto</option>
              <option value="now">Now</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="later">Later</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6A7892]">Source URL (optional)</label>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
            />
          </div>

          <div className="lg:col-span-12">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6A7892]">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Decision context, constraints, or what outcome you want"
              className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
            />
          </div>

          <div className="lg:col-span-12 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2453A6] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#1A4286]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Inbox
            </button>
            <p className="text-xs text-[#6A7892]">Agent schedule (CET): {SCHEDULE.join(' · ')}</p>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A2433]">Pending</h2>
            <span className="rounded-full bg-[#EEF3FA] px-2.5 py-1 text-xs font-semibold text-[#415069]">{pending.length}</span>
          </div>
          <p className="mb-3 text-[11px] text-[#6A7892]">Keyboard: `j` / `k` to move, `Enter` to process, `Esc` to clear focus.</p>

          {pending.length === 0 ? (
            <Empty text="No pending inbox items." />
          ) : (
            <ul className="space-y-2">
              {pending.map((item, index) => {
                const Icon = TYPE_META[item.type].icon
                return (
                  <li
                    key={item.id}
                    className={`rounded-lg border p-3 ${
                      focusedPendingIndex === index
                        ? 'ring-1 ring-[#E8E2D8] bg-[#FAFAF9]'
                        : item.type === 'decision'
                          ? 'border-[#E7D6AA] bg-[#FFF9E8]'
                          : 'border-[#D7E0EB] bg-[#F8FBFF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#5E6B82]">
                            <Icon className="h-3 w-3" />
                            {TYPE_META[item.type].label}
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#5E6B82]">
                            {URGENCY_META[item.urgency]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#1A2433]">{item.title}</p>
                        {item.source_url ? (
                          <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-[#2453A6] hover:underline">
                            {item.source_url}
                          </a>
                        ) : null}
                        {item.notes ? <p className="mt-1 text-xs text-[#5E6B82]">{item.notes}</p> : null}
                        <p className="mt-1 text-[11px] text-[#7B89A1]">{formatDateTime(item.created_at)}</p>
                      </div>
                      <button
                        onClick={() => markInboxItemProcessed(item.id)}
                        className="shrink-0 rounded-lg border border-[#CBD4E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#415069] transition-colors hover:border-[#2453A6] hover:text-[#2453A6]"
                      >
                        Mark done
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#CBD4E1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A2433]">Processed</h2>
            <span className="rounded-full bg-[#EEF3FA] px-2.5 py-1 text-xs font-semibold text-[#415069]">{processed.length}</span>
          </div>

          {processed.length === 0 ? (
            <Empty text="No processed items yet." />
          ) : (
            <ul className="space-y-2">
              {processed.slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] p-3">
                  <p className="text-sm font-medium text-[#1A2433]">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#7B89A1]">
                    Processed {item.processed_at ? formatDateTime(item.processed_at) : '-'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#CBD4E1] bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[#6A7892]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#1A2433]">{value}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-8 text-center text-sm text-[#6A7892]">
      <div className="mx-auto mb-2 inline-flex rounded-lg bg-white p-2 text-[#6A7892]">
        <Inbox className="h-4 w-4" />
      </div>
      <p>{text}</p>
      <p className="mt-1 text-xs text-[#7B89A1]">Captured items appear here.</p>
    </div>
  )
}
