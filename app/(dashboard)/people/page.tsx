'use client'

import { useMemo } from 'react'
import { HeartHandshake, ListChecks, UserRound } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'

type Person = {
  id: 'girlfriend'
  name: string
  relationship: string
}

type Commitment = {
  id: string
  title: string
  dueDate: string | null
  status: 'todo' | 'in_progress' | 'done'
}

const PEOPLE: Person[] = [
  {
    id: 'girlfriend',
    name: 'Girlfriend',
    relationship: 'Partner',
  },
]

const FALLBACK_COMMITMENTS: Commitment[] = [
  {
    id: 'commitment_plan_week',
    title: 'Plan the week together on Sunday',
    dueDate: null,
    status: 'todo',
  },
  {
    id: 'commitment_household_sync',
    title: 'Sync household priorities before Wednesday',
    dueDate: null,
    status: 'in_progress',
  },
]

function isSharedWithPerson(personId: Person['id'], assignee: string): boolean {
  if (personId === 'girlfriend') {
    return assignee === 'girlfriend' || assignee === 'both'
  }

  return false
}

export default function PeoplePage() {
  const { data } = useWorkspace()

  const cards = useMemo(() => {
    return PEOPLE.map((person) => {
      const sharedTodos = data.sharedTodos.filter((todo) =>
        isSharedWithPerson(person.id, todo.assignee)
      )

      const commitments: Commitment[] =
        sharedTodos.length > 0
          ? sharedTodos.map((todo) => ({
              id: todo.id,
              title: todo.title,
              dueDate: todo.due_date,
              status: todo.status,
            }))
          : FALLBACK_COMMITMENTS

      return {
        person,
        sharedTodos,
        commitments,
      }
    })
  }, [data.sharedTodos])

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">People</h1>
        <p className="mt-1 text-sm text-[#7A6F65]">
          Workspace-level view of shared responsibilities and commitments.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {cards.map(({ person, sharedTodos, commitments }) => (
          <article key={person.id} className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F2] text-[#7A6F65]">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#1C1714]">{person.name}</h2>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7A6F65]">{person.relationship}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">
                {sharedTodos.length} shared todos
              </span>
            </header>

            <details className="group rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#1C1714]">
                <span className="inline-flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[#C8620A]" />
                  Shared todos
                </span>
                <span className="text-xs text-[#7A6F65] group-open:hidden">Expand</span>
                <span className="hidden text-xs text-[#7A6F65] group-open:inline">Collapse</span>
              </summary>
              <ul className="mt-3 space-y-2">
                {sharedTodos.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-[#E8E2D8] bg-white px-3 py-3 text-sm text-[#7A6F65]">
                    No shared todos assigned yet.
                  </li>
                ) : (
                  sharedTodos.map((todo) => (
                    <li key={todo.id} className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2.5">
                      <p className="text-sm font-medium text-[#1C1714]">{todo.title}</p>
                      <p className="mt-1 text-xs text-[#7A6F65]">
                        {todo.status.replace('_', ' ')}
                        {todo.due_date ? ` · Due ${formatDate(todo.due_date)}` : ' · No due date'}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </details>

            <details className="group mt-3 rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#1C1714]">
                <span className="inline-flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-[#C8620A]" />
                  Commitments
                </span>
                <span className="text-xs text-[#7A6F65] group-open:hidden">Expand</span>
                <span className="hidden text-xs text-[#7A6F65] group-open:inline">Collapse</span>
              </summary>
              <ul className="mt-3 space-y-2">
                {commitments.map((commitment) => (
                  <li key={commitment.id} className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2.5">
                    <p className="text-sm font-medium text-[#1C1714]">{commitment.title}</p>
                    <p className="mt-1 text-xs text-[#7A6F65]">
                      {commitment.status.replace('_', ' ')}
                      {commitment.dueDate ? ` · Due ${formatDate(commitment.dueDate)}` : ' · No due date'}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </section>
    </div>
  )
}
