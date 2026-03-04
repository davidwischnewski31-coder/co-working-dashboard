'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Logs } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { ActivityEntityType, OwnerType } from '@/lib/workspace'

const SHARED_ENTITIES: ActivityEntityType[] = ['shared_todo', 'calendar', 'shopping']

export default function SharedLogPage() {
  const { data } = useWorkspace()
  const [actorFilter, setActorFilter] = useState<'all' | OwnerType>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | ActivityEntityType>('all')

  const entries = useMemo(() => {
    return data.activities
      .filter((entry) => SHARED_ENTITIES.includes(entry.entity_type))
      .filter((entry) => (actorFilter === 'all' ? true : entry.actor_type === actorFilter))
      .filter((entry) => (entityFilter === 'all' ? true : entry.entity_type === entityFilter))
  }, [actorFilter, data.activities, entityFilter])

  const grouped = useMemo(() => {
    return entries.reduce<Record<string, typeof entries>>((groups, entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(entry)
      return groups
    }, {})
  }, [entries])

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8D8BF] bg-[#FFF8EE] p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold text-[#3D2A18] sm:text-2xl">Team Log</h1>
        <p className="mt-1 text-sm text-[#7A644F]">
          Auditable history of shared todo, calendar, and shopping updates.
        </p>
      </section>

      <section className="flex flex-wrap gap-2">
        <div className="relative">
          <select
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value as 'all' | OwnerType)}
            className="appearance-none rounded-lg border border-[#E8D8BF] bg-white py-2 pl-3 pr-8 text-sm text-[#7A644F] outline-none transition focus:border-[#C8620A]"
          >
            <option value="all">All actors</option>
            <option value="human">Human</option>
            <option value="agent">Agent</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A644F]" />
        </div>

        <div className="relative">
          <select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value as 'all' | ActivityEntityType)}
            className="appearance-none rounded-lg border border-[#E8D8BF] bg-white py-2 pl-3 pr-8 text-sm text-[#7A644F] outline-none transition focus:border-[#C8620A]"
          >
            <option value="all">All entities</option>
            <option value="shared_todo">Shared Todos</option>
            <option value="calendar">Calendar</option>
            <option value="shopping">Shopping</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A644F]" />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <Logs className="mx-auto h-5 w-5 text-[#7A644F]" aria-label="No shared activity" />
            <p className="mt-2 text-sm font-medium text-[#3D2A18]">No shared events yet</p>
            <p className="mt-1 text-xs text-[#7A644F]">As you update todos, calendar events, and shopping items, entries appear here.</p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([date, activities]) => (
              <div key={date}>
                <div className="mb-2 mt-4 flex items-center gap-3 first:mt-0">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">{date}</span>
                  <div className="flex-1 border-t border-[#E8D8BF]" />
                </div>
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-[#FFF8EE]">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4C1A4]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#3D2A18]">{activity.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-[#7A644F]">
                            {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className="rounded-full bg-[#FFF8EE] px-2 py-0.5 text-[11px] font-medium text-[#7A644F]">
                            {activity.actor}
                          </span>
                          <span className="rounded-full bg-[#FFF8EE] px-2 py-0.5 text-[11px] font-medium text-[#7A644F]">
                            {activity.entity_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
