'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Inbox, Lightbulb, ListTodo, Sparkles, WandSparkles } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

type CaptureIntent = 'task' | 'idea' | 'decision' | 'reading' | 'inbox'

type ParsedCapture = {
  intent: CaptureIntent
  title: string
  body?: string
  url?: string
}

function parseCaptureInput(input: string): ParsedCapture | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (/^task:/i.test(trimmed)) {
    const title = trimmed.replace(/^task:/i, '').trim()
    return { intent: 'task', title: title || 'New task' }
  }

  if (/^idea:/i.test(trimmed)) {
    const title = trimmed.replace(/^idea:/i, '').trim()
    return { intent: 'idea', title: title || 'New idea' }
  }

  if (/^decision:/i.test(trimmed)) {
    const title = trimmed.replace(/^decision:/i, '').trim()
    return { intent: 'decision', title: title || 'Decision needed' }
  }

  if (/^inbox:/i.test(trimmed)) {
    const title = trimmed.replace(/^inbox:/i, '').trim()
    return { intent: 'inbox', title: title || 'Inbox item' }
  }

  const directUrlMatch = /(https?:\/\/\S+)/i.exec(trimmed)
  if (/^read:/i.test(trimmed) || directUrlMatch) {
    const withoutPrefix = trimmed.replace(/^read:/i, '').trim()
    const urlMatch = /(https?:\/\/\S+)/i.exec(withoutPrefix || trimmed)
    const url = urlMatch?.[1]
    const title = (withoutPrefix || trimmed).replace(url ?? '', '').trim()

    return {
      intent: 'reading',
      title: title || 'Captured article',
      url,
      body: url ? undefined : 'No URL found. Stored in Inbox so you can complete it later.',
    }
  }

  return { intent: 'inbox', title: trimmed }
}

function intentLabel(parsed: ParsedCapture): string {
  if (parsed.intent === 'task') return `Task backlog item: ${parsed.title}`
  if (parsed.intent === 'idea') return `Idea pipeline item: ${parsed.title}`
  if (parsed.intent === 'decision') return `Decision needed inbox item: ${parsed.title}`
  if (parsed.intent === 'reading') {
    return parsed.url
      ? `Reading queue article: ${parsed.title}`
      : `Inbox follow-up for reading candidate: ${parsed.title}`
  }
  return `Inbox suggestion: ${parsed.title}`
}

const INTENT_META: Record<CaptureIntent, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  task: { label: 'Task', icon: ListTodo },
  idea: { label: 'Idea', icon: Lightbulb },
  decision: { label: 'Decision', icon: Sparkles },
  reading: { label: 'Reading', icon: BookOpen },
  inbox: { label: 'Inbox', icon: Inbox },
}

export default function CapturePage() {
  const { data, createTask, createIdea, createInboxItem, addArticle } = useWorkspace()

  const [input, setInput] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const parsed = useMemo(() => parseCaptureInput(input), [input])
  const readingListId = data.readingLists[0]?.id

  const recentCaptures = useMemo(() => {
    const captureEntities = new Set(['task', 'idea', 'inbox', 'article'])
    return data.activities
      .filter((entry) => captureEntities.has(entry.entity_type))
      .slice(0, 8)
  }, [data.activities])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const next = parseCaptureInput(input)
    if (!next) {
      return
    }

    if (next.intent === 'task') {
      createTask({
        title: next.title,
        description: next.body,
        status: 'backlog',
        priority: 'medium',
        owner_type: 'human',
        tags: ['capture'],
      })
      setResult(`Captured task: ${next.title}`)
    }

    if (next.intent === 'idea') {
      createIdea({
        title: next.title,
        description: next.body,
        status: 'brainstorm',
        category: 'product',
        owner_type: 'human',
      })
      setResult(`Captured idea: ${next.title}`)
    }

    if (next.intent === 'decision') {
      createInboxItem({
        board: 'a',
        type: 'decision_needed',
        title: next.title,
        body: next.body ?? 'Captured in Unified Capture. Decide and convert to execution task.',
        source: 'David',
      })
      setResult(`Captured decision item: ${next.title}`)
    }

    if (next.intent === 'reading') {
      if (next.url && readingListId) {
        addArticle({
          reading_list_id: readingListId,
          url: next.url,
          title: next.title,
        })
        setResult(`Captured article: ${next.title}`)
      } else {
        createInboxItem({
          board: 'a',
          type: 'agent_suggestion',
          title: `Reading candidate: ${next.title}`,
          body: next.body ?? 'Missing URL. Add a link and move this into Reading.',
          source: 'David',
        })
        setResult(`Captured reading candidate in Inbox: ${next.title}`)
      }
    }

    if (next.intent === 'inbox') {
      createInboxItem({
        board: 'a',
        type: 'agent_suggestion',
        title: next.title,
        body: next.body ?? null,
        source: 'David',
      })
      setResult(`Captured inbox item: ${next.title}`)
    }

    setInput('')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#CBD4E1] bg-[#F8FBFF] p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#CBD4E1] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#506079]">
          <WandSparkles className="h-3.5 w-3.5" />
          Board A - Unified Capture
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#1A2433] sm:text-3xl">
          One input, multiple destinations.
        </h1>
        <p className="mt-2 text-sm text-[#5E6B82]">
          Capture tasks, ideas, decisions, and reading links without deciding the final page first.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#1C1714]">Capture Input</h2>
        <p className="mt-1 text-sm text-[#7A6F65]">
          Examples: `task: ship pricing revamp`, `idea: async onboarding`, `decision: choose launch date`, `read: https://...`
        </p>

        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type once and route it"
            className="w-full rounded-lg border border-[#CBD4E1] bg-white px-3 py-2 text-sm text-[#1A2433] outline-none transition focus:border-[#2453A6]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2453A6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A4286]"
          >
            Capture
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {parsed ? (
          <p className="mt-2 text-xs text-[#5E6B82]">
            <span className="font-semibold">Will create:</span> {intentLabel(parsed)}
          </p>
        ) : null}

        {result ? (
          <p className="mt-3 rounded-lg border border-[#CBD4E1] bg-[#EEF3FA] px-3 py-2 text-sm text-[#1A2433]">
            {result}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-[#1C1714]">Routing Rules</h2>
          <ul className="mt-3 space-y-2">
            {(Object.keys(INTENT_META) as CaptureIntent[]).map((intent) => {
              const meta = INTENT_META[intent]
              const Icon = meta.icon
              return (
                <li key={intent} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C1714]">
                    <Icon className="h-4 w-4 text-[#2453A6]" />
                    {meta.label}
                  </p>
                  <p className="mt-1 text-xs text-[#7A6F65]">
                    Prefix with `{intent}:` to force this route.
                  </p>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/kanban" className="rounded-md border border-[#CBD4E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">
              Open Kanban
            </Link>
            <Link href="/ideas" className="rounded-md border border-[#CBD4E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">
              Open Ideas
            </Link>
            <Link href="/inbox" className="rounded-md border border-[#CBD4E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">
              Open Inbox
            </Link>
            <Link href="/reading" className="rounded-md border border-[#CBD4E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#415069] hover:border-[#2453A6] hover:text-[#2453A6]">
              Open Reading
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1C1714]">Recent Captures</h2>
            <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">
              {recentCaptures.length}
            </span>
          </div>

          {recentCaptures.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-4 text-sm text-[#7A6F65]">
              No capture activity yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentCaptures.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5">
                  <p className="text-sm text-[#1C1714]">{entry.message}</p>
                  <p className="mt-0.5 text-[11px] text-[#7A6F65]">{formatDateTime(entry.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}
