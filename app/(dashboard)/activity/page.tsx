'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { ActivityEntityType, OwnerType } from '@/lib/workspace'

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    Boolean(target.closest('[contenteditable="true"]'))
  )
}

export default function ActivityPage() {
  const { data } = useWorkspace()
  const [actorFilter, setActorFilter] = useState<'all' | OwnerType>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | ActivityEntityType>('all')
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const filteredActivity = useMemo(() => {
    return data.activities
      .filter((entry) => (actorFilter === 'all' ? true : entry.actor_type === actorFilter))
      .filter((entry) => (entityFilter === 'all' ? true : entry.entity_type === entityFilter))
  }, [actorFilter, data.activities, entityFilter])

  const groupedActivities = useMemo(() => {
    return filteredActivity.reduce<Record<string, typeof filteredActivity>>((groups, activity) => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(activity)
      return groups
    }, {})
  }, [filteredActivity])

  const activityIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    filteredActivity.forEach((entry, index) => {
      map.set(entry.id, index)
    })
    return map
  }, [filteredActivity])

  useEffect(() => {
    if (filteredActivity.length === 0) {
      setFocusedIndex(null)
      return
    }

    if (focusedIndex === null || focusedIndex >= filteredActivity.length) {
      setFocusedIndex(0)
    }
  }, [filteredActivity.length, focusedIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingElement(event.target)) {
        return
      }

      if (event.key === 'j') {
        event.preventDefault()
        if (filteredActivity.length === 0) {
          return
        }

        setFocusedIndex((current) => {
          if (current === null) {
            return 0
          }
          return Math.min(current + 1, filteredActivity.length - 1)
        })
      }

      if (event.key === 'k') {
        event.preventDefault()
        if (filteredActivity.length === 0) {
          return
        }

        setFocusedIndex((current) => {
          if (current === null) {
            return 0
          }
          return Math.max(current - 1, 0)
        })
      }

      if (event.key === 'Enter' && focusedIndex !== null) {
        const activeEntry = filteredActivity[focusedIndex]
        if (!activeEntry) {
          return
        }

        event.preventDefault()
        setActorFilter(activeEntry.actor_type)
        setEntityFilter(activeEntry.entity_type)
      }

      if (event.key === 'Escape') {
        setFocusedIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredActivity, focusedIndex])

  const showSparseHint = filteredActivity.length > 0 && filteredActivity.length <= 3

  return (
    <div className="space-y-6 variant-page variant-page-activity">
      <JourneyPanel page="activity" />
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Activity Timeline</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Every meaningful action is logged so you can track momentum and handoffs.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F4F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
            <Activity className="h-3.5 w-3.5" />
            {data.activities.length} events
          </span>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <div className="relative">
          <select
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value as 'all' | OwnerType)}
            className="appearance-none rounded-lg border border-[#E8E2D8] bg-white py-2 pl-3 pr-8 text-sm text-[#7A6F65] outline-none transition focus:border-[#C8620A]"
          >
            <option value="all">All actors</option>
            <option value="human">David</option>
            <option value="agent">AI Partner</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A6F65]" />
        </div>

        <div className="relative">
          <select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value as 'all' | ActivityEntityType)}
            className="appearance-none rounded-lg border border-[#E8E2D8] bg-white py-2 pl-3 pr-8 text-sm text-[#7A6F65] outline-none transition focus:border-[#C8620A]"
          >
            <option value="all">All entities</option>
            <option value="task">Tasks</option>
            <option value="project">Projects</option>
            <option value="idea">Ideas</option>
            <option value="article">Articles</option>
            <option value="workspace">Workspace</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A6F65]" />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-3 text-[11px] text-[#7A6F65]">Keyboard: `j` / `k` to move, `Enter` to focus filters, `Esc` to clear focus.</p>
        {filteredActivity.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-[#1C1714]">No activity yet</p>
            <p className="mt-1 text-xs text-[#7A6F65]">Actions across the workspace will appear here as you work.</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedActivities).map(([date, activities]) => (
              <div key={date}>
                <div className="mb-2 mt-4 flex items-center gap-3 first:mt-0">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">{date}</span>
                  <div className="flex-1 border-t border-[#E8E2D8]" />
                </div>
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-[#FAFAF9] ${
                        focusedIndex !== null && activityIndexMap.get(activity.id) === focusedIndex
                          ? 'bg-[#FAFAF9] ring-1 ring-[#E8E2D8]'
                          : ''
                      }`}
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D0C8BE]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#1C1714]">{activity.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-[#7A6F65]">
                            {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
                            {activity.actor}
                          </span>
                          <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
                            {activity.entity_type}
                          </span>
                          <span className="rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[11px] font-medium text-[#7A6F65]">
                            {activity.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {showSparseHint ? (
              <p className="mt-4 rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-4 py-3 text-sm text-[#7A6F65]">
                Actions you take across the workspace appear here.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
