'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Inbox, Plus, WandSparkles } from 'lucide-react'
import { DecisionJournalContent } from '@/components/dashboard/DecisionJournalContent'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { intentLabel, parseCaptureInput } from '@/lib/capture'
import type { InboxItemType, WorkspaceInboxItem } from '@/lib/workspace'
import { formatDateTime } from '@/lib/utils'

const LAST_CHECK_KEY = 'co_working_dashboard.inbox_last_checked'

type InboxTab = 'inbox' | 'decisions'

const TYPE_META: Record<
  InboxItemType,
  {
    label: string
    primaryAction: string
    secondaryAction: string
  }
> = {
  agent_suggestion: {
    label: 'Agent Suggestion',
    primaryAction: 'Accept',
    secondaryAction: 'Dismiss',
  },
  decision_needed: {
    label: 'Decision Needed',
    primaryAction: 'Act',
    secondaryAction: 'Snooze',
  },
  shared_update: {
    label: 'Shared Update',
    primaryAction: 'Accept',
    secondaryAction: 'Dismiss',
  },
  overdue_flag: {
    label: 'Overdue Flag',
    primaryAction: 'Act',
    secondaryAction: 'Dismiss',
  },
}

function relatedRouteForItem(item: WorkspaceInboxItem): { href: string; label: string } {
  if (item.type === 'decision_needed') {
    return { href: '/inbox?tab=decisions', label: 'Open Decisions' }
  }

  if (item.type === 'shared_update') {
    return { href: '/shared/log', label: 'Open Shared Log' }
  }

  if (item.type === 'overdue_flag') {
    return { href: '/kanban', label: 'Open Kanban' }
  }

  return { href: '/overview', label: 'Open Overview' }
}

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

function InboxPageContent() {
  const { data, createInboxItem, markInboxItemProcessed, createTask, createIdea, addArticle } = useWorkspace()
  const searchParams = useSearchParams()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<InboxItemType>('agent_suggestion')
  const [body, setBody] = useState('')
  const [source, setSource] = useState('David')
  const [captureInput, setCaptureInput] = useState('')
  const [captureResult, setCaptureResult] = useState<string | null>(null)
  const [focusedPendingIndex, setFocusedPendingIndex] = useState<number | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const [decisionDraft, setDecisionDraft] = useState<{ item: WorkspaceInboxItem; call: string } | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const activeTab: InboxTab = searchParams.get('tab') === 'decisions' ? 'decisions' : 'inbox'
  const parsedCapture = useMemo(() => parseCaptureInput(captureInput), [captureInput])
  const readingListId = data.readingLists[0]?.id

  const inboxItems = useMemo(
    () => (Array.isArray(data.inbox) ? data.inbox.filter((item) => item.board === 'a') : []),
    [data.inbox]
  )
  const pending = inboxItems.filter((item) => item.status === 'new')
  const processed = inboxItems.filter((item) => item.status === 'processed')

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_CHECK_KEY)
    if (stored) {
      setLastCheckedAt(stored)
      return
    }

    const now = new Date().toISOString()
    window.localStorage.setItem(LAST_CHECK_KEY, now)
    setLastCheckedAt(now)
  }, [])

  useEffect(() => {
    if (activeTab !== 'inbox') {
      return
    }

    if (pending.length === 0) {
      setFocusedPendingIndex(null)
      return
    }

    const focusId = searchParams.get('focus')
    if (focusId) {
      const index = pending.findIndex((item) => item.id === focusId)
      if (index >= 0) {
        setFocusedPendingIndex(index)
        return
      }
    }

    if (focusedPendingIndex === null || focusedPendingIndex >= pending.length) {
      setFocusedPendingIndex(0)
    }
  }, [activeTab, focusedPendingIndex, pending, searchParams])

  function touchLastChecked() {
    const now = new Date().toISOString()
    window.localStorage.setItem(LAST_CHECK_KEY, now)
    setLastCheckedAt(now)
  }

  function handlePrimaryAction(item: WorkspaceInboxItem) {
    if (item.type === 'decision_needed') {
      setDecisionDraft({ item, call: '' })
      return
    }

    if (item.type === 'overdue_flag') {
      createTask({
        title: `Resolve overdue: ${item.title}`,
        description: item.body ?? undefined,
        priority: 'urgent',
        owner_type: 'human',
        tags: ['inbox', 'overdue'],
      })
    } else {
      createTask({
        title: item.title,
        description: item.body ?? undefined,
        priority: 'medium',
        owner_type: 'human',
        tags: ['inbox', item.type],
      })
    }

    markInboxItemProcessed(item.id)
    touchLastChecked()
  }

  function handleSecondaryAction(itemId: string) {
    markInboxItemProcessed(itemId)
    touchLastChecked()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'inbox' || event.metaKey || event.ctrlKey || event.altKey || isTypingElement(event.target)) {
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
        handlePrimaryAction(current)
      }

      if (event.key === 'Escape') {
        setFocusedPendingIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, focusedPendingIndex, pending])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      return
    }

    createInboxItem({
      board: 'a',
      title: normalizedTitle,
      type,
      body: body.trim() || null,
      source: source.trim() || 'David',
    })

    setTitle('')
    setType('agent_suggestion')
    setBody('')
    setSource('David')
  }

  function handleCaptureSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = parseCaptureInput(captureInput)
    if (!parsed) {
      return
    }

    if (parsed.intent === 'task') {
      createTask({
        title: parsed.title,
        description: parsed.body,
        status: 'backlog',
        priority: 'medium',
        owner_type: 'human',
        tags: ['capture'],
      })
      setCaptureResult(`Captured task: ${parsed.title}`)
    }

    if (parsed.intent === 'idea') {
      createIdea({
        title: parsed.title,
        description: parsed.body,
        status: 'brainstorm',
        category: 'product',
        owner_type: 'human',
      })
      setCaptureResult(`Captured idea: ${parsed.title}`)
    }

    if (parsed.intent === 'decision') {
      createInboxItem({
        board: 'a',
        type: 'decision_needed',
        title: parsed.title,
        body: parsed.body ?? 'Captured in Inbox quick-add. Decide and convert to execution task.',
        source: 'David',
      })
      setCaptureResult(`Captured decision item: ${parsed.title}`)
    }

    if (parsed.intent === 'reading') {
      if (parsed.url && readingListId) {
        addArticle({
          reading_list_id: readingListId,
          url: parsed.url,
          title: parsed.title,
        })
        setCaptureResult(`Captured article: ${parsed.title}`)
      } else {
        createInboxItem({
          board: 'a',
          type: 'agent_suggestion',
          title: `Reading candidate: ${parsed.title}`,
          body: parsed.body ?? 'Missing URL. Add a link and move this into Reading.',
          source: 'David',
        })
        setCaptureResult(`Captured reading candidate in Inbox: ${parsed.title}`)
      }
    }

    if (parsed.intent === 'inbox') {
      createInboxItem({
        board: 'a',
        type: 'agent_suggestion',
        title: parsed.title,
        body: parsed.body ?? null,
        source: 'David',
      })
      setCaptureResult(`Captured inbox item: ${parsed.title}`)
    }

    setCaptureInput('')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8E2D8] bg-[rgba(250,249,247,0.94)] p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Inbox Hub</h1>
        <p className="mt-1 text-sm text-[#7A6F65]">
          Unified intake for execution. Quick capture stays visible while you triage or review decisions.
        </p>

        <form onSubmit={handleCaptureSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={captureInput}
            onChange={(event) => setCaptureInput(event.target.value)}
            placeholder="Quick add: task:, idea:, decision:, read:, inbox:"
            className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8620A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
          >
            <WandSparkles className="h-4 w-4" />
            Capture
          </button>
        </form>

        {parsedCapture ? (
          <p className="mt-2 text-xs text-[#7A6F65]">
            <span className="font-semibold">Will create:</span> {intentLabel(parsedCapture)}
          </p>
        ) : null}

        {captureResult ? (
          <p className="mt-3 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]">{captureResult}</p>
        ) : null}

        <div className="mt-4 inline-flex rounded-xl border border-[#E8E2D8] bg-white p-1">
          <Link
            href="/inbox"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'inbox' ? 'bg-[#FFF1DA] text-[#5B3A1C]' : 'text-[#7A6F65] hover:bg-[#FAFAF9]'
            }`}
          >
            Inbox
          </Link>
          <Link
            href="/inbox?tab=decisions"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'decisions' ? 'bg-[#FFF1DA] text-[#5B3A1C]' : 'text-[#7A6F65] hover:bg-[#FAFAF9]'
            }`}
          >
            Decisions
          </Link>
        </div>
      </section>

      {activeTab === 'decisions' ? (
        <DecisionJournalContent embedded />
      ) : (
        <>
          <div>
            <button
              type="button"
              onClick={() => setShowManualForm((value) => !value)}
              className="text-xs font-semibold text-[#7A6F65] transition-colors hover:text-[#1C1714]"
            >
              {showManualForm ? 'Hide manual form' : '+ Add item manually'}
            </button>
            {showManualForm ? (
              <section className="mt-3 rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-base font-semibold text-[#1C1714]">Add Inbox Item</h2>
                <p className="mt-1 text-sm text-[#7A6F65]">
                  One queue for agent suggestions, decisions, shared updates, and overdue flags.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 grid gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Title</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Capture a new inbox item"
                      className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
                      required
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Type</label>
                    <select
                      value={type}
                      onChange={(event) => setType(event.target.value as InboxItemType)}
                      className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
                    >
                      <option value="agent_suggestion">Agent suggestion</option>
                      <option value="decision_needed">Decision needed</option>
                      <option value="shared_update">Shared update</option>
                      <option value="overdue_flag">Overdue flag</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Source</label>
                    <input
                      value={source}
                      onChange={(event) => setSource(event.target.value)}
                      placeholder="Agent or person"
                      className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
                    />
                  </div>
                  <div className="lg:col-span-2 lg:self-end">
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8620A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A04D06]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                  <div className="lg:col-span-12">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Body</label>
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      rows={2}
                      placeholder="1-2 sentence context"
                      className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
                    />
                  </div>
                </form>
              </section>
            ) : null}
          </div>

          <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1C1714]">Pending</h2>
              <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">
                {pending.length}
              </span>
            </div>
            <p className="mb-3 text-[11px] text-[#7A6F65]">
              Keyboard: `j` / `k` to move, `Enter` to run primary action, `Esc` to clear focus.
            </p>

            {pending.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-8 text-center text-sm text-[#7A6F65]">
                <div className="mx-auto mb-2 inline-flex rounded-lg bg-white p-2 text-[#7A6F65]">
                  <Inbox className="h-4 w-4" />
                </div>
                <p className="font-medium text-[#1C1714]">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-[#7A6F65]">
                  Last checked {lastCheckedAt ? formatDateTime(lastCheckedAt) : 'just now'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {pending.map((item, index) => {
                  const meta = TYPE_META[item.type] ?? TYPE_META.agent_suggestion
                  const related = relatedRouteForItem(item)

                  return (
                    <li
                      key={item.id}
                      className={`rounded-lg border px-3 py-2.5 ${
                        focusedPendingIndex === index
                          ? 'bg-[#FAFAF9] ring-1 ring-[#E8E2D8]'
                          : 'bg-white hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#1C1714]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#7A6F65]">{item.body ?? 'No details.'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-semibold text-[#7A6F65]">
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-semibold text-[#7A6F65]">
                          {item.source}
                        </span>
                        <span className="text-[11px] text-[#7A6F65]">{formatDateTime(item.created_at)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => handlePrimaryAction(item)}
                          className="rounded-md bg-[#C8620A] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#A04D06]"
                          type="button"
                        >
                          {meta.primaryAction}
                        </button>
                        <button
                          onClick={() => handleSecondaryAction(item.id)}
                          className="rounded-md border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#D0C8BE]"
                          type="button"
                        >
                          {meta.secondaryAction}
                        </button>
                        <Link
                          href={related.href}
                          className="rounded-md border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                        >
                          {related.label}
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1C1714]">Processed</h2>
              <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">
                {processed.length}
              </span>
            </div>

            {processed.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
                No processed items yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {processed.slice(0, 12).map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                    <p className="text-sm font-medium text-[#1C1714]">{item.title}</p>
                    <p className="mt-1 text-[11px] text-[#7A6F65]">
                      Processed {item.processed_at ? formatDateTime(item.processed_at) : '-'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {decisionDraft ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/20"
            aria-label="Close"
            onClick={() => setDecisionDraft(null)}
          />
          <div className="fixed inset-x-4 top-24 z-40 mx-auto w-full max-w-lg rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Decision needed</p>
            <p className="mt-1 text-base font-semibold text-[#1C1714]">{decisionDraft.item.title}</p>
            {decisionDraft.item.body ? (
              <p className="mt-1 text-sm text-[#7A6F65]">{decisionDraft.item.body}</p>
            ) : null}
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">What&apos;s your call?</span>
              <input
                autoFocus
                value={decisionDraft.call}
                onChange={(event) =>
                  setDecisionDraft((current) =>
                    current ? { ...current, call: event.target.value } : null
                  )
                }
                placeholder="e.g. Go with option B - ship by Friday"
                className="mt-1 w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={!decisionDraft.call.trim()}
                onClick={() => {
                  createTask({
                    title: decisionDraft.call.trim(),
                    description: `Decision for: ${decisionDraft.item.title}`,
                    priority: 'high',
                    owner_type: 'human',
                    tags: ['inbox', 'decision'],
                  })
                  markInboxItemProcessed(decisionDraft.item.id)
                  touchLastChecked()
                  setDecisionDraft(null)
                }}
                className="rounded-lg bg-[#C8620A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create task
              </button>
              <button
                type="button"
                onClick={() => {
                  markInboxItemProcessed(decisionDraft.item.id)
                  touchLastChecked()
                  setDecisionDraft(null)
                }}
                className="rounded-lg border border-[#E8E2D8] px-3 py-2 text-sm font-medium text-[#7A6F65] hover:border-[#D0C8BE]"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => setDecisionDraft(null)}
                className="ml-auto text-sm text-[#7A6F65] hover:text-[#1C1714]"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#E8E2D8] bg-white p-5 text-sm text-[#7A6F65] shadow-sm">
          Loading inbox...
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  )
}
