'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, BookOpen, Command, KanbanSquare, LayoutGrid, Search, Table2 } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { CommandPalette, type CommandAction } from '@/components/variants/shared/CommandPalette'
import { SparklineChart } from '@/components/variants/shared/SparklineChart'
import { getGlobalSparkline, getProjectSparkline, sortTasksByUrgency } from '@/components/variants/shared/variantData'
import { formatDateTime } from '@/lib/utils'

type LeftTab = 'kanban' | 'focus' | 'timeline'
type RightTopTab = 'projects' | 'reading' | 'metrics'
type BottomLeftTab = 'ideas' | 'backlog' | 'archive'
type BottomRightTab = 'activity' | 'notifications' | 'search'

export function CockpitDashboard() {
  const { data, moveTask, updateIdeaStatus, updateArticleStatus, createTask } = useWorkspace()

  const [leftTab, setLeftTab] = useState<LeftTab>('kanban')
  const [rightTopTab, setRightTopTab] = useState<RightTopTab>('projects')
  const [bottomLeftTab, setBottomLeftTab] = useState<BottomLeftTab>('ideas')
  const [bottomRightTab, setBottomRightTab] = useState<BottomRightTab>('activity')

  const [columnPercent, setColumnPercent] = useState(55)
  const [rowPercent, setRowPercent] = useState(58)
  const [dragging, setDragging] = useState<'col' | 'row' | null>(null)
  const [focusedPanel, setFocusedPanel] = useState<1 | 2 | 3 | 4>(1)
  const [cursorIndex, setCursorIndex] = useState(0)
  const [expandedFocusTaskId, setExpandedFocusTaskId] = useState<string | null>(null)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clockNow, setClockNow] = useState(() => new Date())

  const containerRef = useRef<HTMLDivElement | null>(null)

  const activeTasks = useMemo(() => data.tasks.filter((task) => task.status !== 'done'), [data.tasks])
  const focusTasks = useMemo(() => sortTasksByUrgency(activeTasks), [activeTasks])
  const overdueCount = useMemo(
    () => activeTasks.filter((task) => task.due_date && new Date(task.due_date).getTime() < Date.now()).length,
    [activeTasks]
  )

  const statusLine = useMemo(() => {
    const blocked = activeTasks.filter((task) => task.status === 'blocked').length
    const urgent = activeTasks.filter((task) => task.priority === 'urgent').length
    const unread = data.articles.filter((article) => article.status === 'unread').length
    return `Active ${activeTasks.length} | Blocked ${blocked} | Urgent ${urgent} | Ideas ${data.ideas.length} | Unread ${unread}`
  }, [activeTasks, data.articles, data.ideas.length])

  const globalTrend = useMemo(() => getGlobalSparkline(data), [data])

  const notifications = useMemo(() => {
    const blockedCount = activeTasks.filter((task) => task.status === 'blocked').length
    const unreadCount = data.articles.filter((article) => article.status === 'unread').length
    const half = Math.max(1, Math.floor(globalTrend.length / 2))
    const previous = globalTrend.slice(0, half).reduce((total, value) => total + value, 0)
    const current = globalTrend.slice(half).reduce((total, value) => total + value, 0)
    const velocity =
      current > previous ? 'Velocity improved vs previous window.' : current < previous ? 'Velocity dipped vs previous window.' : 'Velocity is flat.'

    return [
      `${blockedCount} blocker${blockedCount === 1 ? '' : 's'} need${blockedCount === 1 ? 's' : ''} attention.`,
      `${unreadCount} article${unreadCount === 1 ? '' : 's'} unread across reading lists.`,
      velocity,
    ]
  }, [activeTasks, data.articles, globalTrend])

  const paletteActions = useMemo<CommandAction[]>(() => {
    const taskActions: CommandAction[] = data.tasks.slice(0, 20).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      description: `Task · ${task.status}`,
      keywords: ['task', task.priority, task.status],
      run: () => {
        setLeftTab('focus')
        setFocusedPanel(1)
      },
    }))

    return [
      {
        id: 'new-task',
        label: 'Create task',
        description: 'Quick capture task',
        keywords: ['create', 'task'],
        run: () => {
          const title = window.prompt('Task title')?.trim()
          if (title) {
            createTask({ title, priority: 'medium', owner_type: 'human' })
          }
        },
      },
      {
        id: 'panel-kanban',
        label: 'Show Kanban panel',
        run: () => {
          setLeftTab('kanban')
          setFocusedPanel(1)
        },
      },
      {
        id: 'panel-projects',
        label: 'Show Projects panel',
        run: () => {
          setRightTopTab('projects')
          setFocusedPanel(2)
        },
      },
      ...taskActions,
    ]
  }, [createTask, data.tasks])

  useEffect(() => {
    if (!dragging) {
      return
    }

    const handleMove = (event: MouseEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect()
      if (!bounds) {
        return
      }

      if (dragging === 'col') {
        const ratio = ((event.clientX - bounds.left) / bounds.width) * 100
        setColumnPercent(Math.max(30, Math.min(70, ratio)))
      }

      if (dragging === 'row') {
        const ratio = ((event.clientY - bounds.top) / bounds.height) * 100
        setRowPercent(Math.max(35, Math.min(75, ratio)))
      }
    }

    const stop = () => setDragging(null)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stop)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stop)
    }
  }, [dragging])

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(new Date()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    setCursorIndex((index) => Math.min(Math.max(0, index), Math.max(0, focusTasks.length - 1)))
  }, [focusTasks.length])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((current) => !current)
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        setShowShortcutHelp((current) => !current)
        return
      }

      if (event.key === '/') {
        event.preventDefault()
        setBottomRightTab('search')
        setFocusedPanel(4)
        return
      }

      if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
        setFocusedPanel(Number(event.key) as 1 | 2 | 3 | 4)
        return
      }

      if (event.key.toLowerCase() === 'j' && focusedPanel === 1 && leftTab === 'focus') {
        event.preventDefault()
        setCursorIndex((index) => Math.min(index + 1, Math.max(0, focusTasks.length - 1)))
      }

      if (event.key.toLowerCase() === 'k' && focusedPanel === 1 && leftTab === 'focus') {
        event.preventDefault()
        setCursorIndex((index) => Math.max(0, index - 1))
      }

      if (event.key === 'Enter' && focusedPanel === 1 && leftTab === 'focus') {
        event.preventDefault()
        const target = focusTasks[cursorIndex]
        if (!target) return
        setExpandedFocusTaskId((current) => (current === target.id ? null : target.id))
      }

      if (event.key === 'Escape' && focusedPanel === 1 && leftTab === 'focus') {
        setExpandedFocusTaskId(null)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cursorIndex, focusTasks, focusedPanel, leftTab])

  const filteredSearchEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return []
    }

    const items = [
      ...data.tasks.map((task) => ({ id: task.id, label: task.title, meta: `Task · ${task.status}` })),
      ...data.projects.map((project) => ({ id: project.id, label: project.name, meta: `Project · ${project.status}` })),
      ...data.ideas.map((idea) => ({ id: idea.id, label: idea.title, meta: `Idea · ${idea.status}` })),
      ...data.articles.map((article) => ({ id: article.id, label: article.title, meta: `Article · ${article.status}` })),
    ]

    return items.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(q)).slice(0, 20)
  }, [data.articles, data.ideas, data.projects, data.tasks, searchQuery])

  return (
    <div className="h-screen overflow-hidden bg-[#0c0c0c] font-sans text-[#e0e0e0]">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        actions={paletteActions}
        title="The Cockpit"
        placeholder="Search records, panels, and commands..."
      />

      <header className="flex h-12 items-center justify-between border-b border-[#222] px-4 text-xs uppercase tracking-[0.12em] text-[#9e9e9e]">
        <p className="font-semibold text-[#f5a623]">The Cockpit</p>
        <div className="flex items-center gap-4">
          <span className="[font-family:var(--font-jetbrains-mono)]">
            {clockNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="[font-family:var(--font-jetbrains-mono)]">
            {clockNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => setPaletteOpen(true)} className="inline-flex items-center gap-1 rounded border border-[#2c2c2c] px-2 py-1 text-[10px]">
            <Command className="h-3 w-3" /> cmd+k
          </button>
        </div>
      </header>

      <div ref={containerRef} className="relative h-[calc(100vh-76px)] px-3 py-3">
        <div
          className="grid h-full gap-2"
          style={{
            gridTemplateColumns: `${columnPercent}% ${100 - columnPercent}%`,
            gridTemplateRows: `${rowPercent}% ${100 - rowPercent}%`,
          }}
        >
          <Panel title="Active Work" focused={focusedPanel === 1} icon={<KanbanSquare className="h-4 w-4" />} tabs={[
            { id: 'kanban', label: 'Kanban', active: leftTab === 'kanban', onClick: () => setLeftTab('kanban') },
            { id: 'focus', label: 'Focus', active: leftTab === 'focus', onClick: () => setLeftTab('focus') },
            { id: 'timeline', label: 'Timeline', active: leftTab === 'timeline', onClick: () => setLeftTab('timeline') },
          ]}>
            {leftTab === 'kanban' ? (
              <div className="grid h-full grid-cols-5 gap-2 text-xs">
                {(['backlog', 'todo', 'in_progress', 'blocked', 'done'] as const).map((status) => (
                  <div key={status} className="rounded bg-[#101010] p-2">
                    <p className="mb-2 uppercase tracking-[0.12em] text-[#888]">{status.replace('_', ' ')}</p>
                    <div className="space-y-2">
                      {data.tasks
                        .filter((task) => task.status === status)
                        .slice(0, 6)
                        .map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setCursorIndex(data.tasks.findIndex((item) => item.id === task.id))}
                            className="w-full rounded border border-[#252525] bg-[#141414] px-2 py-1 text-left"
                          >
                            <p className="truncate text-[11px] font-medium">{task.title}</p>
                            <p className="text-[10px] text-[#888]">{task.priority}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {leftTab === 'focus' ? (
              <div className="space-y-2 overflow-y-auto pr-1 text-sm">
                {focusTasks.map((task, index) => (
                  (() => {
                    const isExpanded = expandedFocusTaskId === task.id
                    return (
                      <div
                        key={task.id}
                        className={`rounded border px-3 py-2 ${index === cursorIndex ? 'border-[#f5a623] bg-[#1b1b1b]' : 'border-[#252525] bg-[#141414]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium">{task.title}</p>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">{task.priority}</span>
                        </div>

                        {isExpanded ? (
                          <>
                            <p className="mt-2 text-xs text-[#a8a8a8]">{task.description || 'No description yet.'}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]">
                              <button className="rounded border border-[#2f2f2f] px-2 py-1" onClick={() => moveTask(task.id, 'in_progress')}>
                                start
                              </button>
                              <button className="rounded border border-[#2f2f2f] px-2 py-1" onClick={() => moveTask(task.id, 'blocked')}>
                                block
                              </button>
                              <button className="rounded border border-[#2f2f2f] px-2 py-1" onClick={() => moveTask(task.id, 'done')}>
                                done
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )
                  })()
                ))}
              </div>
            ) : null}

            {leftTab === 'timeline' ? (
              <div className="space-y-1 overflow-y-auto pr-1 text-xs">
                {data.activities.map((entry) => (
                  <div key={entry.id} className="rounded border border-[#252525] bg-[#141414] px-2 py-2">
                    <p className="text-[10px] text-[#888]">{formatDateTime(entry.timestamp)}</p>
                    <p className="mt-1">{entry.message}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Projects + Stats" focused={focusedPanel === 2} icon={<LayoutGrid className="h-4 w-4" />} tabs={[
            { id: 'projects', label: 'Projects', active: rightTopTab === 'projects', onClick: () => setRightTopTab('projects') },
            { id: 'reading', label: 'Reading', active: rightTopTab === 'reading', onClick: () => setRightTopTab('reading') },
            { id: 'metrics', label: 'Metrics', active: rightTopTab === 'metrics', onClick: () => setRightTopTab('metrics') },
          ]}>
            {rightTopTab === 'projects' ? (
              <div className="space-y-2 overflow-y-auto pr-1">
                {data.projects.map((project) => (
                  <div key={project.id} className="rounded border border-[#252525] bg-[#141414] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{project.name}</p>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">{project.status}</span>
                    </div>
                    <SparklineChart points={getProjectSparkline(data, project.id)} stroke="#f5a623" className="mt-2 h-7 w-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {rightTopTab === 'reading' ? (
              <div className="space-y-2 overflow-y-auto pr-1">
                {data.articles.map((article) => (
                  <div key={article.id} className="rounded border border-[#252525] bg-[#141414] px-3 py-2 text-sm">
                    <p className="truncate font-medium">{article.title}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#999]">
                      <span>{article.status}</span>
                      <button
                        onClick={() => updateArticleStatus(article.id, article.status === 'unread' ? 'reading' : article.status === 'reading' ? 'read' : article.status === 'read' ? 'archived' : 'unread')}
                        className="rounded border border-[#2f2f2f] px-2 py-1 text-[#f5a623]"
                      >
                        cycle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {rightTopTab === 'metrics' ? (
              <div className="grid h-full gap-2 sm:grid-cols-2">
                <Metric label="Active" value={activeTasks.length} />
                <Metric label="Overdue" value={overdueCount} />
                <Metric label="Ideas Open" value={data.ideas.filter((idea) => idea.status !== 'shipped').length} />
                <Metric label="Unread" value={data.articles.filter((article) => article.status === 'unread').length} />
                <div className="sm:col-span-2 rounded border border-[#252525] bg-[#141414] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#888]">Velocity</p>
                  <SparklineChart points={globalTrend} stroke="#f5a623" className="mt-2 h-8 w-full" />
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Pipeline" focused={focusedPanel === 3} icon={<Table2 className="h-4 w-4" />} tabs={[
            { id: 'ideas', label: 'Ideas', active: bottomLeftTab === 'ideas', onClick: () => setBottomLeftTab('ideas') },
            { id: 'backlog', label: 'Backlog', active: bottomLeftTab === 'backlog', onClick: () => setBottomLeftTab('backlog') },
            { id: 'archive', label: 'Archive', active: bottomLeftTab === 'archive', onClick: () => setBottomLeftTab('archive') },
          ]}>
            {bottomLeftTab === 'ideas' ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#888]">
                    <th className="py-1">Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ideas.map((idea) => (
                    <tr key={idea.id} className="border-t border-[#242424]">
                      <td className="py-1.5">{idea.title}</td>
                      <td>{idea.category}</td>
                      <td>
                        <select
                          value={idea.status}
                          onChange={(event) => updateIdeaStatus(idea.id, event.target.value as typeof idea.status)}
                          className="rounded border border-[#2c2c2c] bg-[#101010] px-1 py-0.5 text-[11px]"
                        >
                          <option value="brainstorm">brainstorm</option>
                          <option value="research">research</option>
                          <option value="in_progress">in progress</option>
                          <option value="shipped">shipped</option>
                        </select>
                      </td>
                      <td>{idea.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {bottomLeftTab === 'backlog' ? (
              <div className="space-y-1 overflow-y-auto pr-1 text-xs">
                {data.tasks.filter((task) => task.status === 'backlog').map((task) => (
                  <div key={task.id} className="rounded border border-[#252525] bg-[#141414] px-2 py-2">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-[#888]">{task.priority}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {bottomLeftTab === 'archive' ? (
              <div className="space-y-1 overflow-y-auto pr-1 text-xs">
                {data.ideas
                  .filter((idea) => idea.status === 'shipped')
                  .map((idea) => (
                    <div key={idea.id} className="rounded border border-[#252525] bg-[#141414] px-2 py-2">
                      <p className="font-medium">{idea.title}</p>
                      <p className="text-[#888]">{idea.category}</p>
                    </div>
                  ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Feed" focused={focusedPanel === 4} icon={<Activity className="h-4 w-4" />} tabs={[
            { id: 'activity', label: 'Activity', active: bottomRightTab === 'activity', onClick: () => setBottomRightTab('activity') },
            { id: 'notifications', label: 'Notifications', active: bottomRightTab === 'notifications', onClick: () => setBottomRightTab('notifications') },
            { id: 'search', label: 'Search', active: bottomRightTab === 'search', onClick: () => setBottomRightTab('search') },
          ]}>
            {bottomRightTab === 'activity' ? (
              <div className="space-y-1 overflow-y-auto pr-1 text-xs">
                {data.activities.slice(0, 30).map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[64px_1fr] gap-2 rounded border border-[#242424] bg-[#141414] px-2 py-2">
                    <p className="[font-family:var(--font-jetbrains-mono)] text-[#888]">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="truncate">{entry.message}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {bottomRightTab === 'notifications' ? (
              <div className="space-y-2 text-xs">
                {notifications.map((message) => (
                  <div key={message} className="rounded border border-[#242424] bg-[#141414] px-3 py-2 [font-family:var(--font-jetbrains-mono)]">
                    {message}
                  </div>
                ))}
              </div>
            ) : null}

            {bottomRightTab === 'search' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded border border-[#2b2b2b] bg-[#101010] px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-[#888]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search tasks, projects, ideas, articles"
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </div>

                <div className="space-y-1 overflow-y-auto pr-1 text-xs">
                  {filteredSearchEntries.map((result) => (
                    <div key={result.id} className="rounded border border-[#242424] bg-[#141414] px-2 py-2">
                      <p className="font-medium">{result.label}</p>
                      <p className="text-[#888]">{result.meta}</p>
                    </div>
                  ))}
                  {searchQuery && filteredSearchEntries.length === 0 ? <p className="text-[#888]">No results.</p> : null}
                </div>
              </div>
            ) : null}
          </Panel>
        </div>

        <button
          onMouseDown={() => setDragging('col')}
          className="absolute top-3 bottom-3 z-20 w-2 cursor-col-resize bg-transparent"
          style={{ left: `calc(${columnPercent}% + 4px)` }}
          aria-label="Resize columns"
        />

        <button
          onMouseDown={() => setDragging('row')}
          className="absolute left-3 right-3 z-20 h-2 cursor-row-resize bg-transparent"
          style={{ top: `calc(${rowPercent}% + 4px)` }}
          aria-label="Resize rows"
        />
      </div>

      <footer className="flex h-7 items-center justify-between border-t border-[#222] bg-[#111] px-4 text-[10px] uppercase tracking-[0.14em] text-[#9e9e9e]">
        <p className="[font-family:var(--font-jetbrains-mono)]">{statusLine}</p>
        <div className="flex items-center gap-3">
          <span>Panel {focusedPanel}</span>
          <button onClick={() => setShowShortcutHelp((current) => !current)} className="text-[#f5a623]">shortcuts ?</button>
        </div>
      </footer>

      {showShortcutHelp ? (
        <div className="fixed right-3 top-14 z-[120] w-72 rounded border border-[#2b2b2b] bg-[#0f0f0f] p-3 text-xs text-[#dadada] shadow-2xl">
          <p className="mb-2 font-semibold text-[#f5a623]">Keyboard</p>
          <ul className="space-y-1 text-[#b6b6b6]">
            <li>1-4 focus panel</li>
            <li>j / k move selection</li>
            <li>Enter expand focused task</li>
            <li>Escape collapse task</li>
            <li>/ open search panel</li>
            <li>cmd+k command palette</li>
            <li>? toggle shortcuts</li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Panel({
  title,
  icon,
  tabs,
  focused,
  children,
}: {
  title: string
  icon: React.ReactNode
  tabs: Array<{ id: string; label: string; active: boolean; onClick: () => void }>
  focused: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={`min-h-0 overflow-hidden rounded border ${
        focused ? 'border-[#f5a623] shadow-[inset_0_0_0_1px_rgba(245,166,35,0.2)]' : 'border-[#222]'
      } bg-[#141414]`}
    >
      <header className="flex items-center justify-between border-b border-[#222] px-3 py-2">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#9e9e9e]">
          {icon}
          <span>{title}</span>
        </div>
        <div className="inline-flex items-center gap-1 rounded border border-[#242424] bg-[#101010] p-1 text-[10px] uppercase tracking-[0.12em]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`rounded px-2 py-1 ${tab.active ? 'bg-[#f5a623] text-black' : 'text-[#aaa] hover:bg-[#1d1d1d]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>
      <div className="h-[calc(100%-43px)] overflow-hidden p-2">{children}</div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#252525] bg-[#141414] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#888]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#f2f2f2] tabular-nums [font-family:var(--font-jetbrains-mono)]">{value}</p>
    </div>
  )
}
