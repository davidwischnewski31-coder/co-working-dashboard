'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { getDashboardTheme } from '@/lib/dashboardVariant'

interface HeaderProps {
  onOpenSidebar: () => void
}

function titleForPath(pathname: string): string {
  if (pathname === '/' || pathname === '/overview') return 'Overview'
  if (pathname.startsWith('/inbox')) return 'Inbox Hub'
  if (pathname.startsWith('/agent-log')) return 'Agent Log'
  if (pathname.startsWith('/kanban')) return 'Task Board'
  if (pathname.startsWith('/projects')) return 'Projects'
  if (pathname.startsWith('/ideas')) return 'Ideas'
  if (pathname.startsWith('/reading')) return 'Reading'
  if (pathname.startsWith('/activity')) return 'Activity'
  if (pathname === '/shared') return 'Shared Hub'
  if (pathname.startsWith('/shared/todos')) return 'Shared Todos'
  if (pathname.startsWith('/shared/calendar')) return 'Shared Calendar'
  if (pathname.startsWith('/shared/shopping')) return 'Shared Shopping'
  if (pathname.startsWith('/shared/log')) return 'Shared Log'
  if (pathname.startsWith('/experiments')) return 'UX Lab'
  return 'Dashboard'
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname()
  const theme = getDashboardTheme()
  const isMiddle = theme.id === 'middle'
  const board = pathname.startsWith('/shared') ? 'b' : 'a'
  const { resetToDemoData } = useWorkspace()
  const title = titleForPath(pathname)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const showBoardToggle = process.env.NODE_ENV === 'development'

  function handleReset() {
    if (!window.confirm('Reset demo data and lose your current workspace changes?')) {
      return
    }

    if (!window.confirm('This action cannot be undone. Continue?')) {
      return
    }

    const confirmation = window.prompt('Type RESET to confirm')
    if (confirmation !== 'RESET') {
      return
    }

    resetToDemoData()
  }

  return (
    <header className={`sticky top-0 z-20 border-b backdrop-blur ${board === 'a' ? 'border-[#E8E2D8] bg-[rgba(250,249,247,0.92)]' : 'border-[#E8D8BF] bg-[rgba(255,249,241,0.92)]'}`}>
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className={`rounded-lg border p-2 lg:hidden ${board === 'a' ? 'border-[#E8D8BF] bg-white text-[#7A644F]' : 'border-[#E8D8BF] bg-white text-[#7A644F]'}`}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-baseline gap-3">
            <h2 className={`text-lg font-semibold sm:text-xl ${board === 'a' ? 'text-[#3D2A18]' : 'text-[#3D2A18]'}`}>{title}</h2>
            <span className={`hidden text-xs uppercase tracking-[0.18em] sm:block ${board === 'a' ? 'text-[#7A644F]' : 'text-[#7A644F]'}`}>{today}</span>
            {!isMiddle && board === 'a' ? (
              <span className="hidden rounded-full border border-[#E8D8BF] bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A644F] sm:inline-flex">
                {theme.shortName}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showBoardToggle ? (
            <div className={`inline-flex rounded-lg border p-0.5 ${board === 'a' ? 'border-[#E8D8BF] bg-white' : 'border-[#E8D8BF] bg-white'}`}>
              <Link
                href="/overview"
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                  board === 'a' ? 'bg-[#C8620A] text-white' : 'text-[#7A644F] hover:bg-[#FFF8EE]'
                }`}
              >
                A
              </Link>
              <Link
                href="/shared"
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                  board === 'b' ? 'bg-[#C8620A] text-white' : 'text-[#7A644F] hover:bg-[#FFF8EE]'
                }`}
              >
                B
              </Link>
            </div>
          ) : null}

          <kbd className={`hidden items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium lg:inline-flex ${board === 'a' ? 'border-[#E8D8BF] bg-white text-[#7A644F]' : 'border-[#E8D8BF] bg-white text-[#7A644F]'}`}>
            <span className="text-[10px]">⌘</span>K
          </kbd>
          <button
            onClick={handleReset}
            className={`text-xs underline-offset-2 transition-colors hover:underline ${board === 'a' ? 'text-[#A18466] hover:text-[#7A644F]' : 'text-[#A18466] hover:text-[#7A644F]'}`}
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  )
}
