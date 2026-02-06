'use client'

import useSWR from 'swr'
import type { Project } from '@/lib/validations'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useProjects(filters?: {
  status?: string
  external_source?: string
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.external_source) params.append('external_source', filters.external_source)

  const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<Project[]>(url, fetcher)

  return {
    projects: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export async function syncProjects() {
  const response = await fetch('/api/projects/sync', {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to sync projects')
  }

  return response.json()
}

export async function createProject(data: any) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create project')
  }

  return response.json()
}
