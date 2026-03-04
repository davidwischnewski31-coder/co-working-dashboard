'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import { useMemo, useState } from 'react'
import { ArrowRight, Lightbulb, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'
import type { IdeaCategory, IdeaStatus, OwnerType, WorkspaceIdea } from '@/lib/workspace'

const STATUS_ORDER: IdeaStatus[] = ['brainstorm', 'research', 'in_progress', 'shipped']

const STATUS_LABELS: Record<IdeaStatus, string> = {
  brainstorm: 'Brainstorm',
  research: 'Research',
  in_progress: 'In Progress',
  shipped: 'Shipped',
}

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  product: 'Product',
  tool: 'Tool',
  business: 'Business',
  research: 'Research',
}

function nextIdeaStatus(status: IdeaStatus): IdeaStatus {
  const index = STATUS_ORDER.indexOf(status)
  return index >= STATUS_ORDER.length - 1 ? status : STATUS_ORDER[index + 1]
}

export default function IdeasPage() {
  const { data, createIdea, updateIdeaStatus } = useWorkspace()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IdeaCategory>('product')
  const [ownerType, setOwnerType] = useState<OwnerType>('human')
  const [statusFilter, setStatusFilter] = useState<'all' | IdeaStatus>('all')

  const filteredIdeas = useMemo(() => {
    return data.ideas.filter((idea) => (statusFilter === 'all' ? true : idea.status === statusFilter))
  }, [data.ideas, statusFilter])

  const ideasByStatus = useMemo(() => {
    const grouped: Record<IdeaStatus, WorkspaceIdea[]> = {
      brainstorm: [],
      research: [],
      in_progress: [],
      shipped: [],
    }

    for (const idea of filteredIdeas) {
      grouped[idea.status].push(idea)
    }

    return grouped
  }, [filteredIdeas])

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
  }

  return (
    <div className="space-y-6 variant-page variant-page-ideas">
      <JourneyPanel page="ideas" />
      <section className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Ideas Pipeline</h1>
            <p className="mt-1 text-sm text-slate-500">
              Capture sparks fast, then deliberately move the best ones toward shipping.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
            <Lightbulb className="h-3.5 w-3.5" />
            {data.ideas.length} total ideas
          </span>
        </div>

        <form onSubmit={handleCreateIdea} className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Idea
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What problem or opportunity did you spot?"
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Notes
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Why this matters now"
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Category
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as IdeaCategory)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800"
            >
              <option value="product">Product</option>
              <option value="tool">Tool</option>
              <option value="business">Business</option>
              <option value="research">Research</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Owner
            </label>
            <select
              value={ownerType}
              onChange={(event) => setOwnerType(event.target.value as OwnerType)}
              className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf9] px-3 py-2.5 text-sm text-slate-800"
            >
              <option value="human">David</option>
              <option value="agent">AI</option>
            </select>
          </div>

          <div className="lg:col-span-1 lg:self-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef6c00] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d75b00]"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap gap-2">
        {['all', ...STATUS_ORDER].map((status) => {
          const value = status as 'all' | IdeaStatus
          const label = value === 'all' ? 'All' : STATUS_LABELS[value]
          const count = value === 'all' ? data.ideas.length : data.ideas.filter((idea) => idea.status === value).length

          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-slate-900 text-white'
                  : 'border border-[#e4d8c3] bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <article key={status} className="rounded-2xl border border-[#e6dac6] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
              {STATUS_LABELS[status]}
            </h2>
            <p className="mb-3 text-xs text-slate-500">{ideasByStatus[status].length} ideas</p>

            <div className="space-y-3">
              {ideasByStatus[status].length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#e9decd] px-3 py-4 text-center text-sm text-slate-500">
                  No ideas here
                </div>
              ) : null}

              {ideasByStatus[status].map((idea) => (
                <div key={idea.id} className="rounded-lg border border-[#ecdfcd] bg-[#fffdf9] p-3">
                  <p className="text-sm font-semibold text-slate-900">{idea.title}</p>
                  {idea.description ? (
                    <p className="mt-1 text-xs text-slate-600">{idea.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {CATEGORY_LABELS[idea.category]}
                    </span>
                    <span className="rounded-full bg-[#fff2df] px-2 py-0.5 text-[11px] font-medium text-orange-800">
                      {idea.owner}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">Updated {formatDate(idea.updated_at)}</span>
                    <button
                      onClick={() => updateIdeaStatus(idea.id, nextIdeaStatus(idea.status))}
                      disabled={idea.status === 'shipped'}
                      className="inline-flex items-center gap-1 rounded-md border border-[#e7dac5] bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Advance
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
