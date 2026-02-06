'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Button } from '@/components/ui/button'
import { useTasks, updateTask, createTask } from '@/lib/hooks/use-tasks'
import { Plus } from 'lucide-react'

export default function KanbanPage() {
  const { tasks, isLoading, isError, mutate } = useTasks()
  const [isCreating, setIsCreating] = useState(false)

  async function handleTaskMove(taskId: string, newStatus: string) {
    try {
      await updateTask(taskId, { status: newStatus })
      mutate() // Refresh tasks
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  async function handleCreateTask() {
    setIsCreating(true)
    try {
      await createTask({
        title: 'New Task',
        owner: 'David',
        owner_type: 'human',
        status: 'todo',
        priority: 'medium',
      })
      mutate() // Refresh tasks
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Failed to load tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Kanban Board</h2>
          <p className="text-sm text-gray-500 mt-1">
            {tasks?.length || 0} total tasks
          </p>
        </div>
        <Button onClick={handleCreateTask} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <KanbanBoard
        tasks={tasks || []}
        onTaskMove={handleTaskMove}
      />
    </div>
  )
}
