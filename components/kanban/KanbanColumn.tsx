'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import type { TaskStatus, WorkspaceTask } from '@/lib/workspace'

interface TaskBoardItem extends WorkspaceTask {
  project_name?: string
  project_color?: string
}

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tone: string
  tasks: TaskBoardItem[]
}

export function KanbanColumn({ id, title, tone, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <section className="min-w-[290px] flex-1 rounded-xl border border-[#ebdec9] bg-[#fffdf8] p-3">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4a3620]">{title}</h3>
        <span className="rounded-full border border-[#d4c4a8] bg-white px-2.5 py-1 text-sm font-semibold text-[#4a3620] shadow-sm">
          {tasks.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`min-h-[320px] space-y-3 rounded-lg p-2 transition-colors ${tone} ${
          isOver ? 'ring-2 ring-orange-300' : ''
        }`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#e4d8c5] bg-white/70 px-3 py-6 text-center text-sm text-slate-500">
            Drop tasks here
          </div>
        ) : null}
      </div>
    </section>
  )
}
