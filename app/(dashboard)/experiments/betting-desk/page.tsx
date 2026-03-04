'use client'

import { useMemo, useState } from 'react'
import { BadgeDollarSign, CandlestickChart, CircleGauge, Rocket, Sparkles, TrendingUp } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

interface BetInput {
  confidence: number
  impact: number
  effort: number
  urgency: number
}

function defaultBet(): BetInput {
  return {
    confidence: 55,
    impact: 60,
    effort: 50,
    urgency: 60,
  }
}

function scoreBet(bet: BetInput): number {
  return Math.round((bet.confidence * bet.impact * bet.urgency) / (bet.effort + 35))
}

export default function BettingDeskPage() {
  const { data, createTask, updateArticleStatus, updateIdeaStatus, updateTask } = useWorkspace()

  const [taskBets, setTaskBets] = useState<Record<string, BetInput>>({})
  const [projectBets, setProjectBets] = useState<Record<string, BetInput>>({})
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const activeProjects = data.projects.filter((project) => project.status !== 'shipped')
  const optionIdeas = data.ideas.filter((idea) => idea.status !== 'shipped')
  const signalTape = data.articles.filter((article) => article.status === 'unread' || article.status === 'reading').slice(0, 8)

  const selectedIdea = optionIdeas.find((idea) => idea.id === selectedIdeaId) ?? optionIdeas[0] ?? null

  function getTaskBet(taskId: string): BetInput {
    return taskBets[taskId] ?? defaultBet()
  }

  function getProjectBet(projectId: string): BetInput {
    return projectBets[projectId] ?? defaultBet()
  }

  function setTaskBet(taskId: string, key: keyof BetInput, value: number) {
    setTaskBets((current) => ({
      ...current,
      [taskId]: {
        ...getTaskBet(taskId),
        [key]: value,
      },
    }))
  }

  function setProjectBet(projectId: string, key: keyof BetInput, value: number) {
    setProjectBets((current) => ({
      ...current,
      [projectId]: {
        ...getProjectBet(projectId),
        [key]: value,
      },
    }))
  }

  const rankedTasks = useMemo(() => {
    return [...activeTasks]
      .map((task) => {
        const bet = getTaskBet(task.id)
        return {
          task,
          bet,
          score: scoreBet(bet),
        }
      })
      .sort((left, right) => right.score - left.score)
  }, [activeTasks, taskBets])

  const rankedProjects = useMemo(() => {
    return [...activeProjects]
      .map((project) => {
        const bet = getProjectBet(project.id)
        return {
          project,
          bet,
          score: scoreBet(bet),
        }
      })
      .sort((left, right) => right.score - left.score)
  }, [activeProjects, projectBets])

  const topTaskBet = rankedTasks[0]
  const topProjectBet = rankedProjects[0]

  const totalScores =
    rankedTasks.reduce((sum, item) => sum + item.score, 0) + rankedProjects.reduce((sum, item) => sum + item.score, 0)
  const totalBets = rankedTasks.length + rankedProjects.length
  const conviction =
    totalBets === 0
      ? 0
      : Math.round(
          (rankedTasks.reduce((sum, item) => sum + item.bet.confidence, 0) +
            rankedProjects.reduce((sum, item) => sum + item.bet.confidence, 0)) /
            totalBets
        )

  function commitTopTaskBet() {
    if (!topTaskBet) {
      return
    }

    updateTask(topTaskBet.task.id, {
      priority: 'urgent',
      status: 'todo',
      owner_type: 'human',
      tags: Array.from(new Set([...topTaskBet.task.tags, 'top-bet'])),
    })
  }

  function commitTopProjectBet() {
    if (!topProjectBet) {
      return
    }

    createTask({
      title: `Execute play: ${topProjectBet.project.name}`,
      description: 'Capital committed from Betting Desk portfolio.',
      project_id: topProjectBet.project.id,
      priority: 'high',
      owner_type: 'human',
      tags: ['capital-commit'],
    })
  }

  function exerciseIdeaOption() {
    if (!selectedIdea) {
      return
    }

    createTask({
      title: `Option bet: ${selectedIdea.title}`,
      description: selectedIdea.description ?? 'Run a quick validation bet for this option.',
      priority: 'medium',
      owner_type: 'human',
      tags: ['option-bet'],
    })
    updateIdeaStatus(selectedIdea.id, 'in_progress')
  }

  return (
    <div className="space-y-6 rounded-3xl bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fef3c7] p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-rose-300/60 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Version 5</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Betting Desk</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          Full portfolio-style command center. Price execution bets, commit capital to the top plays, and run post-trade review with
          live workspace signals.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Bets" value={String(totalBets)} note="Tasks + projects" />
        <MetricCard label="Portfolio Score" value={String(totalScores)} note="Current upside" />
        <MetricCard label="Conviction" value={`${conviction}%`} note="Average confidence" />
        <MetricCard label="Option Ideas" value={String(optionIdeas.length)} note="Unshipped ideas" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-rose-300/60 bg-white/85 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <TrendingUp className="h-5 w-5 text-rose-700" />
              Task Portfolio
            </h2>
            <button
              onClick={commitTopTaskBet}
              disabled={!topTaskBet}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <BadgeDollarSign className="h-4 w-4" />
              Commit Top Task
            </button>
          </div>

          <div className="space-y-4">
            {rankedTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-rose-300 px-3 py-6 text-center text-sm text-slate-600">
                No active tasks to price.
              </div>
            ) : null}

            {rankedTasks.map(({ task, bet, score }) => (
              <article key={task.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">Score {score}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SliderField
                    label="Confidence"
                    value={bet.confidence}
                    onChange={(value) => setTaskBet(task.id, 'confidence', value)}
                    accent="#be123c"
                  />
                  <SliderField
                    label="Impact"
                    value={bet.impact}
                    onChange={(value) => setTaskBet(task.id, 'impact', value)}
                    accent="#be123c"
                  />
                  <SliderField
                    label="Effort"
                    value={bet.effort}
                    onChange={(value) => setTaskBet(task.id, 'effort', value)}
                    accent="#be123c"
                  />
                  <SliderField
                    label="Urgency"
                    value={bet.urgency}
                    onChange={(value) => setTaskBet(task.id, 'urgency', value)}
                    accent="#be123c"
                  />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-rose-300/60 bg-white/85 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <CircleGauge className="h-5 w-5 text-rose-700" />
              Project Portfolio
            </h2>
            <button
              onClick={commitTopProjectBet}
              disabled={!topProjectBet}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Rocket className="h-4 w-4" />
              Commit Top Project
            </button>
          </div>

          <div className="space-y-4">
            {rankedProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-rose-300 px-3 py-6 text-center text-sm text-slate-600">
                No active projects to price.
              </div>
            ) : null}

            {rankedProjects.map(({ project, bet, score }) => (
              <article key={project.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">Score {score}</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SliderField
                    label="Confidence"
                    value={bet.confidence}
                    onChange={(value) => setProjectBet(project.id, 'confidence', value)}
                    accent="#111827"
                  />
                  <SliderField
                    label="Impact"
                    value={bet.impact}
                    onChange={(value) => setProjectBet(project.id, 'impact', value)}
                    accent="#111827"
                  />
                  <SliderField
                    label="Effort"
                    value={bet.effort}
                    onChange={(value) => setProjectBet(project.id, 'effort', value)}
                    accent="#111827"
                  />
                  <SliderField
                    label="Urgency"
                    value={bet.urgency}
                    onChange={(value) => setProjectBet(project.id, 'urgency', value)}
                    accent="#111827"
                  />
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-rose-300/60 bg-white/85 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            <Sparkles className="h-4 w-4 text-rose-700" />
            Options Chain
          </h2>

          <select
            value={selectedIdea?.id ?? ''}
            onChange={(event) => setSelectedIdeaId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {optionIdeas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>

          {selectedIdea ? (
            <div className="mt-3 rounded-lg bg-rose-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{selectedIdea.title}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedIdea.description ?? 'No description.'}</p>
            </div>
          ) : null}

          <button
            onClick={exerciseIdeaOption}
            disabled={!selectedIdea}
            className="mt-3 w-full rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-40"
          >
            Exercise Option to Create Task
          </button>
        </article>

        <article className="rounded-2xl border border-rose-300/60 bg-white/85 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            <CandlestickChart className="h-4 w-4 text-rose-700" />
            Market Tape
          </h2>
          <ul className="mt-3 space-y-2">
            {signalTape.length === 0 ? (
              <li className="rounded-lg bg-rose-50 px-3 py-3 text-xs text-slate-600">No signals on tape.</li>
            ) : null}
            {signalTape.map((article) => (
              <li key={article.id} className="rounded-lg bg-rose-50 px-3 py-2">
                <p className="line-clamp-2 text-xs font-semibold text-slate-800">{article.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateArticleStatus(article.id, 'reading')}
                    className="rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700"
                  >
                    Watching
                  </button>
                  <button
                    onClick={() => updateArticleStatus(article.id, 'read')}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                  >
                    Priced
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-rose-300/60 bg-white/85 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Trade Journal</h2>
          <ul className="mt-3 space-y-2">
            {data.activities.slice(0, 8).map((entry) => (
              <li key={entry.id} className="rounded-lg bg-rose-50 px-3 py-2">
                <p className="text-xs text-slate-800">{entry.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(entry.timestamp)}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}

function SliderField({
  label,
  value,
  onChange,
  accent,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  accent: string
}) {
  return (
    <label className="block rounded-lg bg-white p-3">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input
        type="range"
        min={10}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
        style={{ accentColor: accent }}
      />
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </label>
  )
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-rose-300/60 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}
