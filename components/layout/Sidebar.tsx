'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Activity,
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  Inbox,
  KanbanSquare,
  Lightbulb,
  ListChecks,
  PanelLeftClose,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react'
import { getDashboardTheme } from '@/lib/dashboardVariant'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  isDesktopExpanded: boolean
  onHoverChange: (isHovering: boolean) => void
  onToggleCollapse: () => void
}

type NavKey = 'overview' | 'kanban' | 'projects' | 'ideas' | 'reading' | 'activity'

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  key?: NavKey
  label?: string
}

const boardANavigation: NavItem[] = [
  { key: 'overview', href: '/overview', icon: Sparkles },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { key: 'kanban', href: '/kanban', icon: KanbanSquare },
  { key: 'projects', href: '/projects', icon: Briefcase },
  { key: 'ideas', href: '/ideas', icon: Lightbulb },
  { key: 'reading', href: '/reading', icon: BookOpen },
  { key: 'activity', href: '/activity', icon: Activity },
  { href: '/agent-log', icon: Bot, label: 'Agent Log' },
]

const boardBNavigation: NavItem[] = [
  { href: '/shared', icon: Sparkles, label: 'Shared Hub' },
  { href: '/shared/todos', icon: ListChecks, label: 'Todos' },
  { href: '/shared/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/shared/shopping', icon: ShoppingBasket, label: 'Shopping' },
  { href: '/shared/log', icon: History, label: 'Team Log' },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/overview') {
    return pathname === '/overview' || pathname === '/'
  }

  if (href === '/shared') {
    return pathname === '/shared'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  isDesktopExpanded,
  onHoverChange,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const theme = getDashboardTheme()
  const board = pathname.startsWith('/shared') ? 'b' : 'a'
  const navigation = board === 'a' ? boardANavigation : boardBNavigation
  const isIconOnlyDesktop = isCollapsed && !isDesktopExpanded

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
        onMouseEnter={() => {
          if (isCollapsed) {
            onHoverChange(true)
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed) {
            onHoverChange(false)
          }
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 p-4 shadow-xl backdrop-blur lg:static lg:z-auto lg:block lg:translate-x-0 lg:shadow-none',
          'transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isIconOnlyDesktop ? 'lg:w-14' : 'lg:w-72',
          board === 'a' ? 'border-r border-[#E8E2D8] bg-[rgba(250,249,247,0.94)]' : 'border-r border-[#E8D8BF] bg-[rgba(255,247,236,0.92)]'
        )}
      >
        <div className="mb-2 hidden justify-end lg:flex">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
              board === 'a'
                ? 'border-[#E8E2D8] bg-white text-[#7A644F] hover:bg-[#FFF8EE]'
                : 'border-[#E8D8BF] bg-white text-[#7A644F] hover:bg-[#FFF8EE]'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={cn('mb-6 flex items-start justify-between px-1', isIconOnlyDesktop ? 'lg:hidden' : '')}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.24em] text-[#7A6F65]">
              {board === 'a' ? 'Board A' : 'Board B'}
            </p>
            <h1 className="mt-1 text-sm font-semibold text-[#1C1714]">
              {board === 'a' ? 'Execution OS' : 'Shared Space'}
            </h1>
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
            const label = item.key ? theme.navLabels[item.key] : item.label

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                  isIconOnlyDesktop ? 'lg:justify-center lg:px-0' : '',
                  board === 'a'
                    ? active
                      ? 'border-[#E2C79B] bg-[#FFF1DA] text-[#5B3A1C]'
                      : 'border-transparent text-[#7A644F] hover:border-[#E8D8BF] hover:bg-[#FFF8EE]'
                    : active
                      ? 'border-[#E2C79B] bg-[#FFF1DA] text-[#5B3A1C]'
                      : 'border-transparent text-[#7A644F] hover:border-[#E8D8BF] hover:bg-[#FFF8EE]'
                )}
              >
                <item.icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-75')} />
                <span className={cn(isIconOnlyDesktop ? 'lg:hidden' : '')}>{label}</span>
                {isIconOnlyDesktop ? (
                  <span className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-[#D6CCC0] bg-white px-2 py-1 text-xs text-[#3D2A18] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 lg:block">
                    {label}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {board === 'a' && !isIconOnlyDesktop ? (
          <div className="mt-6 rounded-2xl border border-[#E8D8BF] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A644F]">Mode</p>
            <p className="mt-1 text-sm font-medium text-[#3D2A18]">{theme.modeLabel}</p>
            <p className="mt-2 text-xs text-[#7A644F]">{theme.modeDescription}</p>
          </div>
        ) : null}

        {board === 'b' && !isIconOnlyDesktop ? (
          <div className="mt-6 rounded-2xl border border-[#E8D8BF] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A644F]">Shared Rules</p>
            <p className="mt-1 text-sm font-medium text-[#3D2A18]">Full access for both of you</p>
            <p className="mt-2 text-xs text-[#7A644F]">
              Every shared todo, calendar, and shopping update is visible in Team Log.
            </p>
          </div>
        ) : null}
      </aside>
    </>
  )
}
