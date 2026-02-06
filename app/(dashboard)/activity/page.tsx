'use client'

import { useState, useEffect } from 'react'
import { AttributionBadge } from '@/components/kanban/AttributionBadge'
import { formatDateTime } from '@/lib/utils'

interface ActivityLogEntry {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor: string
  actor_type: 'human' | 'agent'
  timestamp: string
}

const actionColors: Record<string, string> = {
  created: 'text-green-600',
  updated: 'text-blue-600',
  completed: 'text-purple-600',
  moved: 'text-orange-600',
  deleted: 'text-red-600',
}

const entityEmojis: Record<string, string> = {
  task: '✓',
  project: '📁',
  idea: '💡',
  article: '📄',
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchActivities()
  }, [filter])

  async function fetchActivities() {
    setIsLoading(true)
    try {
      const params = filter !== 'all' ? `?actor_type=${filter}` : ''
      const response = await fetch(`/api/activity${params}`)
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading activity...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent actions by humans and AI agents
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('human')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'human'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            👤 Human
          </button>
          <button
            onClick={() => setFilter('agent')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'agent'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            🤖 Agent
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{entityEmojis[activity.entity_type] || '📄'}</span>
                  <div>
                    <p className="text-sm text-gray-900">
                      <AttributionBadge
                        owner={activity.actor}
                        ownerType={activity.actor_type}
                      />
                      {' '}
                      <span className={`font-medium ${actionColors[activity.action]}`}>
                        {activity.action}
                      </span>
                      {' '}
                      a <span className="font-medium">{activity.entity_type}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No activity to show
          </div>
        )}
      </div>
    </div>
  )
}
