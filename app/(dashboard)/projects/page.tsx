'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { useProjects, syncProjects } from '@/lib/hooks/use-projects'
import { RefreshCw } from 'lucide-react'

export default function ProjectsPage() {
  const { projects, isLoading, isError, mutate } = useProjects()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleSync() {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncProjects()
      setSyncResult(
        `Synced ${result.synced} projects (${result.created} created, ${result.updated} updated)`
      )
      mutate() // Refresh projects list
    } catch (error) {
      setSyncResult('Failed to sync projects')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Failed to load projects</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">
            {projects?.length || 0} total projects
          </p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Projects'}
        </Button>
      </div>

      {syncResult && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">{syncResult}</p>
        </div>
      )}

      <ProjectGrid projects={projects || []} />
    </div>
  )
}
