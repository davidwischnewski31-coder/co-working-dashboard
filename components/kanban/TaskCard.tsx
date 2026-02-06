'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AttributionBadge } from './AttributionBadge'
import { Calendar, Tag } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/lib/validations'

interface TaskCardProps {
  task: Task & { project_name?: string; project_color?: string }
}

export function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-medium text-gray-900 leading-snug">{task.title}</h4>

        {/* Description (if present) */}
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}

        {/* Project Badge */}
        {task.project_name && (
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: task.project_color || '#6B7280' }}
            />
            <span className="text-xs text-gray-500">{task.project_name}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Attribution */}
          <AttributionBadge
            owner={task.owner}
            ownerType={task.owner_type}
            metadata={task.agent_metadata}
          />

          {/* Priority & Due Date */}
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
              </span>
            )}
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
