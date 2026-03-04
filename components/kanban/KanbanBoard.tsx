'use client'

import { useState } from 'react'
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import type { TaskStatus, WorkspaceTask } from '@/lib/workspace'

interface TaskBoardItem extends WorkspaceTask {
  project_name?: string
  project_color?: string
}

interface KanbanBoardProps {
  tasks: TaskBoardItem[]
  onTaskMove: (taskId: string, newStatus: string) => Promise<void>
}

const COLUMNS: { id: TaskStatus; title: string; tone: string }[] = [
  { id: 'backlog', title: 'Backlog', tone: 'bg-slate-50' },
  { id: 'todo', title: 'To Do', tone: 'bg-amber-50' },
  { id: 'in_progress', title: 'In Progress', tone: 'bg-blue-50' },
  { id: 'blocked', title: 'Blocked', tone: 'bg-rose-50' },
  { id: 'done', title: 'Done', tone: 'bg-emerald-50' },
]

export function KanbanBoard({ tasks, onTaskMove }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskBoardItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((item) => item.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)

    const { active, over } = event
    if (!over) {
      return
    }

    const taskId = active.id as string
    const status = over.id as TaskStatus

    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.status === status) {
      return
    }

    await onTaskMove(taskId, status)
  }

  function tasksByStatus(status: TaskStatus) {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tone={column.tone}
            tasks={tasksByStatus(column.id)}
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  )
}
