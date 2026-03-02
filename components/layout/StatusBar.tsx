'use client'

import { usePathname } from 'next/navigation'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'

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
  const { data } = useWorkspace()
  const board = pathname.startsWith('/shared') ? 'b' : 'a'

  const active = data.tasks.filter((task) => task.status !== 'done').length
  const blocked = data.tasks.filter((task) => task.status === 'blocked').length
  const urgent = data.tasks.filter((task) => task.priority === 'urgent' && task.status !== 'done').length
  const unread = data.articles.filter((article) => article.status === 'unread').length
  const ideas = data.ideas.filter((idea) => idea.status !== 'shipped').length

  const sharedOpen = data.sharedTodos.filter((todo) => todo.status !== 'done').length
  const sharedInProgress = data.sharedTodos.filter((todo) => todo.status === 'in_progress').length
  const shoppingOpen = data.shoppingItems.filter((item) => !item.checked).length
  const today = new Date()
  const todayEvents = data.calendarEvents.filter(
    (event) => event.board === 'b' && sameUtcDate(new Date(event.start_at), today)
  ).length
  const sharedLogs = data.activities.filter(
    (entry) => entry.entity_type === 'shared_todo' || entry.entity_type === 'calendar' || entry.entity_type === 'shopping'
  ).length

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-10 hidden border-t border-[#d4c4a8] bg-[rgba(246,238,222,0.96)] backdrop-blur lg:flex ${sidebarCollapsed ? 'lg:left-14' : 'lg:left-72'}`}>
      {board === 'a' ? (
        <div className="flex h-9 items-center gap-5 px-6 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums lg:px-8">
          <span>
            <span className="font-semibold text-[#1a1208]">{active}</span> active
          </span>
          <span className={blocked > 0 ? 'text-red-700' : 'text-[#d4c4a8]'}>·</span>
          <span className={blocked > 0 ? 'text-red-700' : ''}>
            <span className={`font-semibold ${blocked > 0 ? 'text-red-700' : 'text-[#1a1208]'}`}>{blocked}</span>{' '}
            blocked
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{urgent}</span> urgent
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{ideas}</span> ideas
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{unread}</span> unread
          </span>
        </div>
      ) : (
        <div className="flex h-9 items-center gap-5 px-6 text-xs font-medium text-[#6b5c48] font-[family-name:var(--font-dashboard-mono)] tabular-nums lg:px-8">
          <span>
            <span className="font-semibold text-[#1a1208]">{sharedOpen}</span> open todos
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{sharedInProgress}</span> in progress
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{todayEvents}</span> events today
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{shoppingOpen}</span> shopping open
          </span>
          <span className="text-[#d4c4a8]">·</span>
          <span>
            <span className="font-semibold text-[#1a1208]">{sharedLogs}</span> shared logs
          </span>
        </div>
      )}
    </div>
  )
}
