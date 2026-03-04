'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

type CalendarView = 'day' | 'week' | 'month' | 'agenda'

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function toInputDateTime(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date): Date {
  const base = startOfDay(date)
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(base, diff)
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function viewLabel(date: Date, view: CalendarView): string {
  if (view === 'day') {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (view === 'week') {
    const start = startOfWeek(date)
    const end = addDays(start, 6)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  if (view === 'agenda') {
    return `Agenda from ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function SharedCalendarPage() {
  const { data, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useWorkspace()

  const [view, setView] = useState<CalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [createdBy, setCreatedBy] = useState('David')
  const [startAt, setStartAt] = useState(() => toInputDateTime(new Date()))
  const [endAt, setEndAt] = useState(() => toInputDateTime(addDays(new Date(), 0)))
  const [editingId, setEditingId] = useState<string | null>(null)

  const events = useMemo(() => {
    return data.calendarEvents
      .filter((event) => event.board === 'b')
      .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime())
  }, [data.calendarEvents])

  const eventsByDay = useMemo(() => {
    return events.reduce<Record<string, typeof events>>((groups, event) => {
      const key = dayKey(new Date(event.start_at))
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
      return groups
    }, {})
  }, [events])

  const selectedDayEvents = useMemo(() => {
    return events.filter((event) => isSameDay(new Date(event.start_at), anchorDate))
  }, [anchorDate, events])

  const agendaEvents = useMemo(() => {
    const from = startOfDay(anchorDate).getTime()
    return events.filter((event) => new Date(event.start_at).getTime() >= from).slice(0, 30)
  }, [anchorDate, events])

  function resetForm(date = new Date()) {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setCreatedBy('David')
    setStartAt(toInputDateTime(date))
    setEndAt(toInputDateTime(addDays(date, 0)))
  }

  function moveWindow(direction: -1 | 1) {
    if (view === 'day') {
      setAnchorDate((current) => addDays(current, direction))
      return
    }

    if (view === 'week') {
      setAnchorDate((current) => addDays(current, direction * 7))
      return
    }

    if (view === 'agenda') {
      setAnchorDate((current) => addDays(current, direction * 7))
      return
    }

    setAnchorDate((current) => {
      const next = new Date(current)
      next.setMonth(next.getMonth() + direction)
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      return
    }

    const startIso = new Date(startAt).toISOString()
    const endIso = new Date(endAt).toISOString()

    if (editingId) {
      updateCalendarEvent(editingId, {
        title: normalizedTitle,
        description,
        start_at: startIso,
        end_at: endIso,
      })
    } else {
      createCalendarEvent({
        board: 'b',
        title: normalizedTitle,
        description,
        start_at: startIso,
        end_at: endIso,
        created_by: createdBy,
      })
    }

    resetForm(new Date(startIso))
  }

  function startEdit(eventId: string) {
    const target = events.find((item) => item.id === eventId)
    if (!target) {
      return
    }

    setEditingId(target.id)
    setTitle(target.title)
    setDescription(target.description ?? '')
    setCreatedBy(target.created_by)
    setStartAt(toInputDateTime(new Date(target.start_at)))
    setEndAt(toInputDateTime(new Date(target.end_at)))
  }

  function rescheduleToDay(eventId: string, day: Date) {
    const target = events.find((event) => event.id === eventId)
    if (!target) {
      return
    }

    const start = new Date(target.start_at)
    const end = new Date(target.end_at)
    const duration = end.getTime() - start.getTime()

    const nextStart = new Date(day)
    nextStart.setHours(start.getHours(), start.getMinutes(), 0, 0)
    const nextEnd = new Date(nextStart.getTime() + duration)

    updateCalendarEvent(eventId, {
      start_at: nextStart.toISOString(),
      end_at: nextEnd.toISOString(),
    })
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [anchorDate])

  const monthDays = useMemo(() => {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
    const gridStart = startOfWeek(monthStart)
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  }, [anchorDate])

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8D8BF] bg-[#FFF8EE] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#3D2A18] sm:text-2xl">Shared Calendar</h1>
            <p className="mt-1 text-sm text-[#7A644F]">Classic calendar workflow with drag-to-reschedule and agenda mode.</p>
          </div>

          <div className="inline-flex rounded-lg border border-[#E8D8BF] bg-white p-0.5">
            {(['day', 'week', 'month', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                  view === mode ? 'bg-[#C8620A] text-white' : 'text-[#7A644F] hover:bg-[#FFF8EE]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8D8BF] bg-white px-3 py-2">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => moveWindow(-1)}
              className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => moveWindow(1)}
              className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm font-semibold text-[#3D2A18]">{viewLabel(anchorDate, view)}</p>

          <button
            onClick={() => {
              setAnchorDate(new Date())
              resetForm(new Date())
            }}
            className="rounded-md border border-[#E8D8BF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
          >
            Today
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-4 shadow-sm">
          {view === 'month' ? (
            <div>
              <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                  <p key={label}>{label}</p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const key = dayKey(day)
                  const dayEvents = eventsByDay[key] ?? []
                  const isCurrentMonth = day.getMonth() === anchorDate.getMonth()
                  const active = isSameDay(day, anchorDate)

                  return (
                    <div
                      key={key}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const droppedId = event.dataTransfer.getData('event-id') || draggingEventId
                        if (droppedId) {
                          rescheduleToDay(droppedId, day)
                        }
                        setDraggingEventId(null)
                      }}
                      className={`min-h-28 rounded-lg p-2 transition-colors ${
                        active
                          ? 'border-2 border-[#C8620A] bg-white'
                          : isCurrentMonth
                            ? 'border border-[#E8D8BF] bg-white hover:bg-[#FFF8EE]'
                            : 'border border-[#F0EBE3] bg-[#FCFBF9] text-[#A9A094]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setAnchorDate(day)
                          setView('day')
                        }}
                        className={`text-xs font-semibold ${active ? 'text-[#C8620A]' : ''}`}
                      >
                        {day.getDate()}
                      </button>

                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            draggable
                            onDragStart={(dragEvent) => {
                              dragEvent.dataTransfer.setData('event-id', event.id)
                              setDraggingEventId(event.id)
                            }}
                            onClick={() => startEdit(event.id)}
                            className="flex w-full items-center gap-1 truncate rounded bg-[#F5EEDF] px-1.5 py-0.5 text-left text-[10px] text-[#7A644F]"
                          >
                            <GripVertical className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </button>
                        ))}
                        {dayEvents.length > 3 ? (
                          <p className="text-[10px] text-[#7A644F]">+{dayEvents.length - 3} more</p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {view === 'week' ? (
            <div className="grid gap-2 md:grid-cols-7">
              {weekDays.map((day) => {
                const key = dayKey(day)
                const dayEvents = eventsByDay[key] ?? []
                const active = isSameDay(day, anchorDate)
                return (
                  <div key={key} className={`rounded-lg border p-2 ${active ? 'border-[#C8620A] bg-[#FFF3E5]' : 'border-[#E8D8BF] bg-white'}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A644F]">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-[#3D2A18]">{day.getDate()}</p>
                    <div className="mt-2 space-y-1">
                      {dayEvents.length === 0 ? <p className="text-[11px] text-[#A9A094]">No events</p> : null}
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => {
                            setAnchorDate(day)
                            startEdit(event.id)
                          }}
                          className="w-full truncate rounded bg-[#FFF8EE] px-1.5 py-1 text-left text-[11px] text-[#7A644F]"
                        >
                          {new Date(event.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {event.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {view === 'day' ? (
            <div>
              <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#3D2A18]">
                <CalendarDays className="h-4 w-4 text-[#C8620A]" />
                {anchorDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <div className="mt-3 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
                    No events on this day.
                  </p>
                ) : (
                  selectedDayEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-[#3D2A18]">{event.title}</p>
                          <p className="mt-1 text-xs text-[#7A644F]">
                            {new Date(event.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(event.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {event.description ? <p className="mt-1 text-xs text-[#7A644F]">{event.description}</p> : null}
                          <p className="mt-1 text-[11px] text-[#9A8F82]">by {event.created_by}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(event.id)}
                            className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCalendarEvent(event.id)}
                            className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-red-300 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {view === 'agenda' ? (
            <div>
              <h2 className="text-base font-semibold text-[#3D2A18]">Agenda</h2>
              <p className="mt-1 text-sm text-[#7A644F]">Chronological list of upcoming events.</p>
              <div className="mt-3 space-y-2">
                {agendaEvents.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
                    No upcoming events.
                  </p>
                ) : (
                  agendaEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] p-3">
                      <p className="text-sm font-semibold text-[#3D2A18]">{event.title}</p>
                      <p className="mt-1 text-xs text-[#7A644F]">{formatDateTime(event.start_at)}</p>
                      {event.description ? <p className="mt-1 text-xs text-[#7A644F]">{event.description}</p> : null}
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => startEdit(event.id)}
                          className="rounded-md border border-[#E8D8BF] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] hover:border-[#C8620A] hover:text-[#C8620A]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCalendarEvent(event.id)}
                          className="rounded-md border border-[#E8D8BF] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] hover:border-red-300 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-[#3D2A18]">{editingId ? 'Edit Event' : 'Add Event'}</h2>
          <p className="mt-1 text-sm text-[#7A644F]">Use this panel for fast create/update.</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Event title"
                className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Created By</label>
              <select
                value={createdBy}
                onChange={(event) => setCreatedBy(event.target.value)}
                disabled={Boolean(editingId)}
                className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A] disabled:bg-[#FFF8EE]"
              >
                <option value="David">David</option>
                <option value="Girlfriend">Girlfriend</option>
                <option value="AI Partner">AI Partner</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Start</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">End</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Optional details"
                className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8620A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A04D06]"
              >
                <Plus className="h-3.5 w-3.5" />
                {editingId ? 'Save Event' : 'Add Event'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => resetForm(anchorDate)}
                  className="rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-4 rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] px-3 py-2 text-xs text-[#7A644F]">
            Tip: in month view, drag an event chip and drop it on another day to reschedule.
          </div>
        </article>
      </section>
    </div>
  )
}
