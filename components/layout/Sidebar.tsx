'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Activity,
  BookOpen,
  Briefcase,
  KanbanSquare,
  Lightbulb,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react'
import { getDashboardTheme } from '@/lib/dashboardVariant'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

type NavKey = 'overview' | 'kanban' | 'projects' | 'ideas' | 'reading' | 'activity'

const navigation: Array<{ key: NavKey; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'overview', href: '/overview', icon: Sparkles },
  { key: 'kanban', href: '/kanban', icon: KanbanSquare },
  { key: 'projects', href: '/projects', icon: Briefcase },
  { key: 'ideas', href: '/ideas', icon: Lightbulb },
  { key: 'reading', href: '/reading', icon: BookOpen },
  { key: 'activity', href: '/activity', icon: Activity },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/overview') {
    return pathname === '/overview' || pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const theme = getDashboardTheme()
  const isMiddle = theme.id === 'middle'

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/45 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'variant-sidebar fixed inset-y-0 left-0 z-40 w-72 p-4 shadow-xl backdrop-blur lg:static lg:z-auto lg:block lg:translate-x-0 lg:shadow-none',
          'transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="variant-sidebar-brand mb-6 flex items-center justify-between rounded-2xl p-4">
          <div>
            {!isMiddle ? <p className="text-xs uppercase tracking-[0.2em] opacity-80">{theme.shortName}</p> : null}
            <h1 className="text-lg font-semibold">Co-Working</h1>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-white/90 hover:bg-white/20 lg:hidden"
            aria-label="Close navigation"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const active = isActivePath(pathname, item.href)
            const label = theme.navLabels[item.key]

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'variant-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active && 'variant-nav-link-active'
                )}
              >
                <item.icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-75')} />
                {label}
              </Link>
            )
          })}
        </nav>

        {!isMiddle ? (
          <div className="variant-sidebar-mode mt-6 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mode</p>
            <p className="mt-1 text-sm font-medium">{theme.modeLabel}</p>
            <p className="mt-2 text-xs text-slate-500">{theme.modeDescription}</p>
          </div>
        ) : null}
      </aside>
    </>
  )
}
