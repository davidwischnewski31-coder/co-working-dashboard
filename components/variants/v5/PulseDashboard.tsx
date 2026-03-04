'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Clock3, X } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { MomentumScore } from '@/components/variants/shared/MomentumScore'
import { getIdeaNextStatus, getMostUrgentTask, sortTasksByUrgency, summarizeMorningBrief } from '@/components/variants/shared/variantData'
import type { WorkspaceProject, WorkspaceTask } from '@/lib/workspace'
import { formatDateTime } from '@/lib/utils'

type FeedCard =
  | { id: string; type: 'pulse' }
  | { id: string; type: 'task'; taskId: string }
  | { id: string; type: 'blocked'; taskId: string }
  | { id: string; type: 'idea'; ideaId: string }
  | { id: string; type: 'reading' }
  | { id: string; type: 'project'; projectId: string }
  | { id: string; type: 'activity' }
  | { id: string; type: 'done' }

function statusLabel(card: FeedCard['type']): string {
  if (card === 'pulse') return 'Daily pulse'
  if (card === 'task') return 'Urgent task'
  if (card === 'blocked') return 'Blocked item'
  if (card === 'idea') return 'Top idea'
  if (card === 'reading') return 'Reading batch'
  if (card === 'project') return 'Project health'
  if (card === 'activity') return 'Activity recap'
  return 'Caught up'
}

function cardSurface(card: FeedCard['type']): string {
  if (card === 'pulse') return 'bg-[#0c1222] text-[#f9f3e9]'
  if (card === 'task') return 'bg-[#fff8f0] text-[#1c1713]'
  if (card === 'blocked') return 'bg-[#f5e6e0] text-[#4a2222]'
  if (card === 'idea') return 'bg-[#eeeaf5] text-[#2f2352]'
  if (card === 'reading') return 'bg-[#edf2ed] text-[#2d4a2d]'
  if (card === 'project') return 'bg-[#f0ebe0] text-[#3d3328]'
  if (card === 'activity') return 'bg-[#f0f1f3] text-[#1f2937]'
  return 'bg-[#000000] text-white'
}

function dotTone(card: FeedCard['type']): 'action' | 'info' {
  if (card === 'task' || card === 'blocked' || card === 'idea') return 'action'
  return 'info'
}

function buildCards(tasks: WorkspaceTask[], projects: WorkspaceProject[], hasIdea: boolean, hasUnread: boolean): FeedCard[] {
  const cards: FeedCard[] = [{ id: 'card-pulse', type: 'pulse' }]

  const urgent = tasks.filter((task) => task.priority === 'urgent').slice(0, 3)
  const urgentIds = new Set(urgent.map((task) => task.id))

  for (const task of urgent) {
    cards.push({ id: `card-task-${task.id}`, type: 'task', taskId: task.id })
  }

  for (const blockedTask of tasks.filter((task) => task.status === 'blocked')) {
    if (urgentIds.has(blockedTask.id)) continue
    cards.push({ id: `card-blocked-${blockedTask.id}`, type: 'blocked', taskId: blockedTask.id })
  }

  if (hasIdea) {
    cards.push({ id: 'card-idea', type: 'idea', ideaId: 'top' })
  }

  if (hasUnread) {
    cards.push({ id: 'card-reading', type: 'reading' })
  }

  for (const project of projects) {
    cards.push({ id: `card-project-${project.id}`, type: 'project', projectId: project.id })
  }

  cards.push({ id: 'card-activity', type: 'activity' })
  cards.push({ id: 'card-done', type: 'done' })

  return cards
}

export function PulseDashboard() {
  const {
    data,
    createTask,
    moveTask,
    updateIdeaStatus,
    updateArticleStatus,
  } = useWorkspace()

  const [index, setIndex] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [search, setSearch] = useState('')
  const [cardOrder, setCardOrder] = useState<string[]>([])
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward')
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(null)

  const activeTasks = useMemo(() => sortTasksByUrgency(data.tasks.filter((task) => task.status !== 'done')), [data.tasks])
  const topIdea = useMemo(() => data.ideas.find((idea) => idea.status === 'in_progress') ?? data.ideas[0] ?? null, [data.ideas])
  const unreadArticles = useMemo(() => data.articles.filter((article) => article.status === 'unread'), [data.articles])

  const feedCards = useMemo(
    () =>
      buildCards(
        activeTasks,
        data.projects.filter((project) => project.status !== 'shipped'),
        Boolean(topIdea),
        unreadArticles.length > 0
      ),
    [activeTasks, data.projects, topIdea, unreadArticles.length]
  )

  const cardById = useMemo(() => new Map(feedCards.map((card) => [card.id, card])), [feedCards])
  const orderedCards = useMemo(
    () =>
      cardOrder
        .map((id) => cardById.get(id))
        .filter((card): card is FeedCard => Boolean(card)),
    [cardById, cardOrder]
  )

  const current = orderedCards[Math.min(index, Math.max(0, orderedCards.length - 1))]

  useEffect(() => {
    setCardOrder((existing) => {
      const nextIds = feedCards.map((card) => card.id)
      const kept = existing.filter((id) => nextIds.includes(id))
      const missing = nextIds.filter((id) => !kept.includes(id))
      return [...kept, ...missing]
    })
  }, [feedCards])

  useEffect(() => {
    setIndex((currentIndex) => Math.min(currentIndex, Math.max(0, orderedCards.length - 1)))
  }, [orderedCards.length])

  function next() {
    setTransitionDirection('forward')
    setIndex((currentIndex) => Math.min(Math.max(0, orderedCards.length - 1), currentIndex + 1))
  }

  function prev() {
    setTransitionDirection('backward')
    setIndex((currentIndex) => Math.max(0, currentIndex - 1))
  }

  function dismissCurrent(markDone: boolean) {
    if (!current) return

    if (markDone && (current.type === 'task' || current.type === 'blocked')) {
      moveTask(current.taskId, 'done')
    }

    setTransitionDirection('forward')

    setCardOrder((order) => {
      const withoutCurrent = order.filter((id) => id !== current.id)

      if (!markDone) {
        const snoozedOrder = [...withoutCurrent, current.id]
        setIndex((currentIndex) => (currentIndex >= withoutCurrent.length ? 0 : currentIndex))
        return snoozedOrder
      }

      setIndex((currentIndex) => Math.min(currentIndex, Math.max(0, withoutCurrent.length - 1)))
      return withoutCurrent
    })
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 'j') {
        event.preventDefault()
        next()
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'k') {
        event.preventDefault()
        prev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        dismissCurrent(true)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        dismissCurrent(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dismissCurrent, next, prev])

  function primaryAction() {
    if (!current) return

    if (current.type === 'task') {
      moveTask(current.taskId, 'in_progress')
      return
    }

    if (current.type === 'blocked') {
      moveTask(current.taskId, 'todo')
      return
    }

    if (current.type === 'idea' && topIdea) {
      updateIdeaStatus(topIdea.id, getIdeaNextStatus(topIdea.status))
      return
    }

    if (current.type === 'reading') {
      for (const article of unreadArticles) {
        updateArticleStatus(article.id, 'read')
      }
      return
    }

    if (current.type === 'done') {
      setDrawerOpen(true)
    }
  }

  const morningBrief = summarizeMorningBrief(data)
  const firstTask = getMostUrgentTask(data)

  const projectStats = useMemo(() => {
    return data.projects.map((project) => {
      const tasks = data.tasks.filter((task) => task.project_id === project.id)
      const done = tasks.filter((task) => task.status === 'done').length
      return { project, total: tasks.length, done }
    })
  }, [data.projects, data.tasks])

  const digest = useMemo(() => {
    const doneCount = data.tasks.filter((task) => task.status === 'done').length
    const blockedCount = data.tasks.filter((task) => task.status === 'blocked').length
    return `# Daily Pulse\n\n- Active tasks: ${activeTasks.length}\n- Done tasks: ${doneCount}\n- Blocked tasks: ${blockedCount}\n- Unread articles: ${unreadArticles.length}\n- Top priority: ${firstTask?.title ?? 'None'}\n`
  }, [activeTasks.length, data.tasks, firstTask?.title, unreadArticles.length])

  const queryResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []

    const rows = [
      ...data.tasks.map((task) => ({ id: task.id, label: task.title, meta: `Task · ${task.status}` })),
      ...data.ideas.map((idea) => ({ id: idea.id, label: idea.title, meta: `Idea · ${idea.status}` })),
      ...data.projects.map((project) => ({ id: project.id, label: project.name, meta: `Project · ${project.status}` })),
    ]

    return rows.filter((row) => `${row.label} ${row.meta}`.toLowerCase().includes(q)).slice(0, 8)
  }, [data.ideas, data.projects, data.tasks, search])

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {current ? (
        <article
          key={current.id}
          className={`absolute inset-0 flex flex-col px-6 py-8 ${transitionDirection === 'forward' ? 'animate-[pulseCardInForward_300ms_ease-out]' : 'animate-[pulseCardInBackward_300ms_ease-out]'} ${cardSurface(current.type)}`}
          onPointerDown={(event) => setPointerStart({ x: event.clientX, y: event.clientY })}
          onPointerUp={(event) => {
            if (!pointerStart) return
            const dx = event.clientX - pointerStart.x
            const dy = event.clientY - pointerStart.y
            setPointerStart(null)

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
              dismissCurrent(dx > 0)
              return
            }

            if (Math.abs(dy) > 70) {
              if (dy < 0) next()
              if (dy > 0) prev()
            }
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] opacity-70">{statusLabel(current.type)}</p>
            <p className="text-xs uppercase tracking-[0.14em] opacity-60">
              {index + 1} / {orderedCards.length}
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center">
            {current.type === 'pulse' ? (
              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">Your work pulse for today</h1>
                <div className="max-w-xl">
                  <MomentumScore data={data} />
                </div>
                <p className="max-w-3xl text-lg opacity-90">{morningBrief.sentence}</p>
              </div>
            ) : null}

            {(current.type === 'task' || current.type === 'blocked') && current.taskId ? (
              (() => {
                const task = data.tasks.find((entry) => entry.id === current.taskId)
                if (!task) return null
                return (
                  <div className="space-y-6">
                    <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">{task.title}</h1>
                    <p className="max-w-2xl text-lg opacity-85">{task.description || 'No description yet.'}</p>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] opacity-70">
                      <span className="rounded-full border border-current/30 px-3 py-1">{task.priority}</span>
                      <span className="rounded-full border border-current/30 px-3 py-1">{task.status}</span>
                      {task.due_date ? <span className="rounded-full border border-current/30 px-3 py-1">Due {new Date(task.due_date).toLocaleDateString('en-US')}</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button onClick={() => moveTask(task.id, 'in_progress')} className="rounded-full border border-current/30 px-4 py-2">
                        Start
                      </button>
                      <button onClick={() => moveTask(task.id, 'done')} className="rounded-full border border-current/30 px-4 py-2">
                        Done
                      </button>
                      <button onClick={() => moveTask(task.id, 'blocked')} className="rounded-full border border-current/30 px-4 py-2">
                        Block
                      </button>
                    </div>
                  </div>
                )
              })()
            ) : null}

            {current.type === 'idea' && topIdea ? (
              <div className="space-y-6">
                <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">{topIdea.title}</h1>
                <p className="max-w-2xl text-lg opacity-85">{topIdea.description || 'Top idea in motion.'}</p>
                <p className="text-sm uppercase tracking-[0.14em] opacity-70">{topIdea.status}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => updateIdeaStatus(topIdea.id, getIdeaNextStatus(topIdea.status))}
                    className="rounded-full border border-current/30 px-4 py-2"
                  >
                    Advance
                  </button>
                  <button onClick={() => updateIdeaStatus(topIdea.id, 'shipped')} className="rounded-full border border-current/30 px-4 py-2">
                    Kill / Close
                  </button>
                </div>
              </div>
            ) : null}

            {current.type === 'reading' ? (
              <div className="space-y-6">
                <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">Reading batch</h1>
                <div className="space-y-2">
                  {unreadArticles.slice(0, 8).map((article) => (
                    <article key={article.id} className="rounded-2xl border border-current/20 px-4 py-3">
                      <p className="font-medium">{article.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] opacity-70">{article.status}</p>
                    </article>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => unreadArticles.forEach((article) => updateArticleStatus(article.id, 'read'))}
                    className="rounded-full border border-current/30 px-4 py-2"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => unreadArticles.forEach((article) => updateArticleStatus(article.id, 'archived'))}
                    className="rounded-full border border-current/30 px-4 py-2"
                  >
                    Archive all
                  </button>
                </div>
              </div>
            ) : null}

            {current.type === 'project' ? (
              (() => {
                const stats = projectStats.find((entry) => entry.project.id === current.projectId)
                if (!stats) return null
                const percent = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)

                return (
                  <div className="space-y-6">
                    <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">{stats.project.name}</h1>
                    <p className="max-w-2xl text-lg opacity-80">{stats.project.description}</p>
                    <p className="text-6xl font-semibold tabular-nums">{percent}%</p>
                    <p className="text-sm uppercase tracking-[0.14em] opacity-70">
                      {stats.done} done / {stats.total} tasks
                    </p>
                  </div>
                )
              })()
            ) : null}

            {current.type === 'activity' ? (
              <div className="space-y-6">
                <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">Since yesterday</h1>
                <div className="space-y-2">
                  {data.activities.slice(0, 10).map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-current/20 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.12em] opacity-70">{formatDateTime(entry.timestamp)}</p>
                      <p className="mt-1">{entry.message}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {current.type === 'done' ? (
              <div className="space-y-6">
                <h1 className="text-5xl font-semibold leading-tight [font-family:var(--font-newsreader)] sm:text-6xl">You're caught up</h1>
                <p className="max-w-2xl text-lg opacity-80">Close the loop, then create the next decisive move.</p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(digest)
                    } catch {
                      // No-op in unsupported environments.
                    }
                  }}
                  className="rounded-full border border-white/30 px-4 py-2 text-sm"
                >
                  Share your Pulse
                </button>
                <button onClick={() => setDrawerOpen(true)} className="rounded-full border border-white/30 px-4 py-2 text-sm">
                  Create something new
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] opacity-70">
              <ArrowUp className="h-3.5 w-3.5" /> prev
              <ArrowDown className="ml-2 h-3.5 w-3.5" /> next
            </div>
            <div className="flex items-center gap-2">
              <button onClick={primaryAction} className="inline-flex items-center gap-1 rounded-full border border-current/30 px-4 py-2 text-xs uppercase tracking-[0.12em]">
                <Check className="h-3.5 w-3.5" /> action
              </button>
              <button onClick={() => dismissCurrent(false)} className="inline-flex items-center gap-1 rounded-full border border-current/30 px-4 py-2 text-xs uppercase tracking-[0.12em]">
                <Clock3 className="h-3.5 w-3.5" /> snooze
              </button>
              <button onClick={() => dismissCurrent(true)} className="inline-flex items-center gap-1 rounded-full border border-current/30 px-4 py-2 text-xs uppercase tracking-[0.12em]">
                <X className="h-3.5 w-3.5" /> dismiss
              </button>
            </div>
          </div>
        </article>
      ) : null}

      <aside className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        {orderedCards.map((card, dotIndex) => {
          const tone = dotTone(card.type) === 'action' ? 'bg-rose-500' : 'bg-emerald-400'
          return (
            <button
              key={card.id}
              onClick={() => setIndex(dotIndex)}
              className={`pointer-events-auto h-2.5 w-2.5 rounded-full transition-all ${tone} ${dotIndex === index ? 'scale-125 ring-2 ring-white/80' : 'opacity-70'}`}
              aria-label={`Go to card ${dotIndex + 1}`}
            />
          )
        })}
      </aside>

      <div className={`absolute inset-x-0 bottom-0 z-30 transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-[85%]'}`}>
        <div className="mx-auto w-full max-w-3xl rounded-t-3xl border border-white/15 bg-black/70 p-4 text-white backdrop-blur">
          <button
            onClick={() => setDrawerOpen((open) => !open)}
            className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.12em]"
          >
            {drawerOpen ? 'Close drawer' : 'Open drawer'}
          </button>

          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!quickTask.trim()) return
              createTask({ title: quickTask.trim(), owner_type: 'human', priority: 'medium' })
              setQuickTask('')
            }}
          >
            <input
              value={quickTask}
              onChange={(event) => setQuickTask(event.target.value)}
              placeholder="Create task"
              className="min-w-52 flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm outline-none"
            />
            <button type="submit" className="rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-[0.12em]">
              add
            </button>
          </form>

          <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, ideas, projects"
              className="w-full bg-transparent text-sm outline-none"
            />
            <div className="mt-2 space-y-1 text-xs text-white/80">
              {queryResults.map((result) => (
                <p key={result.id} className="rounded-lg bg-white/5 px-2 py-1">
                  {result.label} · {result.meta}
                </p>
              ))}
              {search && queryResults.length === 0 ? <p className="text-white/55">No results.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
