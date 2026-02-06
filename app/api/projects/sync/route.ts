import { NextResponse } from 'next/server'
import { syncProjectsFromDavidAI } from '@/lib/sync/sync-projects'

// POST /api/projects/sync - Sync projects from davidai
export async function POST() {
  try {
    const result = await syncProjectsFromDavidAI()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync projects', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
