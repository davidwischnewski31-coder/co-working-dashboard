'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Activity,
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  History,
  Inbox,
  KanbanSquare,
  Lightbulb,
  LayoutGrid,
  ListChecks,
  PanelLeftClose,
  ShoppingBasket,
  Sparkles,
  NotebookPen,
  SunMoon,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
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
  { href: '/capture', icon: NotebookPen, label: 'Capture' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { key: 'kanban', href: '/kanban', icon: KanbanSquare },
  { key: 'projects', href: '/projects', icon: Briefcase },
  { key: 'ideas', href: '/ideas', icon: Lightbulb },
  { key: 'reading', href: '/reading', icon: BookOpen },
  { key: 'activity', href: '/activity', icon: Activity },
  { href: '/decisions', icon: ClipboardList, label: 'Decisions' },
  { href: '/daily', icon: SunMoon, label: 'Daily Workflow' },
  { href: '/weekly-review', icon: ClipboardCheck, label: 'Weekly Review' },
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
  const router = useRouter()
  const theme = getDashboardTheme()
  const { isAgentRunning } = useWorkspace()
  const board = pathname.startsWith('/shared') ? 'b' : 'a'
  const navigation = board === 'a' ? boardANavigation : boardBNavigation
  const isIconOnlyDesktop = isCollapsed && !isDesktopExpanded
  const [switcherOpen, setSwitcherOpen] = useState(false)

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

        <div className={cn('relative mb-6 px-1', isIconOnlyDesktop ? 'lg:hidden' : '')}>
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={() => setSwitcherOpen((v) => !v)}
              className="group flex w-full flex-col rounded-xl border border-[#E8D8BF] bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-[#FFF8EE]"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#7A6F65]">
                {board === 'a' ? 'Board A' : 'Board B'}
                <LayoutGrid className="ml-1.5 inline-block h-3 w-3 opacity-50 group-hover:opacity-100" />
              </p>
              <h1 className="mt-1 text-base font-semibold text-[#1C1714]">
                {board === 'a' ? 'Execution OS' : 'Life OS'}
              </h1>
              <p className="mt-1 text-[11px] text-[#7A6F65]">Switch board</p>
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-white/90 hover:bg-white/20 lg:hidden"
              aria-label="Close navigation"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>

          {switcherOpen ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#E8E2D8] bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    router.push('/overview')
                    setSwitcherOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FFF8EE]',
                    board === 'a' ? 'bg-[#FFF1DA]' : ''
                  )}
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#C8620A]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1C1714]">Board A</p>
                    <p className="text-xs text-[#7A6F65]">Execution OS</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push('/shared')
                    setSwitcherOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 border-t border-[#E8E2D8] px-4 py-3.5 text-left transition-colors hover:bg-[#FFF8EE]',
                    board === 'b' ? 'bg-[#FFF1DA]' : ''
                  )}
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#7A6F65]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1C1714]">Board B</p>
                    <p className="text-xs text-[#7A6F65]">Life OS</p>
                  </div>
                </button>
              </div>
            </>
          ) : null}
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
                <span className="relative inline-flex">
                  <item.icon className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-75')} />
                  {item.href === '/agent-log' && isAgentRunning ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  ) : null}
                </span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A644F]">Life OS</p>
            <p className="mt-1 text-sm font-medium text-[#3D2A18]">Shared space for two</p>
            <p className="mt-2 text-xs text-[#7A644F]">
              Every shared todo, calendar, and shopping update is visible in Team Log.
            </p>
          </div>
        ) : null}
      </aside>
    </>
  )
}
