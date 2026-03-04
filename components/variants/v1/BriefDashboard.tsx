'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Command, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { CommandPalette, type CommandAction } from '@/components/variants/shared/CommandPalette'
import { MorningBrief } from '@/components/variants/shared/MorningBrief'
import { formatDate, formatDateTime } from '@/lib/utils'
import { getIdeaNextStatus, getMostUrgentTask, getProjectTaskStats, sortTasksByUrgency, summarizeMorningBrief } from '@/components/variants/shared/variantData'
import type { ArticleStatus, IdeaStatus } from '@/lib/workspace'

const SECTION_IDS = {
  morning: 'brief-morning',
  focus: 'brief-focus',
  projects: 'brief-projects',
  ideas: 'brief-ideas',
  reading: 'brief-reading',
  activity: 'brief-activity',
} as const

function cycleArticleStatus(status: ArticleStatus): ArticleStatus {
  if (status === 'unread') return 'reading'
  if (status === 'reading') return 'read'
  if (status === 'read') return 'archived'
  return 'unread'
}

function completionPercent(total: number, done: number): number {
  if (total === 0) {
    return 0
  }

  return Math.round((done / total) * 100)
}

export function BriefDashboard() {
  const {
    data,
    createTask,
    createProject,
    createIdea,
    addArticle,
    updateIdeaStatus,
    updateArticleStatus,
    moveTask,
  } = useWorkspace()

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [quickProject, setQuickProject] = useState('')
  const [quickIdea, setQuickIdea] = useState('')
  const [quickIdeaStatus, setQuickIdeaStatus] = useState<IdeaStatus>('brainstorm')
  const [readingDraft, setReadingDraft] = useState<Record<string, string>>({})
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({})
  const [showAllActivity, setShowAllActivity] = useState(false)

  const morningBrief = useMemo(() => summarizeMorningBrief(data), [data])
  const urgentTask = useMemo(() => getMostUrgentTask(data), [data])
  const activeTasks = useMemo(
    () => sortTasksByUrgency(data.tasks.filter((task) => task.status !== 'done')).slice(0, 8),
    [data.tasks]
  )
  const projectStats = useMemo(() => getProjectTaskStats(data), [data])

  const groupedIdeas = useMemo(() => {
    return {
      brainstorm: data.ideas.filter((idea) => idea.status === 'brainstorm'),
      research: data.ideas.filter((idea) => idea.status === 'research'),
      in_progress: data.ideas.filter((idea) => idea.status === 'in_progress'),
      shipped: data.ideas.filter((idea) => idea.status === 'shipped'),
    }
  }, [data.ideas])

  const articlesByList = useMemo(() => {
    return data.readingLists.map((list) => ({
      list,
      articles: data.articles.filter((article) => article.reading_list_id === list.id),
    }))
  }, [data.articles, data.readingLists])

  const paletteActions = useMemo<CommandAction[]>(() => {
    const sectionActions: CommandAction[] = Object.entries(SECTION_IDS).map(([key, id]) => ({
      id: `section-${key}`,
      label: `Jump to ${key}`,
      description: 'Scroll to section',
      keywords: ['section', key],
      run: () => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    }))

    const taskActions: CommandAction[] = data.tasks.slice(0, 20).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      description: `Task · ${task.status}`,
      keywords: [task.priority, task.status, 'task'],
      run: () => {
        document.getElementById(SECTION_IDS.focus)?.scrollIntoView({ behavior: 'smooth' })
        setExpandedTaskId(task.id)
      },
    }))

    const projectActions: CommandAction[] = data.projects.map((project) => ({
      id: `project-${project.id}`,
      label: project.name,
      description: `Project · ${project.status}`,
      keywords: ['project'],
      run: () => {
        document.getElementById(SECTION_IDS.projects)?.scrollIntoView({ behavior: 'smooth' })
      },
    }))

    return [
      {
        id: 'create-task',
        label: 'Create quick task',
        description: 'Prompt and create a task instantly',
        keywords: ['create', 'task'],
        run: () => {
          const title = window.prompt('Task title')?.trim()
          if (title) {
            createTask({ title, priority: 'medium', owner_type: 'human' })
          }
        },
      },
      {
        id: 'create-idea',
        label: 'Capture idea',
        description: 'Prompt and add to brainstorm',
        keywords: ['create', 'idea'],
        run: () => {
          const title = window.prompt('Idea title')?.trim()
          if (title) {
            createIdea({ title, status: 'brainstorm', owner_type: 'human' })
          }
        },
      },
      ...sectionActions,
      ...taskActions,
      ...projectActions,
    ]
  }, [createIdea, createTask, data.projects, data.tasks])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isTrigger = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isTrigger) {
        return
      }

      event.preventDefault()
      setPaletteOpen((current) => !current)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#1a1a1a]">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={paletteActions} title="The Brief" />

      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fafaf8]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-6">
            <p className="text-lg font-semibold tracking-tight">The Brief</p>
            <nav className="hidden items-center gap-2 text-xs uppercase tracking-[0.14em] text-black/65 lg:flex">
              {Object.entries(SECTION_IDS).map(([key, id]) => (
                <button
                  key={key}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="rounded-full px-2 py-1 transition-colors hover:bg-black/5"
                >
                  {key}
                </button>
              ))}
            </nav>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            <Command className="h-3.5 w-3.5" />
            Cmd+K
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-6 sm:px-8">
        <div id={SECTION_IDS.morning} className="border-b border-black/10 pb-10">
          <MorningBrief
            title={dateLabel}
            dateLabel="The Brief"
            sentence={morningBrief.sentence}
            stats={morningBrief.stats}
            actionLabel={urgentTask ? `Start: ${urgentTask.title}` : 'Capture first task'}
            onAction={() => {
              if (urgentTask) {
                document.getElementById(`focus-${urgentTask.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setExpandedTaskId(urgentTask.id)
                return
              }

              document.getElementById(SECTION_IDS.focus)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="bg-[#f4f4f1]"
          />
        </div>

        <section id={SECTION_IDS.focus} className="border-b border-black/10 pb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl [font-family:var(--font-fraunces)]">Focus Queue</h2>
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
                placeholder="Add task + Enter"
                className="w-64 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-black/30"
              />
            </form>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeTasks.slice(0, 5).map((task) => {
              const project = data.projects.find((item) => item.id === task.project_id)
              const expanded = expandedTaskId === task.id

              return (
                <article
                  id={`focus-${task.id}`}
                  key={task.id}
                  className="min-w-[280px] max-w-[320px] flex-1 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-10 w-1.5 rounded-full"
                      style={{
                        background:
                          task.priority === 'urgent'
                            ? '#111'
                            : task.priority === 'high'
                              ? '#444'
                              : task.priority === 'medium'
                                ? '#666'
                                : '#999',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{task.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/55">
                        {project?.name ?? 'Unassigned'}
                        {task.due_date ? ` · Due ${formatDate(task.due_date)}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/65"
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded ? 'Collapse' : 'Expand'}
                  </button>

                  {expanded ? (
                    <div className="mt-3 space-y-3 text-sm">
                      <p className="text-black/70">{task.description || 'No description yet.'}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => moveTask(task.id, 'in_progress')}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => moveTask(task.id, 'blocked')}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => moveTask(task.id, 'done')}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}

            {activeTasks.length > 5 ? (
              <div className="flex min-w-[180px] items-center justify-center rounded-2xl border border-dashed border-black/20 text-sm text-black/65">
                +{activeTasks.length - 5} more
              </div>
            ) : null}
          </div>
        </section>

        <section id={SECTION_IDS.projects} className="border-b border-black/10 pb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl [font-family:var(--font-fraunces)]">Active Projects</h2>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!quickProject.trim()) return
                createProject({ name: quickProject.trim(), status: 'active' })
                setQuickProject('')
              }}
            >
              <input
                value={quickProject}
                onChange={(event) => setQuickProject(event.target.value)}
                placeholder="Add project + Enter"
                className="w-64 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-black/30"
              />
            </form>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.projects.map((project) => {
              const stats = projectStats.get(project.id) ?? { total: 0, done: 0, blocked: 0, active: 0 }
              const completion = completionPercent(stats.total, stats.done)
              const circumference = 2 * Math.PI * 28
              const stroke = ((100 - completion) / 100) * circumference

              return (
                <article key={project.id} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{project.name}</p>
                      <p className="mt-1 text-sm text-black/65">{project.description || 'No description yet.'}</p>
                    </div>
                    <svg viewBox="0 0 72 72" className="h-14 w-14" aria-hidden>
                      <circle cx="36" cy="36" r="28" stroke="rgba(0,0,0,0.12)" strokeWidth="8" fill="none" />
                      <circle
                        cx="36"
                        cy="36"
                        r="28"
                        stroke="#1a1a1a"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={stroke}
                        transform="rotate(-90 36 36)"
                      />
                      <text x="36" y="40" textAnchor="middle" className="fill-black text-[14px] font-semibold">
                        {completion}%
                      </text>
                    </svg>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-black/60">
                    <span className="rounded-full bg-black/5 px-2 py-1">{stats.active} active</span>
                    <span className="rounded-full bg-black/5 px-2 py-1">{stats.blocked} blocked</span>
                    <span className="rounded-full bg-black/5 px-2 py-1">{stats.done} done</span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section id={SECTION_IDS.ideas} className="border-b border-black/10 pb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl [font-family:var(--font-fraunces)]">Ideas Pipeline</h2>
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!quickIdea.trim()) return
                createIdea({ title: quickIdea.trim(), status: quickIdeaStatus, owner_type: 'human' })
                setQuickIdea('')
              }}
            >
              <input
                value={quickIdea}
                onChange={(event) => setQuickIdea(event.target.value)}
                placeholder="Capture idea"
                className="w-56 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-black/30"
              />
              <select
                value={quickIdeaStatus}
                onChange={(event) => setQuickIdeaStatus(event.target.value as IdeaStatus)}
                className="rounded-full border border-black/15 bg-white px-3 py-2 text-sm"
              >
                <option value="brainstorm">Brainstorm</option>
                <option value="research">Research</option>
                <option value="in_progress">In Progress</option>
                <option value="shipped">Shipped</option>
              </select>
              <button type="submit" className="inline-flex items-center gap-1 rounded-full border border-black/15 px-3 py-2 text-sm">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {(['brainstorm', 'research', 'in_progress', 'shipped'] as const).map((status) => (
              <div
                key={status}
                className="min-w-[220px] flex-1 rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)] lg:min-w-[250px]"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/55">{status.replace('_', ' ')}</p>
                <div className="space-y-2">
                  {groupedIdeas[status].map((idea) => (
                    <article key={idea.id} className="rounded-xl border border-black/10 px-3 py-2">
                      <p className="text-sm font-medium">{idea.title}</p>
                      <p className="mt-1 text-xs text-black/60">{idea.category}</p>
                      {status !== 'shipped' ? (
                        <button
                          onClick={() => updateIdeaStatus(idea.id, getIdeaNextStatus(idea.status))}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/70"
                        >
                          Advance <ArrowRight className="h-3 w-3" />
                        </button>
                      ) : null}
                    </article>
                  ))}
                  {groupedIdeas[status].length === 0 ? <p className="text-xs text-black/45">No ideas</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id={SECTION_IDS.reading} className="border-b border-black/10 pb-10">
          <h2 className="mb-4 text-3xl [font-family:var(--font-fraunces)]">Reading Stack</h2>
          <div className="space-y-3">
            {articlesByList.map(({ list, articles }) => {
              const collapsed = collapsedLists[list.id] ?? false

              return (
                <article key={list.id} className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setCollapsedLists((current) => ({ ...current, [list.id]: !collapsed }))}
                      className="flex items-center gap-2 text-left"
                    >
                      {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-xs text-black/60">{articles.length} items</p>
                      </div>
                    </button>

                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        const draft = readingDraft[list.id]?.trim()
                        if (!draft) return
                        addArticle({ reading_list_id: list.id, url: draft, title: draft })
                        setReadingDraft((current) => ({ ...current, [list.id]: '' }))
                      }}
                    >
                      <input
                        value={readingDraft[list.id] ?? ''}
                        onChange={(event) => setReadingDraft((current) => ({ ...current, [list.id]: event.target.value }))}
                        placeholder="Paste URL and Enter"
                        className="w-56 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-black/30"
                      />
                    </form>
                  </div>

                  {collapsed ? null : (
                    <ul className="mt-3 space-y-2">
                      {articles.map((article) => (
                        <li key={article.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{article.title}</p>
                            <p className="text-xs text-black/55">{(() => { try { return new URL(article.url).hostname.replace('www.', '') } catch { return article.url } })()}</p>
                          </div>
                          <button
                            onClick={() => updateArticleStatus(article.id, cycleArticleStatus(article.status))}
                            className="rounded-full border border-black/15 px-3 py-1 text-xs uppercase tracking-[0.12em]"
                          >
                            {article.status}
                          </button>
                        </li>
                      ))}
                      {articles.length === 0 ? <li className="text-xs text-black/45">No articles in this list.</li> : null}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section id={SECTION_IDS.activity}>
          <h2 className="mb-4 text-3xl [font-family:var(--font-fraunces)]">Activity Stream</h2>
          <div className="relative pl-7">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-black/20" aria-hidden />
            <ul className="space-y-3">
              {(showAllActivity ? data.activities : data.activities.slice(0, 10)).map((activity) => (
                <li key={activity.id} className="relative rounded-xl bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <span className="absolute -left-[22px] top-5 h-2.5 w-2.5 rounded-full bg-[#2c2c2c]" aria-hidden />
                  <p className="text-xs uppercase tracking-[0.12em] text-black/55">{formatDateTime(activity.timestamp)}</p>
                  <p className="mt-1 text-sm">{activity.message}</p>
                </li>
              ))}
            </ul>
          </div>
          {data.activities.length > 10 ? (
            <button
              onClick={() => setShowAllActivity((value) => !value)}
              className="mt-4 rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              {showAllActivity ? 'Show less' : 'Show all'}
            </button>
          ) : null}
        </section>
      </main>
    </div>
  )
}
