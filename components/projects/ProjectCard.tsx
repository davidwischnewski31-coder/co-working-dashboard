'use client'

import type { Project } from '@/lib/validations'
import { formatDate } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

const statusColors = {
  idea: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  shipped: 'bg-blue-100 text-blue-800',
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              {project.external_source && (
                <p className="text-xs text-gray-500">
                  Synced from {project.external_source}
                </p>
              )}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span>Created {formatDate(project.created_at)}</span>
          {project.updated_at && (
            <span>Updated {formatDate(project.updated_at)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
