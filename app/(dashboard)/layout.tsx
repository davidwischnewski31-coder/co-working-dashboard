'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { StatusBar } from '@/components/layout/StatusBar'
import { WorkspaceProvider, useWorkspace } from '@/components/providers/WorkspaceProvider'
import { CommandPalette, type CommandAction } from '@/components/variants/shared/CommandPalette'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { logNavigation } = useWorkspace()

  useEffect(() => {
    const stored = window.localStorage.getItem('co_working_dashboard.sidebar_collapsed')
    if (stored === '1') {
      setIsSidebarCollapsed(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('co_working_dashboard.sidebar_collapsed', isSidebarCollapsed ? '1' : '0')
  }, [isSidebarCollapsed])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!pathname || pathname === '/') {
      return
    }

    logNavigation(pathname)
  }, [logNavigation, pathname])

  const board = pathname.startsWith('/shared') ? 'b' : 'a'
  const isSidebarDesktopExpanded = !isSidebarCollapsed || isSidebarHovered

  const commandActions: CommandAction[] = useMemo(() => {
    const boardAActions: CommandAction[] = [
      { id: 'nav-overview', label: 'Go to Overview', keywords: ['home', 'summary'], run: () => router.push('/overview') },
      { id: 'nav-inbox', label: 'Go to Inbox', keywords: ['capture', 'intake'], run: () => router.push('/inbox') },
      { id: 'nav-decisions', label: 'Go to Decisions', keywords: ['journal', 'calls', 'processed'], run: () => router.push('/inbox?tab=decisions') },
      { id: 'nav-kanban', label: 'Go to Kanban', keywords: ['tasks', 'board', 'work'], run: () => router.push('/kanban') },
      { id: 'nav-ideas', label: 'Go to Ideas', keywords: ['pipeline', 'brainstorm'], run: () => router.push('/ideas') },
      { id: 'nav-reading', label: 'Go to Reading', keywords: ['articles', 'queue'], run: () => router.push('/reading') },
      { id: 'nav-weekly-review', label: 'Go to Weekly Review', keywords: ['ritual', 'review', 'weekly'], run: () => router.push('/weekly-review') },
    ]

    const boardBActions: CommandAction[] = [
      { id: 'nav-shared', label: 'Go to Shared Hub', keywords: ['home', 'shared'], run: () => router.push('/shared') },
      { id: 'nav-shared-todos', label: 'Go to Shared Todos', keywords: ['todo', 'household'], run: () => router.push('/shared/todos') },
      { id: 'nav-shared-calendar', label: 'Go to Shared Calendar', keywords: ['events', 'schedule'], run: () => router.push('/shared/calendar') },
      { id: 'nav-shared-shopping', label: 'Go to Shared Shopping', keywords: ['grocery', 'list', 'store'], run: () => router.push('/shared/shopping') },
      { id: 'nav-shared-log', label: 'Go to Shared Log', keywords: ['history', 'changes'], run: () => router.push('/shared/log') },
    ]

    const switchActions: CommandAction[] = [
      {
        id: 'switch-board-a',
        label: 'Switch to Board A',
        keywords: ['workspace', 'agent', 'execution'],
        run: () => router.push('/overview'),
      },
      {
        id: 'switch-board-b',
        label: 'Switch to Board B',
        keywords: ['workspace', 'shared', 'girlfriend'],
        run: () => router.push('/shared'),
      },
    ]

    return [...(board === 'a' ? boardAActions : boardBActions), ...switchActions]
  }, [board, router])

  if (pathname === '/') {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="variant-shell min-h-screen lg:flex">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        actions={commandActions}
        title="Co-Working"
        placeholder="Navigate, search, or run actions..."
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        isDesktopExpanded={isSidebarDesktopExpanded}
        onHoverChange={setIsSidebarHovered}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="variant-main flex min-h-screen min-w-0 flex-1 flex-col">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-12 sm:p-6 sm:pb-12 lg:p-8 lg:pb-12">{children}</main>
        <StatusBar sidebarCollapsed={!isSidebarDesktopExpanded} />
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  )
}
