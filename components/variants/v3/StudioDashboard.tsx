'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pause, Play, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'
import { getMostUrgentTask, getProjectTaskStats, sortTasksByUrgency } from '@/components/variants/shared/variantData'

type StudioMode = 'plan' | 'execute' | 'review'

const MODE_SEQUENCE: StudioMode[] = ['plan', 'execute', 'review']

const MODE_LABEL: Record<StudioMode, string> = {
  plan: 'PLAN',
  execute: 'EXECUTE',
  review: 'REVIEW',
}

const MODE_SURFACE: Record<StudioMode, string> = {
  plan: 'bg-[#edf0f4] text-[#3f4f5f]',
  execute: 'bg-[#f7efe3] text-[#2a1f1a]',
  review: 'bg-[#f5f0e8] text-[#333333]',
}

function decideSuggestedMode(): StudioMode {
  const hour = new Date().getHours()
  if (hour < 11) return 'plan'
  if (hour < 18) return 'execute'
  return 'review'
}

function buildWeeklySummary(activityTimestamps: string[]): { thisWeek: number; lastWeek: number } {
  const now = Date.now()
  const thisWeek = activityTimestamps.filter((timestamp) => {
    const delta = Math.floor((now - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24))
    return delta >= 0 && delta < 7
  }).length

  const lastWeek = activityTimestamps.filter((timestamp) => {
    const delta = Math.floor((now - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24))
    return delta >= 7 && delta < 14
  }).length

  return { thisWeek, lastWeek }
}

export function StudioDashboard() {
  const { data, moveTask, updateIdeaStatus, createTask } = useWorkspace()

  const [mode, setMode] = useState<StudioMode>('plan')
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1)
  const [suggestedMode, setSuggestedMode] = useState<StudioMode | null>(null)
  const [showReadingStrip, setShowReadingStrip] = useState(true)
  const [quickTask, setQuickTask] = useState('')

  const urgentTask = useMemo(() => getMostUrgentTask(data), [data])
  const [executeTaskId, setExecuteTaskId] = useState<string | null>(urgentTask?.id ?? null)

  const activeTasks = useMemo(() => sortTasksByUrgency(data.tasks.filter((task) => task.status !== 'done')), [data.tasks])
  const nextUp = activeTasks.slice(1, 4)

  const executeTask = useMemo(
    () => data.tasks.find((task) => task.id === executeTaskId) ?? activeTasks[0] ?? null,
    [activeTasks, data.tasks, executeTaskId]
  )

  const projectStats = useMemo(() => getProjectTaskStats(data), [data])
  const weeklySummary = useMemo(() => buildWeeklySummary(data.activities.map((entry) => entry.timestamp)), [data.activities])

  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)

  useEffect(() => {
    setSuggestedMode(decideSuggestedMode())
  }, [])

  useEffect(() => {
    if (!timerRunning) {
      return
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          setTimerRunning(false)
          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timerRunning])

  useEffect(() => {
    if (!executeTaskId && urgentTask) {
      setExecuteTaskId(urgentTask.id)
    }
  }, [executeTaskId, urgentTask])

  const contextualArticles = useMemo(() => {
    if (!executeTask?.project_id) {
      return data.articles.slice(0, 4)
    }

    const projectIndex = data.projects.findIndex((project) => project.id === executeTask.project_id)
    const list = data.readingLists[Math.max(0, projectIndex % Math.max(1, data.readingLists.length))]
    if (!list) {
      return data.articles.slice(0, 4)
    }

    return data.articles.filter((article) => article.reading_list_id === list.id).slice(0, 4)
  }, [data.articles, data.projects, data.readingLists, executeTask?.project_id])

  const timerLabel = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`

  const switchMode = useCallback(
    (nextMode: StudioMode) => {
      if (nextMode === mode) {
        return
      }

      const currentIndex = MODE_SEQUENCE.indexOf(mode)
      const nextIndex = MODE_SEQUENCE.indexOf(nextMode)
      setTransitionDirection(nextIndex > currentIndex ? 1 : -1)
      setMode(nextMode)
    },
    [mode]
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'p') {
        event.preventDefault()
        switchMode('plan')
      }
      if (key === 'e') {
        event.preventDefault()
        switchMode('execute')
      }
      if (key === 'r') {
        event.preventDefault()
        switchMode('review')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [switchMode])

  return (
    <div className={`relative h-screen overflow-hidden transition-colors duration-500 ${MODE_SURFACE[mode]}`}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="text-[22vw] font-semibold uppercase leading-none opacity-[0.06] [font-family:var(--font-instrument-serif)]">{MODE_LABEL[mode]}</p>
      </div>

      <div className="relative z-10 h-full px-5 pb-28 pt-5 sm:px-10">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] opacity-70">The Studio</p>
            <p className="mt-1 text-sm opacity-75">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            {suggestedMode ? (
              <button
                onClick={() => switchMode(suggestedMode)}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-current/25 px-3 py-1 text-xs uppercase tracking-[0.12em]"
              >
                <Sparkles className="h-3 w-3" /> Suggested: {MODE_LABEL[suggestedMode]}
              </button>
            ) : null}
          </div>

          <form
            className="flex items-center gap-2"
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
              placeholder="Quick create task"
              className="w-56 rounded-full border border-current/20 bg-white/50 px-4 py-2 text-sm text-black/80 outline-none"
            />
          </form>
        </div>

        <div
          key={mode}
          className={`h-[calc(100%-56px)] ${transitionDirection > 0 ? 'animate-[studioSlideForward_300ms_ease-out]' : 'animate-[studioSlideBack_300ms_ease-out]'}`}
        >
          {mode === 'plan' ? (
            <div className="grid h-full gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="min-h-0 overflow-y-auto rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] opacity-70 [font-family:var(--font-instrument-serif)]">Projects Grid</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.projects.map((project) => {
                    const stats = projectStats.get(project.id) ?? { total: 0, done: 0, blocked: 0, active: 0 }
                    return (
                      <article key={project.id} className="rounded-2xl border border-current/15 bg-white/70 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{project.name}</p>
                          <span className="text-xs uppercase tracking-[0.12em] opacity-60">{project.status}</span>
                        </div>
                        <p className="mt-1 text-xs opacity-70">{project.description}</p>
                        <p className="mt-2 text-xs opacity-70">
                          {stats.active} active · {stats.blocked} blocked · {stats.done} done
                        </p>
                        <div className="mt-2 space-y-1 text-xs">
                          {data.tasks
                            .filter((task) => task.project_id === project.id && task.status !== 'done')
                            .slice(0, 3)
                            .map((task) => (
                              <p key={task.id} className="truncate rounded-lg bg-black/5 px-2 py-1">
                                {task.title}
                              </p>
                            ))}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="min-h-0 overflow-y-auto rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] opacity-70 [font-family:var(--font-instrument-serif)]">Ideas Board</h2>
                  <button
                    onClick={() => setShowReadingStrip((current) => !current)}
                    className="rounded-full border border-current/20 px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
                  >
                    {showReadingStrip ? 'Hide' : 'Show'} Reading Queue
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(['brainstorm', 'research', 'in_progress'] as const).map((status) => (
                    <div key={status} className="rounded-2xl border border-current/15 bg-white/75 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] opacity-60">{status.replace('_', ' ')}</p>
                      <div className="mt-2 space-y-2">
                        {data.ideas
                          .filter((idea) => idea.status === status)
                          .map((idea) => (
                            <article key={idea.id} className="rounded-xl bg-black/5 px-2 py-2 text-xs">
                              <p className="font-medium">{idea.title}</p>
                              <button
                                onClick={() =>
                                  updateIdeaStatus(
                                    idea.id,
                                    status === 'brainstorm' ? 'research' : status === 'research' ? 'in_progress' : 'shipped'
                                  )
                                }
                                className="mt-2 rounded border border-current/25 px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
                              >
                                advance
                              </button>
                            </article>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-current/15 bg-white/80 p-3">
                  {showReadingStrip ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs">
                      {data.articles.map((article) => (
                        <article key={article.id} className="min-w-[180px] rounded-xl bg-black/5 px-3 py-2">
                          <p className="line-clamp-2 font-medium">{article.title}</p>
                          <p className="mt-1 opacity-60">{article.status}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {mode === 'execute' ? (
            <div className="grid h-full gap-4 lg:grid-cols-[1.5fr_1fr]">
              <section className="flex min-h-0 flex-col rounded-3xl bg-white/80 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] opacity-70">Current Task</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight [font-family:var(--font-instrument-serif)]">
                  {executeTask?.title ?? 'No active task. Capture one to start execution.'}
                </h2>
                <p className="mt-3 text-sm opacity-70">{executeTask?.description || 'Focus mode keeps the canvas narrow and decisions obvious.'}</p>

                <div className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-xl bg-black/5 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.12em] opacity-60">Project</p>
                    <p className="mt-1 font-medium">
                      {data.projects.find((project) => project.id === executeTask?.project_id)?.name ?? 'Unassigned'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/5 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.12em] opacity-60">Priority</p>
                    <p className="mt-1 font-medium">{executeTask?.priority ?? 'n/a'}</p>
                  </div>
                  <div className="rounded-xl bg-black/5 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.12em] opacity-60">Due</p>
                    <p className="mt-1 font-medium">{executeTask?.due_date ? new Date(executeTask.due_date).toLocaleDateString('en-US') : 'n/a'}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {executeTask ? (
                    <>
                      <button onClick={() => moveTask(executeTask.id, 'in_progress')} className="rounded-full border border-current/25 px-4 py-2 text-sm">Start</button>
                      <button onClick={() => moveTask(executeTask.id, 'done')} className="rounded-full border border-current/25 px-4 py-2 text-sm">Mark done</button>
                      <button onClick={() => moveTask(executeTask.id, 'blocked')} className="rounded-full border border-current/25 px-4 py-2 text-sm">I'm blocked</button>
                    </>
                  ) : null}
                </div>

                <div className="mt-8 rounded-2xl border border-current/20 bg-white/70 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.14em] opacity-65">Focus timer</p>
                    <button
                      onClick={() => setTimerRunning((running) => !running)}
                      className="rounded-full border border-current/25 px-2 py-1"
                      aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
                    >
                      {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums [font-family:var(--font-plex-mono)]">{timerLabel}</p>
                </div>
              </section>

              <section className="grid min-h-0 gap-4 lg:grid-rows-2">
                <article className="min-h-0 overflow-y-auto rounded-3xl bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] opacity-65">Next up</p>
                  <div className="mt-3 space-y-2">
                    {nextUp.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setExecuteTaskId(task.id)}
                        className="w-full rounded-xl border border-current/20 bg-white/70 px-3 py-2 text-left"
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="mt-1 text-xs opacity-60">{task.priority}</p>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="min-h-0 overflow-y-auto rounded-3xl bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] opacity-65">Context</p>
                  <div className="mt-3 space-y-2">
                    {contextualArticles.map((article) => (
                      <div key={article.id} className="rounded-xl border border-current/20 bg-white/70 px-3 py-2">
                        <p className="text-sm font-medium">{article.title}</p>
                        <p className="mt-1 text-xs opacity-60">{article.status}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </div>
          ) : null}

          {mode === 'review' ? (
            <div className="grid h-full gap-4 lg:grid-cols-[1.3fr_1fr]">
              <section className="min-h-0 overflow-y-auto rounded-3xl bg-white/80 p-4 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-4">
                  <ReviewMetric label="Active" value={data.tasks.filter((task) => task.status !== 'done').length} />
                  <ReviewMetric label="Done" value={data.tasks.filter((task) => task.status === 'done').length} />
                  <ReviewMetric label="Blocked" value={data.tasks.filter((task) => task.status === 'blocked').length} />
                  <ReviewMetric label="Velocity" value={weeklySummary.thisWeek} />
                </div>

                <div className="mt-4 space-y-2">
                  {data.activities.slice(0, 20).map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-current/20 bg-white/75 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] opacity-60">{formatDateTime(entry.timestamp)}</p>
                      <p className="mt-1 text-sm">{entry.message}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl bg-white/80 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] opacity-70">Weekly report card</p>
                <h3 className="mt-2 text-2xl font-semibold [font-family:var(--font-instrument-serif)]">Execution summary</h3>
                <p className="mt-3 text-sm opacity-75">
                  This week you logged {weeklySummary.thisWeek} activity events vs {weeklySummary.lastWeek} last week.
                </p>
                <p className="mt-3 text-sm opacity-75">
                  Completed tasks: {data.tasks.filter((task) => task.status === 'done').length}. Ideas shipped:{' '}
                  {data.ideas.filter((idea) => idea.status === 'shipped').length}. Read articles:{' '}
                  {data.articles.filter((article) => article.status === 'read').length}.
                </p>
                <p className="mt-5 rounded-xl bg-black/5 px-3 py-2 text-sm">
                  {weeklySummary.thisWeek >= weeklySummary.lastWeek
                    ? 'Momentum improved. Keep the execution rhythm.'
                    : 'Momentum cooled. Start tomorrow with a tighter plan block.'}
                </p>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-current/20 bg-white/70 p-1 shadow-lg backdrop-blur">
        {(['plan', 'execute', 'review'] as const).map((entryMode) => (
          <button
            key={entryMode}
            onClick={() => switchMode(entryMode)}
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              mode === entryMode ? 'bg-black text-white' : 'text-current'
            }`}
          >
            {entryMode}
          </button>
        ))}
      </nav>
      <p className="absolute bottom-4 right-5 z-20 text-[10px] uppercase tracking-[0.16em] opacity-60 [font-family:var(--font-plex-mono)]">
        Shortcuts: P / E / R
      </p>
    </div>
  )
}

function ReviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-current/20 bg-white/75 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] opacity-65">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums [font-family:var(--font-plex-mono)]">{value}</p>
    </article>
  )
}
