'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function ProgressDashboard() {
  const { data, isLoading } = useSWR('/api/stats', fetcher)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const { counts = {}, stats = [], projects = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Completed Tasks"
          value={counts.total_completed || 0}
          subtitle="All time"
          color="green"
        />
        <StatCard
          title="Active Tasks"
          value={counts.total_active || 0}
          subtitle="In progress + Todo"
          color="blue"
        />
        <StatCard
          title="David's Tasks"
          value={counts.active_human || 0}
          subtitle="Human assigned"
          color="purple"
        />
        <StatCard
          title="AI Tasks"
          value={counts.active_agent || 0}
          subtitle="Agent assigned"
          color="orange"
        />
      </div>

      {/* Velocity Chart (Last 4 Weeks) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Velocity</h3>
        <p className="text-sm text-gray-600 mb-6">Tasks completed per week (last 4 weeks)</p>

        {stats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No completion data yet</p>
        ) : (
          <div className="space-y-3">
            {stats.slice(0, 4).map((week: any, index: number) => {
              const weekDate = new Date(week.week)
              const total = week.tasks_completed || 0
              const humanPct = total > 0 ? ((week.human_tasks || 0) / total) * 100 : 0
              const agentPct = total > 0 ? ((week.agent_tasks || 0) / total) * 100 : 0

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDistanceToNow(weekDate, { addSuffix: true })}
                    </span>
                    <span className="font-medium text-gray-900">{total} tasks</span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                    {humanPct > 0 && (
                      <div
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${humanPct}%` }}
                      >
                        {week.human_tasks > 0 && `${week.human_tasks} 👤`}
                      </div>
                    )}
                    {agentPct > 0 && (
                      <div
                        className="bg-purple-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${agentPct}%` }}
                      >
                        {week.agent_tasks > 0 && `${week.agent_tasks} 🤖`}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Project Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Overview</h3>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No projects yet</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project: any) => (
              <div key={project.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{project.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    {project.active_tasks} active
                  </span>
                  <span className="text-green-600 font-medium">
                    {project.completed_tasks} done
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: number
  subtitle: string
  color: 'green' | 'blue' | 'purple' | 'orange'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-80">{subtitle}</p>
    </div>
  )
}
