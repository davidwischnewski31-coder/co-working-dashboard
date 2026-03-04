'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Tag } from 'lucide-react'
import { AttributionBadge } from './AttributionBadge'
import { formatDate } from '@/lib/utils'
import type { TaskPriority, WorkspaceTask } from '@/lib/workspace'

interface TaskCardProps {
  task: WorkspaceTask & {
    project_name?: string
    project_color?: string
  }
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-[#e6dbc8] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {task.project_name ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.project_color || '#64748b' }}
              />
              {task.project_name}
            </span>
          ) : null}
        </div>

        <h4 className="text-sm font-semibold leading-snug text-slate-900">{task.title}</h4>

        {task.description ? <p className="text-xs text-slate-600">{task.description}</p> : null}

        {task.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={`${task.id}-${tag}`}
                className="inline-flex items-center gap-1 rounded-md bg-[#f7f1e5] px-2 py-0.5 text-xs text-slate-600"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-[#efe4d3] pt-2">
          <AttributionBadge owner={task.owner} ownerType={task.owner_type} />
          {task.due_date ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No due date</span>
          )}
        </div>
      </div>
    </article>
  )
}
