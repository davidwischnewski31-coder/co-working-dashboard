'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ListChecks,
  Logs,
  ShoppingBasket,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDateTime } from '@/lib/utils'

const WEEKDAY_INDEX: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

function nextWeekdayFromNow(targetDay: number): Date {
  const now = new Date()
  const base = new Date(now)
  const diff = (targetDay - now.getDay() + 7) % 7
  base.setDate(base.getDate() + (diff === 0 ? 7 : diff))
  return base
}

function parseQuickInput(input: string):
  | { kind: 'shopping'; title: string; quantity?: string }
  | { kind: 'todo'; title: string }
  | { kind: 'event'; title: string; startAt: string; endAt: string }
  | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  // Explicit shopping keyword check
  if (/^(shop|shopping|buy):/i.test(trimmed) || /(buy|grocery|shopping)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/^(shop|shopping|buy):/i, '').replace(/\b(buy|grocery|shopping)\b/gi, '').trim()
    const quantityMatch = /^(\d+)\s+(.+)$/.exec(cleaned.trim() || trimmed.trim())
    if (quantityMatch) {
      return {
        kind: 'shopping',
        title: quantityMatch[2].trim(),
        quantity: quantityMatch[1],
      }
    }
    return { kind: 'shopping', title: cleaned || trimmed }
  }

  // "2 bananas" style — bare quantity + item routes to shopping
  const bareQuantityMatch = /^(\d+)\s+(.+)$/.exec(trimmed)
  if (bareQuantityMatch) {
    return {
      kind: 'shopping',
      title: bareQuantityMatch[2].trim(),
      quantity: bareQuantityMatch[1],
    }
  }

  const eventPipe = /^event:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})$/i.exec(
    trimmed
  )

  if (eventPipe) {
    const title = eventPipe[1].trim()
    const start = new Date(eventPipe[2].replace(' ', 'T'))
    const end = new Date(eventPipe[3].replace(' ', 'T'))

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return {
        kind: 'event',
        title,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }
    }
  }

  const weekdayMatch = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.exec(trimmed)
  const timeMatch = /(\d{1,2}:\d{2})/.exec(trimmed)

  if (weekdayMatch && timeMatch) {
    const weekday = WEEKDAY_INDEX[weekdayMatch[1].toLowerCase()]
    const [hourRaw, minuteRaw] = timeMatch[1].split(':')
    const hour = Number(hourRaw)
    const minute = Number(minuteRaw)

    const start = nextWeekdayFromNow(weekday)
    start.setHours(hour, minute, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)

    const title = trimmed
      .replace(weekdayMatch[0], '')
      .replace(timeMatch[0], '')
      .trim()

    return {
      kind: 'event',
      title: title || 'Shared event',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }
  }

  if (/^event:/i.test(trimmed)) {
    const title = trimmed.replace(/^event:/i, '').trim() || 'Shared event'
    const start = new Date()
    start.setHours(start.getHours() + 1, 0, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)

    return {
      kind: 'event',
      title,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }
  }

  if (/^todo:/i.test(trimmed)) {
    return { kind: 'todo', title: trimmed.replace(/^todo:/i, '').trim() || 'New shared todo' }
  }

  return { kind: 'todo', title: trimmed }
}

export default function SharedHubPage() {
  const { data, createSharedTodo, createCalendarEvent, createShoppingItem } = useWorkspace()

  const [quickInput, setQuickInput] = useState('')
  const [quickResult, setQuickResult] = useState<string | null>(null)
  const parsePreview = useMemo(() => {
    const parsed = parseQuickInput(quickInput)
    if (!parsed) return null

    if (parsed.kind === 'shopping') {
      const qty = 'quantity' in parsed && parsed.quantity ? `qty ${parsed.quantity}` : ''
      return `Shopping: ${parsed.title}${qty ? ` · ${qty}` : ''}`
    }

    if (parsed.kind === 'event') return `Event: ${parsed.title}`
    return `Todo: ${parsed.title}`
  }, [quickInput])

  const todos = data.sharedTodos
  const openTodos = todos.filter((todo) => todo.status !== 'done')
  const inProgress = todos.filter((todo) => todo.status === 'in_progress')

  const shopping = data.shoppingItems
  const shoppingOpen = shopping.filter((item) => !item.checked)

  const events = data.calendarEvents
    .filter((event) => event.board === 'b')
    .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime())

  const upcoming = events.slice(0, 5)
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEvents = events.filter((event) => {
    const start = new Date(event.start_at)
    return start >= now && start <= weekEnd
  })

  const dueSharedThisWeek = todos
    .filter((todo) => todo.status !== 'done' && todo.due_date && new Date(todo.due_date) >= now && new Date(todo.due_date) <= weekEnd)
    .sort((left, right) => new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime())

  const sharedLogCount = data.activities.filter(
    (entry) => entry.entity_type === 'shared_todo' || entry.entity_type === 'calendar' || entry.entity_type === 'shopping'
  ).length

  function handleQuickAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = parseQuickInput(quickInput)
    if (!parsed) {
      return
    }

    if (parsed.kind === 'todo') {
      createSharedTodo({
        title: parsed.title,
        assignee: 'both',
      })
      setQuickResult(`Added todo: ${parsed.title}`)
    }

    if (parsed.kind === 'event') {
      createCalendarEvent({
        board: 'b',
        title: parsed.title,
        start_at: parsed.startAt,
        end_at: parsed.endAt,
        created_by: 'David',
      })
      setQuickResult(`Added event: ${parsed.title}`)
    }

    if (parsed.kind === 'shopping') {
      createShoppingItem({
        title: parsed.title,
        category: 'groceries',
        created_by: 'David',
        quantity: parsed.quantity ?? '1',
      })
      setQuickResult(`Added shopping item: ${parsed.title}`)
    }

    setQuickInput('')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8D8BF] bg-[#FFF8EE] p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-[#3D2A18] sm:text-2xl">Shared Hub</h1>
        <p className="mt-1 text-sm text-[#7A644F]">
          Board B for you, your girlfriend, and the agent. Warm, shared, and practical.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Open Todos" value={openTodos.length} />
          <Metric label="In Progress" value={inProgress.length} />
          <Metric label="Upcoming Events" value={upcoming.length} />
          <Metric label="Shopping Left" value={shoppingOpen.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#3D2A18]">
          <WandSparkles className="h-4 w-4 text-[#C8620A]" />
          Quick Add
        </h2>
        <p className="mt-1 text-sm text-[#7A644F]">
          Type natural input like `Dinner Friday 19:00`, `buy tomatoes`, or `todo: call electrician`.
        </p>

        <form onSubmit={handleQuickAdd} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={quickInput}
            onChange={(event) => setQuickInput(event.target.value)}
            placeholder="Add todo/event/shopping in one line"
            className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8620A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
          >
            <Sparkles className="h-4 w-4" />
            Add
          </button>
        </form>

        {quickInput.trim() && parsePreview ? (
          <p className="mt-1.5 text-xs text-[#7A644F]">
            <span className="font-medium">Treating as:</span> {parsePreview}
          </p>
        ) : null}
        {quickResult ? <p className="mt-2 text-xs text-[#7A644F]">{quickResult}</p> : null}
      </section>

      <section className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#3D2A18]">This Week Together</h2>
          <span className="text-xs uppercase tracking-[0.12em] text-[#7A644F]">
            {formatDate(now)} - {formatDate(weekEnd)}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-[#E8D8BF] bg-[#FFF8EE] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Due shared todos</p>
              <Link href="/shared/todos" className="text-[11px] font-semibold text-[#C8620A] hover:underline">
                Open
              </Link>
            </div>
            {dueSharedThisWeek.length === 0 ? (
              <p className="text-sm text-[#7A644F]">No due shared todos this week.</p>
            ) : (
              <ul className="space-y-1.5">
                {dueSharedThisWeek.slice(0, 4).map((todo) => (
                  <li key={todo.id} className="rounded-md bg-white px-2.5 py-2">
                    <p className="text-sm font-medium text-[#3D2A18]">{todo.title}</p>
                    <p className="mt-1 text-[11px] text-[#7A644F]">
                      Due {todo.due_date ? formatDate(todo.due_date) : '-'} · {todo.assignee}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-xl border border-[#E8D8BF] bg-[#FFF8EE] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Upcoming events</p>
              <Link href="/shared/calendar" className="text-[11px] font-semibold text-[#C8620A] hover:underline">
                Open
              </Link>
            </div>
            {weekEvents.length === 0 ? (
              <p className="text-sm text-[#7A644F]">No calendar events in the next 7 days.</p>
            ) : (
              <ul className="space-y-1.5">
                {weekEvents.slice(0, 4).map((event) => (
                  <li key={event.id} className="rounded-md bg-white px-2.5 py-2">
                    <p className="text-sm font-medium text-[#3D2A18]">{event.title}</p>
                    <p className="mt-1 text-[11px] text-[#7A644F]">{formatDateTime(event.start_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-xl border border-[#E8D8BF] bg-[#FFF8EE] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Shopping pressure</p>
              <Link href="/shared/shopping" className="text-[11px] font-semibold text-[#C8620A] hover:underline">
                Open
              </Link>
            </div>
            {shoppingOpen.length === 0 ? (
              <p className="text-sm text-[#7A644F]">Shopping list is clear.</p>
            ) : (
              <ul className="space-y-1.5">
                {shoppingOpen.slice(0, 4).map((item) => (
                  <li key={item.id} className="rounded-md bg-white px-2.5 py-2">
                    <p className="text-sm font-medium text-[#3D2A18]">{item.title}</p>
                    <p className="mt-1 text-[11px] text-[#7A644F]">
                      {item.quantity ?? '1'} · {item.category}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#3D2A18]">
              <ListChecks className="h-4 w-4 text-[#C8620A]" />
              Shared Todos
            </h2>
            <Link href="/shared/todos" className="text-xs font-semibold text-[#C8620A] hover:underline">
              Manage
            </Link>
          </div>

          {openTodos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
              No open shared todos.
            </p>
          ) : (
            <ul className="space-y-2">
              {openTodos.slice(0, 5).map((todo) => (
                <li key={todo.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#3D2A18]">{todo.title}</p>
                  <p className="mt-1 text-[11px] text-[#7A644F]">
                    {todo.assignee} • {todo.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#3D2A18]">
              <CalendarDays className="h-4 w-4 text-[#C8620A]" />
              Calendar
            </h2>
            <Link href="/shared/calendar" className="text-xs font-semibold text-[#C8620A] hover:underline">
              Open
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
              No upcoming events.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((event) => (
                <li key={event.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#3D2A18]">{event.title}</p>
                  <p className="mt-1 text-[11px] text-[#7A644F]">{formatDateTime(event.start_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#3D2A18]">
              <ShoppingBasket className="h-4 w-4 text-[#C8620A]" />
              Shopping
            </h2>
            <Link href="/shared/shopping" className="text-xs font-semibold text-[#C8620A] hover:underline">
              Open
            </Link>
          </div>

          {shoppingOpen.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
              Shopping list clear.
            </p>
          ) : (
            <ul className="space-y-2">
              {shoppingOpen.slice(0, 5).map((item) => (
                <li key={item.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#3D2A18]">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#7A644F]">{item.quantity ?? '1'} • {item.category}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/shared/todos"
            className="inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
          >
            Open Shared Todos
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/shared/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8D8BF] bg-white px-4 py-2.5 text-sm font-semibold text-[#7A644F] transition-colors hover:bg-[#FFF8EE]"
          >
            Open Calendar
          </Link>
          <Link
            href="/shared/shopping"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8D8BF] bg-white px-4 py-2.5 text-sm font-semibold text-[#7A644F] transition-colors hover:bg-[#FFF8EE]"
          >
            Open Shopping List
          </Link>
          <Link href="/shared/log" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C8620A] hover:underline">
            <Logs className="h-4 w-4" />
            {sharedLogCount} shared updates logged
          </Link>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E8D8BF] bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[#7A644F]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#3D2A18]">{value}</p>
    </div>
  )
}
