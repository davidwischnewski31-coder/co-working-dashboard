'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, BookMarked, Sparkles, WandSparkles } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { WorkspaceArticle, WorkspaceIdea } from '@/lib/workspace'

function statusLabel(value: string): string {
  return value.replace('_', ' ')
}

export default function StoryEnginePage() {
  const { data, createIdea, createTask, moveTask, updateArticleStatus, updateIdeaStatus } = useWorkspace()
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)

  const signalArticles = data.articles.filter((article) => article.status === 'unread' || article.status === 'reading')
  const openIdeas = data.ideas.filter((idea) => idea.status !== 'shipped')
  const activeProjects = data.projects.filter((project) => project.status !== 'shipped')
  const activeScenes = data.tasks.filter((task) => task.status !== 'done')
  const proofScenes = data.tasks.filter((task) => task.status === 'done').slice(0, 8)

  const selectedArticle = signalArticles.find((article) => article.id === selectedArticleId) ?? signalArticles[0] ?? null
  const selectedIdea = openIdeas.find((idea) => idea.id === selectedIdeaId) ?? openIdeas[0] ?? null

  const arcDensity = useMemo(() => {
    return activeProjects.map((project) => {
      const relatedTasks = data.tasks.filter((task) => task.project_id === project.id)
      const relatedIdeas = data.ideas.filter((idea) => {
        const haystack = `${idea.title} ${idea.description ?? ''}`.toLowerCase()
        return project.name
          .toLowerCase()
          .split(/\s+/)
          .some((token) => token.length > 3 && haystack.includes(token))
      })

      return {
        project,
        relatedTasks,
        relatedIdeas,
      }
    })
  }, [activeProjects, data.ideas, data.tasks])

  function distillSignal(article: WorkspaceArticle | null) {
    if (!article) {
      return
    }

    createIdea({
      title: `Signal: ${article.title.slice(0, 80)}`,
      description: `Derived from ${article.url}`,
      category: 'research',
      status: 'research',
      owner_type: 'human',
    })
    updateArticleStatus(article.id, 'reading')
  }

  function forgeScene(idea: WorkspaceIdea | null) {
    if (!idea) {
      return
    }

    createTask({
      title: `Narrative test: ${idea.title}`,
      description: idea.description ?? 'Ship a minimal test and gather evidence.',
      project_id: activeProjects[0]?.id ?? null,
      priority: 'high',
      owner_type: 'human',
      tags: ['story-engine'],
    })
    updateIdeaStatus(idea.id, 'in_progress')
  }

  function shipCurrentScene() {
    const scene = activeScenes.find((task) => task.status === 'in_progress') ?? activeScenes[0]
    if (!scene) {
      return
    }

    moveTask(scene.id, 'done')
  }

  return (
    <div className="space-y-6 rounded-3xl bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#dbeafe] p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-violet-300/50 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Version 3</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Story Engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          Full narrative operating system. Translate input signals into thesis, execute scenes, then capture proof for future decisions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <PipelineLane
          title="Signals"
          subtitle="Reading + market input"
          items={signalArticles.map((article) => article.title)}
          tone="border-violet-200 bg-white/80"
        />
        <PipelineLane
          title="Thesis"
          subtitle="Open ideas"
          items={openIdeas.map((idea) => idea.title)}
          tone="border-blue-200 bg-white/80"
        />
        <PipelineLane
          title="Arcs"
          subtitle="Active projects"
          items={activeProjects.map((project) => project.name)}
          tone="border-cyan-200 bg-white/80"
        />
        <PipelineLane
          title="Scenes"
          subtitle="Execution tasks"
          items={activeScenes.map((task) => task.title)}
          tone="border-indigo-200 bg-white/80"
        />
        <PipelineLane
          title="Proof"
          subtitle="Completed scenes"
          items={proofScenes.map((task) => task.title)}
          tone="border-emerald-200 bg-white/80"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-violet-200 bg-white/85 p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BookMarked className="h-5 w-5 text-violet-600" />
            Signal Distillery
          </h2>
          <p className="mt-1 text-sm text-slate-600">Pull a reading signal into the idea pipeline.</p>

          <select
            value={selectedArticle?.id ?? ''}
            onChange={(event) => setSelectedArticleId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {signalArticles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>

          {selectedArticle ? (
            <div className="mt-4 rounded-xl bg-violet-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{selectedArticle.title}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedArticle.url}</p>
              <p className="mt-2 text-xs text-slate-500">Status: {selectedArticle.status}</p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-slate-600">No reading signals available.</p>
          )}

          <button
            onClick={() => distillSignal(selectedArticle)}
            disabled={!selectedArticle}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Convert Signal to Idea
          </button>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-white/85 p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <WandSparkles className="h-5 w-5 text-violet-600" />
            Arc Forge
          </h2>
          <p className="mt-1 text-sm text-slate-600">Promote an idea into an executable scene.</p>

          <select
            value={selectedIdea?.id ?? ''}
            onChange={(event) => setSelectedIdeaId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {openIdeas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>

          {selectedIdea ? (
            <div className="mt-4 rounded-xl bg-violet-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{selectedIdea.title}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedIdea.description ?? 'No description.'}</p>
              <p className="mt-2 text-xs text-slate-500">Stage: {statusLabel(selectedIdea.status)}</p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-slate-600">No ideas to promote.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => forgeScene(selectedIdea)}
              disabled={!selectedIdea}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Forge Scene Task
            </button>
            <button
              onClick={shipCurrentScene}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
            >
              Ship Current Scene
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-violet-200 bg-white/85 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Project Storyboard</h2>
          <ul className="mt-3 space-y-2">
            {arcDensity.map(({ project, relatedTasks, relatedIdeas }) => (
              <li key={project.id} className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {relatedTasks.length} scenes • {relatedIdeas.length} narrative cues
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-white/85 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Proof Library</h2>
          <ul className="mt-3 space-y-2">
            {proofScenes.length === 0 ? (
              <li className="rounded-lg bg-violet-50 px-3 py-3 text-xs text-slate-600">No proof scenes yet.</li>
            ) : null}
            {proofScenes.map((task) => (
              <li key={task.id} className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                <p className="mt-1 text-xs text-slate-600">Completed {task.completed_at ? formatDate(task.completed_at) : 'recently'}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-white/85 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Narrative Log</h2>
          <ul className="mt-3 space-y-2">
            {data.activities.slice(0, 7).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-2">
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

function PipelineLane({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string
  subtitle: string
  items: string[]
  tone: string
}) {
  return (
    <article className={`rounded-2xl border p-4 ${tone}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? <li className="rounded-md bg-white/70 px-2 py-2 text-xs text-slate-500">Empty lane</li> : null}
        {items.slice(0, 3).map((item) => (
          <li key={item} className="rounded-md bg-white/90 px-2 py-2 text-xs text-slate-700">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
        Flow
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </article>
  )
}
