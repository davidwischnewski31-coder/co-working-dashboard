'use client'

import useSWR from 'swr'
import type { Task } from '@/lib/validations'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTasks(filters?: {
  status?: string
  project_id?: string
  owner_type?: string
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.project_id) params.append('project_id', filters.project_id)
  if (filters?.owner_type) params.append('owner_type', filters.owner_type)

  const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<Task[]>(url, fetcher)

  return {
    tasks: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export async function createTask(data: any) {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }

  return response.json()
}

export async function updateTask(id: string, data: any) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }

  return response.json()
}

export async function deleteTask(id: string) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete task')
  }

  return response.json()
}
