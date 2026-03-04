'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import { useMemo, useState } from 'react'
import { Activity, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'
import type { ActivityEntityType, OwnerType } from '@/lib/workspace'

export default function ActivityPage() {
  const { data } = useWorkspace()
  const [actorFilter, setActorFilter] = useState<'all' | OwnerType>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | ActivityEntityType>('all')

  const filteredActivity = useMemo(() => {
    return data.activities
      .filter((entry) => (actorFilter === 'all' ? true : entry.actor_type === actorFilter))
      .filter((entry) => (entityFilter === 'all' ? true : entry.entity_type === entityFilter))
  }, [actorFilter, data.activities, entityFilter])

  return (
    <div className="space-y-6 variant-page variant-page-activity">
      <JourneyPanel page="activity" />
      <section className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Activity Timeline</h1>
            <p className="mt-1 text-sm text-slate-500">
              Every meaningful action is logged so you can track momentum and handoffs.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
            <Activity className="h-3.5 w-3.5" />
            {data.activities.length} events
          </span>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <select
          value={actorFilter}
          onChange={(event) => setActorFilter(event.target.value as 'all' | OwnerType)}
          className="rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All actors</option>
          <option value="human">David</option>
          <option value="agent">AI Partner</option>
        </select>

        <select
          value={entityFilter}
          onChange={(event) => setEntityFilter(event.target.value as 'all' | ActivityEntityType)}
          className="rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All entities</option>
          <option value="task">Tasks</option>
          <option value="project">Projects</option>
          <option value="idea">Ideas</option>
          <option value="article">Articles</option>
        </select>
      </section>

      <section className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
        <ul className="space-y-3">
          {filteredActivity.length === 0 ? (
            <li className="rounded-lg border border-dashed border-[#e7dbc7] px-4 py-8 text-center text-sm text-slate-500">
              No activity for these filters.
            </li>
          ) : null}

          {filteredActivity.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[#ece0ce] bg-[#fffdf9] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{entry.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(entry.timestamp)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-xs font-medium text-blue-700">
                    {entry.actor}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {entry.entity_type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-2.5 py-1 text-xs font-medium text-orange-700">
                    {entry.action}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
