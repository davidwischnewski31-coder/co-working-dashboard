'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'
import Link from 'next/link'

import { useMemo, useState } from 'react'
import { ArrowRight, Lightbulb, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate, formatDaysInStatus } from '@/lib/utils'
import type { IdeaCategory, IdeaStatus, OwnerType, WorkspaceIdea } from '@/lib/workspace'

const STATUS_ORDER: Array<Exclude<IdeaStatus, 'archived'>> = ['brainstorm', 'research', 'in_progress', 'shipped']

const STATUS_LABELS: Record<IdeaStatus, string> = {
  brainstorm: 'Brainstorm',
  research: 'Research',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  archived: 'Archived',
}

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  product: 'Product',
  tool: 'Tool',
  business: 'Business',
  research: 'Research',
}

function nextIdeaStatus(status: IdeaStatus): IdeaStatus {
  if (status === 'archived') {
    return 'archived'
  }

  const index = STATUS_ORDER.indexOf(status)
  if (index < 0) {
    return status
  }
  return index >= STATUS_ORDER.length - 1 ? status : STATUS_ORDER[index + 1]
}

function daysSince(updatedAt: string): number {
  const updated = new Date(updatedAt).getTime()
  if (Number.isNaN(updated)) {
    return 0
  }

  return Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24))
}

export default function IdeasPage() {
  const { data, createIdea, createTask, updateIdeaStatus } = useWorkspace()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IdeaCategory>('product')
  const [ownerType, setOwnerType] = useState<OwnerType>('human')
  const [statusFilter, setStatusFilter] = useState<'all' | IdeaStatus>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [formExpanded, setFormExpanded] = useState(false)
  const [taskPromptIdea, setTaskPromptIdea] = useState<WorkspaceIdea | null>(null)
  const [whyNow, setWhyNow] = useState('')

  const activeIdeas = useMemo(() => data.ideas.filter((idea) => idea.status !== 'archived'), [data.ideas])
  const archivedIdeas = useMemo(() => data.ideas.filter((idea) => idea.status === 'archived'), [data.ideas])

  const filteredIdeas = useMemo(() => {
    return activeIdeas.filter((idea) => (statusFilter === 'all' ? true : idea.status === statusFilter))
  }, [activeIdeas, statusFilter])

  const ideasByStatus = useMemo(() => {
    const grouped: Record<Exclude<IdeaStatus, 'archived'>, WorkspaceIdea[]> = {
      brainstorm: [],
      research: [],
      in_progress: [],
      shipped: [],
    }

    for (const idea of filteredIdeas) {
      if (idea.status === 'archived') {
        continue
      }
      grouped[idea.status].push(idea)
    }

    return grouped
  }, [filteredIdeas])

  const staleIdeas = useMemo(() => {
    return activeIdeas.filter((idea) => idea.status === 'brainstorm' && daysSince(idea.updated_at) >= 14)
  }, [activeIdeas])

  function handleCreateIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      return
    }

    createIdea({
      title: normalizedTitle,
      description,
      category,
      owner_type: ownerType,
      status: 'brainstorm',
    })

    setTitle('')
    setDescription('')
    setCategory('product')
    setOwnerType('human')
    setFormExpanded(false)
  }

  function handleAdvanceIdea(idea: WorkspaceIdea) {
    const nextStatus = nextIdeaStatus(idea.status)
    if (nextStatus === idea.status) {
      return
    }

    if (idea.status === 'research' && nextStatus === 'in_progress') {
      setTaskPromptIdea(idea)
      setWhyNow('')
      return
    }

    updateIdeaStatus(idea.id, nextStatus)
  }

  return (
    <div className="space-y-6 variant-page variant-page-ideas">
      <JourneyPanel page="ideas" />
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Ideas Pipeline</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Capture sparks fast, then deliberately move the best ones toward shipping.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F4F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
            <Lightbulb className="h-3.5 w-3.5" />
            {data.ideas.length} total ideas
          </span>
        </div>

        {!formExpanded ? (
          <button
            type="button"
            onClick={() => setFormExpanded(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#E8E2D8] px-4 py-3 text-sm text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
          >
            <Plus className="h-4 w-4" />
            Capture an idea...
          </button>
        ) : (
          <form onSubmit={handleCreateIdea} className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Idea
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What problem or opportunity did you spot?"
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Notes
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Why this matters now"
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A] focus:ring-2 focus:ring-[#FEF3E2]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as IdeaCategory)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
              >
                <option value="product">Product</option>
                <option value="tool">Tool</option>
                <option value="business">Business</option>
                <option value="research">Research</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Owner
              </label>
              <select
                value={ownerType}
                onChange={(event) => setOwnerType(event.target.value as OwnerType)}
                className="w-full rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714]"
              >
                <option value="human">David</option>
                <option value="agent">AI</option>
              </select>
            </div>

            <div className="lg:col-span-1 lg:self-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8620A] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="lg:col-span-12">
              <button
                type="button"
                onClick={() => setFormExpanded(false)}
                className="text-sm text-[#7A6F65] hover:text-[#1C1714]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {['all', ...STATUS_ORDER].map((status) => {
          const value = status as 'all' | IdeaStatus
          const label = value === 'all' ? 'All' : STATUS_LABELS[value]
          const count = value === 'all' ? activeIdeas.length : activeIdeas.filter((idea) => idea.status === value).length

          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-[#1C1714] text-white'
                  : 'border border-[#E8E2D8] bg-white text-[#7A6F65] hover:bg-[#FAFAF9]'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      <section className="flex gap-4 overflow-x-auto">
        {STATUS_ORDER.map((status) => {
          const isEmpty = ideasByStatus[status].length === 0
          const isShipped = status === 'shipped'

          return (
            <article
              key={status}
              className={`rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm transition-all ${
                isEmpty && isShipped
                  ? 'min-w-[140px] max-w-[180px] border-dashed bg-[#FFFDF8] opacity-75'
                  : 'min-w-[200px] flex-1'
              }`}
            >
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                {STATUS_LABELS[status]}
              </h2>
              <p className="mb-3 text-xs text-[#7A6F65]">{ideasByStatus[status].length} ideas</p>

              <div className="space-y-3">
                {ideasByStatus[status].length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed px-3 py-4 text-center text-sm ${
                      isShipped ? 'border-[#E6D8C2] text-[#8A7C70]' : 'border-[#E8E2D8] text-[#7A6F65]'
                    }`}
                  >
                    {isShipped ? 'Ready for your first shipped idea.' : 'No ideas here'}
                  </div>
                ) : null}

                {ideasByStatus[status].map((idea) => (
                  <div key={idea.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                    <p className="text-sm font-semibold text-[#1C1714]">{idea.title}</p>
                    {idea.description ? (
                      <p className="mt-1 text-xs text-[#7A6F65]">{idea.description}</p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
                        {CATEGORY_LABELS[idea.category]}
                      </span>
                      <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
                        {idea.owner}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href="/kanban" className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]">
                        Open Kanban
                      </Link>
                      <Link href="/projects" className="rounded-md border border-[#E8E2D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]">
                        Open Projects
                      </Link>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#7A6F65]">
                        Updated {formatDate(idea.updated_at)} · {formatDaysInStatus(idea.updated_at)}
                      </span>
                      <button
                        onClick={() => handleAdvanceIdea(idea)}
                        disabled={idea.status === 'shipped'}
                        className="inline-flex items-center gap-1 rounded-md border border-[#D0C8BE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Advance
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1C1714]">Stale - no movement in 14+ days</h2>
          <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">{staleIdeas.length}</span>
        </div>

        {staleIdeas.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-3 text-sm text-[#7A6F65]">
            No stale ideas right now.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {staleIdeas.map((idea) => (
              <li key={idea.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                <p className="text-sm font-semibold text-[#1C1714]">{idea.title}</p>
                <p className="mt-1 text-xs text-[#7A6F65]">Updated {daysSince(idea.updated_at)} days ago</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateIdeaStatus(idea.id, 'brainstorm')}
                    className="rounded-md border border-[#D0C8BE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => updateIdeaStatus(idea.id, 'archived')}
                    className="rounded-md border border-[#E3C3C9] bg-white px-2.5 py-1.5 text-xs font-medium text-[#8F4A55] transition-colors hover:border-[#C05A69] hover:text-[#C05A69]"
                  >
                    Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-[#7A6F65]">
          Archived ideas stay out of the active pipeline but remain available for review.
        </p>
        <button
          type="button"
          onClick={() => setShowArchived((current) => !current)}
          className="mt-3 rounded-md border border-[#D0C8BE] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
        >
          {showArchived ? 'Hide archived ideas' : 'Show archived ideas'}
        </button>

        {showArchived ? (
          archivedIdeas.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-3 text-sm text-[#7A6F65]">
              No archived ideas yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {archivedIdeas.map((idea) => (
                <li key={idea.id} className="rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                  <p className="text-sm font-semibold text-[#1C1714]">{idea.title}</p>
                  <p className="mt-1 text-xs text-[#7A6F65]">Archived {formatDate(idea.updated_at)}</p>
                  <button
                    onClick={() => updateIdeaStatus(idea.id, 'brainstorm')}
                    className="mt-2 rounded-md border border-[#D0C8BE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                  >
                    Restore to Brainstorm
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      {taskPromptIdea ? (
        <>
          <button
            type="button"
            aria-label="Close create task prompt"
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => {
              updateIdeaStatus(taskPromptIdea.id, 'in_progress')
              setTaskPromptIdea(null)
              setWhyNow('')
            }}
          />
          <div className="fixed inset-x-4 top-24 z-40 mx-auto w-full max-w-lg rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1C1714]">Create task from idea?</h3>
            <p className="mt-1 text-sm text-[#7A6F65]">
              This idea is now in progress. Create a task so it lands directly in execution.
            </p>
            <p className="mt-2 rounded-lg bg-[#FAFAF9] px-3 py-2 text-sm font-medium text-[#1C1714]">
              {taskPromptIdea.title}
            </p>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                Why now? <span className="font-normal normal-case">(optional)</span>
              </span>
              <textarea
                value={whyNow}
                onChange={(event) => setWhyNow(event.target.value)}
                placeholder="What makes this the right moment to start?"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1714] outline-none transition focus:border-[#C8620A]"
              />
            </label>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => {
                  const due = new Date()
                  due.setDate(due.getDate() + 7)
                  createTask({
                    title: taskPromptIdea.title,
                    description: [taskPromptIdea.description ?? 'Created from ideas pipeline.', whyNow.trim() ? `Why now: ${whyNow.trim()}` : '']
                      .filter(Boolean)
                      .join('\n\n'),
                    priority: 'high',
                    owner_type: taskPromptIdea.owner_type,
                    due_date: due.toISOString(),
                    tags: ['idea', 'in-progress'],
                  })
                  updateIdeaStatus(taskPromptIdea.id, 'in_progress')
                  setTaskPromptIdea(null)
                  setWhyNow('')
                }}
                className="rounded-lg bg-[#C8620A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
                type="button"
              >
                Create task
              </button>
              <button
                onClick={() => {
                  updateIdeaStatus(taskPromptIdea.id, 'in_progress')
                  setTaskPromptIdea(null)
                  setWhyNow('')
                }}
                className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm font-semibold text-[#7A644F] transition-colors hover:border-[#D0C8BE]"
                type="button"
              >
                Not yet
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
