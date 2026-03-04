'use client'

import { usePathname } from 'next/navigation'
import { Menu, RotateCcw } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { getDashboardTheme } from '@/lib/dashboardVariant'

interface HeaderProps {
  onOpenSidebar: () => void
}

function titleForPath(pathname: string): string {
  if (pathname === '/' || pathname === '/overview') return 'Overview'
  if (pathname.startsWith('/kanban')) return 'Task Board'
  if (pathname.startsWith('/projects')) return 'Projects'
  if (pathname.startsWith('/ideas')) return 'Ideas'
  if (pathname.startsWith('/reading')) return 'Reading'
  if (pathname.startsWith('/activity')) return 'Activity'
  if (pathname.startsWith('/experiments')) return 'UX Lab'
  return 'Dashboard'
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname()
  const theme = getDashboardTheme()
  const isMiddle = theme.id === 'middle'
  const { resetToDemoData } = useWorkspace()
  const title = titleForPath(pathname)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <header className="variant-header sticky top-0 z-20 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="variant-header-reset rounded-lg p-2 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{today}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
              {!isMiddle ? (
                <span className="variant-pill hidden rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex">
                  {theme.shortName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          onClick={resetToDemoData}
          className="variant-header-reset inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Demo Data
        </button>
      </div>
    </header>
  )
}
