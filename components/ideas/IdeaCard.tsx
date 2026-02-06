'use client'

import type { Idea } from '@/lib/validations'
import { AttributionBadge } from '@/components/kanban/AttributionBadge'
import { formatDate } from '@/lib/utils'

interface IdeaCardProps {
  idea: Idea
}

const statusColors = {
  brainstorm: 'bg-yellow-100 text-yellow-800',
  research: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  shipped: 'bg-green-100 text-green-800',
}

const categoryEmojis: Record<string, string> = {
  product: '📦',
  tool: '🔧',
  business: '💼',
  research: '🔬',
}

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {idea.category && (
              <span className="text-2xl">{categoryEmojis[idea.category] || '💡'}</span>
            )}
            <h3 className="font-semibold text-gray-900">{idea.title}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${statusColors[idea.status]}`}>
            {idea.status.replace('_', ' ')}
          </span>
        </div>

        {/* Description */}
        {idea.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {idea.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <AttributionBadge
            owner={idea.owner}
            ownerType={idea.owner_type}
          />
          <span className="text-xs text-gray-500">
            {formatDate(idea.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
