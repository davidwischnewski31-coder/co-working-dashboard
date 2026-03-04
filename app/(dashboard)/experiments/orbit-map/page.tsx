'use client'

import { useMemo, useState } from 'react'
import { Compass, Link2, Orbit, Plus, Radio } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

const orbitCoordinates = [
  { top: '10%', left: '46%' },
  { top: '26%', left: '72%' },
  { top: '54%', left: '78%' },
  { top: '72%', left: '54%' },
  { top: '64%', left: '20%' },
  { top: '32%', left: '14%' },
]

export default function OrbitMapPage() {
  const { data, createTask, moveTask, updateArticleStatus, updateIdeaStatus } = useWorkspace()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const projectNodes = data.projects.slice(0, orbitCoordinates.length)
  const selectedProject = projectNodes.find((project) => project.id === selectedProjectId) ?? projectNodes[0] ?? null

  const relatedTasks = useMemo(() => {
    if (!selectedProject) {
      return []
    }

    return data.tasks.filter((task) => task.project_id === selectedProject.id)
  }, [data.tasks, selectedProject])

  const selectedTokens = useMemo(() => {
    if (!selectedProject) {
      return []
    }

    return selectedProject.name
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 3)
  }, [selectedProject])

  const relatedIdeas = useMemo(() => {
    return data.ideas.filter((idea) => {
      const haystack = `${idea.title} ${idea.description ?? ''}`.toLowerCase()
      return selectedTokens.some((token) => haystack.includes(token))
    })
  }, [data.ideas, selectedTokens])

  const relatedArticles = useMemo(() => {
    return data.articles.filter((article) => {
      const haystack = `${article.title} ${article.url}`.toLowerCase()
      return selectedTokens.some((token) => haystack.includes(token))
    })
  }, [data.articles, selectedTokens])

  const pulseLog = useMemo(() => {
    if (!selectedProject) {
      return data.activities.slice(0, 6)
    }

    const lowerName = selectedProject.name.toLowerCase()

    return data.activities
      .filter((entry) => entry.message.toLowerCase().includes(lowerName))
      .concat(data.activities)
      .slice(0, 8)
  }, [data.activities, selectedProject])

  function createBridgeTask() {
    if (!selectedProject) {
      return
    }

    createTask({
      title: `Bridge: ${selectedProject.name} to adjacent orbit`,
      description: 'Connect this project to one dependency and define the handoff owner.',
      project_id: selectedProject.id,
      priority: 'high',
      owner_type: 'human',
      tags: ['bridge', 'coordination'],
    })
  }

  return (
    <div className="space-y-6 rounded-3xl bg-gradient-to-br from-[#ecfeff] via-[#cffafe] to-[#d9f99d] p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-cyan-300/50 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Version 4</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Orbit Map</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          Full spatial dashboard for dependency-heavy work. See project gravity, connected assets, and pulse events before deciding your
          next move.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Project Orbits" value={String(projectNodes.length)} note="Mapped nodes" />
        <MetricCard label="Linked Tasks" value={String(relatedTasks.length)} note="Current project" />
        <MetricCard label="Idea Signals" value={String(relatedIdeas.length)} note="Semantic matches" />
        <MetricCard label="Intel Signals" value={String(relatedArticles.length)} note="Matching reading" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-cyan-300/50 bg-white/80 p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Orbit className="h-5 w-5 text-cyan-700" />
            Project Orbits
          </h2>

          <div className="relative mt-4 h-[430px] rounded-2xl border border-cyan-200 bg-gradient-to-b from-cyan-50 to-emerald-50">
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300 bg-white/90 text-center text-xs font-semibold text-cyan-800">
              <div className="mt-8">Command Hub</div>
            </div>

            {projectNodes.map((project, index) => {
              const point = orbitCoordinates[index]
              const selected = selectedProject?.id === project.id
              const activeTaskCount = data.tasks.filter(
                (task) => task.project_id === project.id && task.status !== 'done'
              ).length

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  style={point}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left shadow-sm transition-all ${
                    selected
                      ? 'scale-105 border-cyan-500 bg-cyan-600 text-white'
                      : 'border-cyan-200 bg-white text-slate-700 hover:border-cyan-400'
                  }`}
                >
                  <p className="text-xs font-semibold">{project.name}</p>
                  <p className="text-[11px] opacity-80">{activeTaskCount} active tasks</p>
                </button>
              )
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-cyan-300/50 bg-white/80 p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Compass className="h-5 w-5 text-cyan-700" />
            Node Inspector
          </h2>

          {selectedProject ? (
            <div className="mt-3 space-y-4">
              <div className="rounded-xl bg-cyan-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{selectedProject.name}</p>
                <p className="mt-1 text-xs text-slate-600">{selectedProject.description ?? 'No description.'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Linked Tasks</p>
                <ul className="mt-2 space-y-2">
                  {relatedTasks.length === 0 ? (
                    <li className="rounded-md bg-cyan-50 px-2 py-2 text-xs text-slate-600">No linked tasks yet.</li>
                  ) : null}
                  {relatedTasks.slice(0, 4).map((task) => (
                    <li key={task.id} className="rounded-md bg-cyan-50 px-2 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span>{task.title}</span>
                        <button
                          onClick={() => moveTask(task.id, 'in_progress')}
                          disabled={task.status === 'done'}
                          className="rounded-md border border-cyan-300 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-700 disabled:opacity-40"
                        >
                          Launch
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={createBridgeTask}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
              >
                <Plus className="h-4 w-4" />
                Create Bridge Task
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No project nodes available.</p>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-cyan-300/50 bg-white/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Idea Constellation</h2>
          <ul className="mt-3 space-y-2">
            {relatedIdeas.length === 0 ? (
              <li className="rounded-md bg-emerald-50 px-3 py-3 text-xs text-slate-600">No semantic idea matches.</li>
            ) : null}
            {relatedIdeas.slice(0, 5).map((idea) => (
              <li key={idea.id} className="rounded-md bg-emerald-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-800">{idea.title}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">{idea.status.replace('_', ' ')}</span>
                  <button
                    onClick={() => updateIdeaStatus(idea.id, 'in_progress')}
                    disabled={idea.status === 'in_progress' || idea.status === 'shipped'}
                    className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-40"
                  >
                    Promote
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-cyan-300/50 bg-white/80 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            <Link2 className="h-4 w-4" />
            Intel Satellites
          </h2>
          <ul className="mt-3 space-y-2">
            {relatedArticles.length === 0 ? (
              <li className="rounded-md bg-cyan-50 px-3 py-3 text-xs text-slate-600">No matching articles.</li>
            ) : null}
            {relatedArticles.slice(0, 5).map((article) => (
              <li key={article.id} className="rounded-md bg-cyan-50 px-3 py-2">
                <p className="line-clamp-2 text-xs font-semibold text-slate-800">{article.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateArticleStatus(article.id, 'reading')}
                    className="rounded-md border border-cyan-300 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-700"
                  >
                    Reading
                  </button>
                  <button
                    onClick={() => updateArticleStatus(article.id, 'read')}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                  >
                    Read
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-cyan-300/50 bg-white/80 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            <Radio className="h-4 w-4" />
            Pulse Log
          </h2>
          <ul className="mt-3 space-y-2">
            {pulseLog.map((entry) => (
              <li key={`${entry.id}-${entry.timestamp}`} className="rounded-md bg-cyan-50 px-3 py-2">
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
    <div className="rounded-2xl border border-cyan-300/50 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}
