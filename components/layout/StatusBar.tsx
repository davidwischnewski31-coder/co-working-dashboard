'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'

type FocusPanel = 'blocked' | 'urgent' | null

interface StatusBarProps {
  sidebarCollapsed?: boolean
}

function sameUtcDate(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  )
}

export function StatusBar({ sidebarCollapsed = false }: StatusBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, moveTask, updateTask } = useWorkspace()
  const board = pathname.startsWith('/shared') ? 'b' : 'a'

  const active = data.tasks.filter((task) => task.status !== 'done').length
  const blockedTasks = data.tasks.filter((task) => task.status === 'blocked')
  const urgentTasks = data.tasks.filter((task) => task.priority === 'urgent' && task.status !== 'done')
  const unreadInbox = data.inbox.filter((item) => item.board === 'a' && item.status === 'new')
  const ideas = data.ideas.filter((idea) => idea.status !== 'shipped' && idea.status !== 'archived').length

  const sharedOpen = data.sharedTodos.filter((todo) => todo.status !== 'done').length
  const sharedInProgress = data.sharedTodos.filter((todo) => todo.status === 'in_progress').length
  const shoppingOpen = data.shoppingItems.filter((item) => !item.checked).length
  const today = new Date()
  const todayEvents = data.calendarEvents.filter(
    (event) => event.board === 'b' && sameUtcDate(new Date(event.start_at), today)
  ).length
  const sharedLogs = data.activities.filter(
    (entry) =>
      entry.entity_type === 'shared_todo' || entry.entity_type === 'calendar' || entry.entity_type === 'shopping'
  ).length

  const [panel, setPanel] = useState<FocusPanel>(null)

  useEffect(() => {
    setPanel(null)
  }, [pathname])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const panelTasks = useMemo(() => {
    if (panel === 'blocked') {
      return blockedTasks
    }

    if (panel === 'urgent') {
      return urgentTasks
    }

    return []
  }, [blockedTasks, panel, urgentTasks])

  const shellLeftClass = sidebarCollapsed ? 'lg:left-14' : 'lg:left-72'

  return (
    <>
      {board === 'a' && panel ? (
        <>
          <button
            aria-label="Close focus panel"
            onClick={() => setPanel(null)}
            className="fixed inset-0 z-20 hidden bg-black/10 lg:block"
            type="button"
          />
          <section
            className={`fixed bottom-9 right-0 z-30 hidden border border-[#d4c4a8] bg-[#FFFDF8] shadow-xl lg:block ${shellLeftClass}`}
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D8] px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b5c48]">
                {panel === 'blocked' ? 'Blocked Tasks' : 'Urgent Tasks'}
              </h3>
              <button
                onClick={() => setPanel(null)}
                type="button"
                className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
              >
                Close
              </button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto px-4 py-3">
              {panelTasks.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#E8E2D8] bg-white px-3 py-4 text-sm text-[#7A644F]">
                  No tasks in this focus group.
                </p>
              ) : (
                <ul className="space-y-2">
                  {panelTasks.map((task) => (
                    <li key={task.id} className="rounded-lg border border-[#E8E2D8] bg-white p-3">
                      <p className="text-sm font-semibold text-[#1a1208]">{task.title}</p>
                      <p className="mt-1 text-xs text-[#7A644F]">
                        {task.owner} · {task.priority}
                        {task.due_date ? ` · Due ${formatDate(task.due_date)}` : ''}
                      </p>
                      {panel === 'blocked' ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => moveTask(task.id, 'todo')}
                            type="button"
                            className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
                          >
                            Unblock
                          </button>
                          <button
                            onClick={() =>
                              updateTask(task.id, {
                                owner_type: task.owner_type === 'human' ? 'agent' : 'human',
                              })
                            }
                            type="button"
                            className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => moveTask(task.id, 'done')}
                            type="button"
                            className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
                          >
                            Archive
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => moveTask(task.id, 'in_progress')}
                            type="button"
                            className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => moveTask(task.id, 'done')}
                            type="button"
                            className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A644F]"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : null}

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 hidden border-t border-[#d4c4a8] bg-[rgba(246,238,222,0.96)] backdrop-blur lg:flex ${shellLeftClass}`}
      >
        {board === 'a' ? (
          <div className="flex h-9 items-center gap-3 px-4 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums lg:px-8">
            <button
              onClick={() => router.push('/kanban')}
              className="rounded px-1.5 py-0.5 hover:bg-white/70"
              type="button"
            >
              <span className="font-semibold text-[#1a1208]">{active}</span> active
            </button>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <button
              onClick={() => setPanel('blocked')}
              className={`rounded px-1.5 py-0.5 hover:bg-white/70 ${blockedTasks.length > 0 ? 'text-red-700' : ''}`}
              type="button"
            >
              <span
                className={`font-semibold ${blockedTasks.length > 0 ? 'text-red-700' : 'text-[#1a1208]'}`}
              >
                {blockedTasks.length}
              </span>{' '}
              blocked
            </button>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <button
              onClick={() => setPanel('urgent')}
              className="rounded px-1.5 py-0.5 hover:bg-white/70"
              type="button"
            >
              <span className="font-semibold text-[#1a1208]">{urgentTasks.length}</span> urgent
            </button>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <button
              onClick={() => router.push('/ideas')}
              className="rounded px-1.5 py-0.5 hover:bg-white/70"
              type="button"
            >
              <span className="font-semibold text-[#1a1208]">{ideas}</span> ideas
            </button>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <button
              onClick={() => {
                const first = unreadInbox[0]
                if (!first) {
                  router.push('/inbox')
                  return
                }
                router.push(`/inbox?focus=${first.id}`)
              }}
              className="rounded px-1.5 py-0.5 hover:bg-white/70"
              type="button"
            >
              <span className="font-semibold text-[#1a1208]">{unreadInbox.length}</span> unread
            </button>
          </div>
        ) : (
          <div className="flex h-9 items-center gap-5 px-6 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums lg:px-8">
            <span>
              <span className="font-semibold text-[#1a1208]">{sharedOpen}</span> open todos
            </span>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <span>
              <span className="font-semibold text-[#1a1208]">{sharedInProgress}</span> in progress
            </span>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <span>
              <span className="font-semibold text-[#1a1208]">{todayEvents}</span> events today
            </span>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <span>
              <span className="font-semibold text-[#1a1208]">{shoppingOpen}</span> shopping open
            </span>
            <span className="h-3 w-px self-center bg-[#d4c4a8]" aria-hidden />
            <span>
              <span className="font-semibold text-[#1a1208]">{sharedLogs}</span> shared logs
            </span>
          </div>
        )}
      </div>
    </>
  )
}
