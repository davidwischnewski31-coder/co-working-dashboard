'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from '@/components/kanban/TaskCard'
import { QuickCreateTask } from '@/components/QuickCreateTask'
import { ProgressDashboard } from '@/components/ProgressDashboard'
import { Plus, BarChart3 } from 'lucide-react'
import type { Task } from '@/lib/validations'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type PriorityLane = 'high' | 'medium' | 'low' | 'backlog'

const PRIORITY_LANES: { id: PriorityLane; title: string; description: string }[] = [
  { id: 'high', title: 'High Priority', description: 'Urgent tasks requiring immediate attention' },
  { id: 'medium', title: 'Medium Priority', description: 'Important tasks to complete soon' },
  { id: 'low', title: 'Low Priority', description: 'Nice to have, can be scheduled flexibly' },
  { id: 'backlog', title: 'Backlog', description: 'Tasks for future consideration' },
]

export default function V2Dashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { data: tasks = [], mutate } = useSWR<(Task & { project_name?: string; project_color?: string })[]>(
    selectedProject ? `/api/tasks?project_id=${selectedProject}` : '/api/tasks',
    fetcher
  )
  const { data: projects = [] } = useSWR('/api/projects', fetcher)

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowQuickCreate(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group tasks by priority
  const tasksByPriority = {
    high: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent'),
    medium: tasks.filter(t => t.priority === 'medium'),
    low: tasks.filter(t => t.priority === 'low'),
    backlog: tasks.filter(t => t.status === 'backlog'),
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const targetLane = over.id as PriorityLane

    // Determine new priority based on lane
    let newPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
    let newStatus: 'backlog' | 'todo' = 'todo'

    if (targetLane === 'high') newPriority = 'high'
    else if (targetLane === 'medium') newPriority = 'medium'
    else if (targetLane === 'low') newPriority = 'low'
    else if (targetLane === 'backlog') {
      newPriority = 'low'
      newStatus = 'backlog'
    }

    // Optimistic update
    mutate(
      tasks.map(t =>
        t.id === taskId
          ? { ...t, priority: newPriority, status: newStatus }
          : t
      ),
      false
    )

    // API update
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority, status: newStatus }),
      })
      mutate()
    } catch (error) {
      console.error('Failed to update task:', error)
      mutate() // Revert on error
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Priority Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Organize tasks by priority level</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button
              onClick={() => setShowQuickCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Quick Add (⌘K)
            </button>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="border-b border-gray-200 bg-white px-6 py-4 max-h-96 overflow-y-auto">
          <ProgressDashboard />
        </div>
      )}

      {/* Sidebar + Lanes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Project Filter Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Filter by Project
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedProject(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedProject === null
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Projects
            </button>
            {projects.map((project: any) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  selectedProject === project.id
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Lanes */}
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full flex gap-4 p-6 min-w-max">
              {PRIORITY_LANES.map(lane => (
                <div key={lane.id} className="w-80 flex flex-col">
                  {/* Lane Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold text-gray-900">{lane.title}</h2>
                      <span className="text-sm font-medium text-gray-500">
                        {tasksByPriority[lane.id].length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{lane.description}</p>
                  </div>

                  {/* Lane Drop Zone */}
                  <SortableContext
                    id={lane.id}
                    items={tasksByPriority[lane.id].map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto space-y-3 min-h-[200px]">
                      {tasksByPriority[lane.id].length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                          No tasks in this lane
                        </p>
                      ) : (
                        tasksByPriority[lane.id].map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* Quick Create Modal */}
      <QuickCreateTask
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
