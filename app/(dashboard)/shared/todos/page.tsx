'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Plus, Repeat, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { SharedTodoAssignee, SharedTodoRecurrence, SharedTodoStatus } from '@/lib/workspace'
import { formatDate } from '@/lib/utils'

const STATUS_ORDER: SharedTodoStatus[] = ['todo', 'in_progress', 'done']

const STATUS_META: Record<SharedTodoStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'border border-[#E8D8BF] bg-white' },
  in_progress: {
    label: 'In Progress',
    className: 'border border-[#E2C89E] bg-[#FFF6E7] border-l-[3px] border-l-[#C8620A]',
  },
  done: { label: 'Done', className: 'border border-[#E8D8BF] bg-[#FAFAF9] opacity-75' },
}

const RECURRENCE_LABEL: Record<SharedTodoRecurrence, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export default function SharedTodosPage() {
  const { data, isReady, createSharedTodo, updateSharedTodo, deleteSharedTodo } = useWorkspace()
  const hasRunRecurringResetRef = useRef(false)

  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState<SharedTodoAssignee>('both')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrence, setRecurrence] = useState<SharedTodoRecurrence>('none')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')
  const [resetCount, setResetCount] = useState(0)

  const todos = useMemo(() => {
    return [...data.sharedTodos].sort((left, right) => {
      if (left.status !== right.status) {
        return STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status)
      }

      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    })
  }, [data.sharedTodos])

  useEffect(() => {
    if (!isReady || hasRunRecurringResetRef.current) {
      return
    }

    hasRunRecurringResetRef.current = true

    const now = new Date()
    let count = 0
    for (const todo of data.sharedTodos) {
      if (
        todo.recurrence !== 'none' &&
        todo.status === 'done' &&
        todo.due_date &&
        new Date(todo.due_date) < now
      ) {
        const prev = new Date(todo.due_date)
        let next: Date

        if (todo.recurrence === 'daily') {
          next = new Date(prev)
          next.setDate(next.getDate() + 1)
        } else if (todo.recurrence === 'weekly') {
          next = new Date(prev)
          next.setDate(next.getDate() + 7)
        } else {
          next = new Date(prev)
          next.setMonth(next.getMonth() + 1)
        }

        if (todo.recurrence_end && next > new Date(todo.recurrence_end)) {
          continue
        }

        updateSharedTodo(todo.id, {
          status: 'todo',
          due_date: next.toISOString(),
        })
        count += 1
      }
    }

    if (count > 0) {
      setResetCount(count)
    }
  }, [data.sharedTodos, isReady, updateSharedTodo])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    createSharedTodo({
      title,
      assignee,
      due_date: dueDate ? new Date(`${dueDate}T09:00:00`).toISOString() : null,
      notes,
      recurrence,
      recurrence_end: recurrence !== 'none' && recurrenceEnd ? new Date(`${recurrenceEnd}T23:59:59`).toISOString() : null,
    })

    setTitle('')
    setAssignee('both')
    setDueDate('')
    setNotes('')
    setRecurrence('none')
    setRecurrenceEnd('')
  }

  return (
    <div className="space-y-6 variant-page">
      {resetCount > 0 ? (
        <section className="rounded-xl border border-[#E2C79B] bg-[#FFF6E7] px-4 py-3 text-sm text-[#7A644F]">
          <span className="font-semibold text-[#3D2A18]">
            {resetCount} recurring {resetCount === 1 ? 'todo' : 'todos'} reset
          </span>{' '}
          - new due dates applied. Check your To Do column.
          <button
            onClick={() => setResetCount(0)}
            className="ml-3 text-xs underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </section>
      ) : null}
      <section className="rounded-2xl border border-[#E8D8BF] bg-[#FFF8EE] p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-[#3D2A18] sm:text-2xl">Shared Todos</h1>
        <p className="mt-1 text-sm text-[#7A644F]">
          Shared list for both of you and the agent. Recurring tasks auto-generate the next occurrence when completed.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Todo</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add shared task"
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Assignee</label>
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value as SharedTodoAssignee)}
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            >
              <option value="both">Both</option>
              <option value="david">David</option>
              <option value="girlfriend">Girlfriend</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Repeat</label>
            <select
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value as SharedTodoRecurrence)}
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Notes</label>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            />
          </div>

          {recurrence !== 'none' ? (
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Repeat Until (optional)</label>
              <input
                type="date"
                value={recurrenceEnd}
                onChange={(event) => setRecurrenceEnd(event.target.value)}
                className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
              />
            </div>
          ) : null}

          <div className="lg:col-span-12">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8620A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A04D06]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Shared Todo
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const items = todos.filter((todo) => todo.status === status)
          return (
            <article
              key={status}
              className={`rounded-2xl border border-[#E8D8BF] bg-white p-4 shadow-sm ${status === 'done' ? 'opacity-80' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#3D2A18]">{STATUS_META[status].label}</h2>
                <span className="rounded-full bg-[#FFF8EE] px-2 py-0.5 text-xs font-semibold text-[#7A644F]">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
                  Empty
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((todo) => (
                    <li key={todo.id} className={`rounded-lg border p-3 ${STATUS_META[status].className}`}>
                      <p className="text-sm font-medium text-[#3D2A18]">{todo.title}</p>
                      <p className="mt-1 text-[11px] text-[#7A644F]">Assignee: {todo.assignee}</p>
                      {todo.due_date ? <p className="mt-1 text-[11px] text-[#7A644F]">Due {formatDate(todo.due_date)}</p> : null}
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#7A644F]">
                        <Repeat className="h-3 w-3" />
                        {RECURRENCE_LABEL[todo.recurrence]}
                      </p>
                      {todo.notes ? <p className="mt-1 text-xs text-[#7A644F]">{todo.notes}</p> : null}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {status !== 'todo' ? (
                          <button
                            onClick={() =>
                              updateSharedTodo(todo.id, {
                                status: status === 'done' ? 'in_progress' : 'todo',
                              })
                            }
                            className="rounded-md border border-[#E8D8BF] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                          >
                            Move Back
                          </button>
                        ) : null}
                        {status !== 'done' ? (
                          <button
                            onClick={() =>
                              updateSharedTodo(todo.id, {
                                status: status === 'todo' ? 'in_progress' : 'done',
                              })
                            }
                            className="rounded-md border border-[#E8D8BF] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                          >
                            {status === 'todo' ? 'Start' : 'Mark Done'}
                          </button>
                        ) : null}
                        <button
                          onClick={() => deleteSharedTodo(todo.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E8D8BF] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-red-300 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </section>

      {todos.length > 0 ? (
        <section className="rounded-2xl border border-[#E8D8BF] bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-2 text-sm text-[#7A644F]">
            <CheckCircle2 className="h-4 w-4 text-[#C8620A]" />
            {todos.filter((todo) => todo.status === 'done').length} of {todos.length} shared todos completed.
          </p>
        </section>
      ) : null}
    </div>
  )
}
