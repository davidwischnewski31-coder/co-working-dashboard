import { db } from '@/lib/db'
import { getDavidAIProjects, type ParsedProject } from './markdown-parser'

export interface SyncResult {
  synced: number
  created: number
  updated: number
  errors: number
  projects: string[]
}

export async function syncProjectsFromDavidAI(davidaiPath: string = '/Users/David/davidai'): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    created: 0,
    updated: 0,
    errors: 0,
    projects: [],
  }

  try {
    // Get all projects from davidai
    const projects = getDavidAIProjects(davidaiPath)

    for (const project of projects) {
      try {
        // Check if project already exists
        const existing = await db.query(
          'SELECT id FROM projects WHERE external_source = $1 AND external_id = $2',
          ['davidai', project.name]
        )

        if (existing.rows.length > 0) {
          // Update existing project
          await db.query(
            `
            UPDATE projects
            SET name = $1, description = $2, status = $3, metadata = $4, updated_at = NOW()
            WHERE external_source = 'davidai' AND external_id = $5
            `,
            [
              project.name,
              project.description,
              project.status,
              JSON.stringify(project.metadata),
              project.name,
            ]
          )
          result.updated++
        } else {
          // Create new project
          await db.query(
            `
            INSERT INTO projects (name, description, status, external_source, external_id, metadata)
            VALUES ($1, $2, $3, 'davidai', $4, $5)
            `,
            [
              project.name,
              project.description,
              project.status,
              project.name,
              JSON.stringify(project.metadata),
            ]
          )
          result.created++
        }

        result.synced++
        result.projects.push(project.name)
      } catch (error) {
        console.error(`Failed to sync project ${project.name}:`, error)
        result.errors++
      }
    }

    return result
  } catch (error) {
    console.error('Sync failed:', error)
    throw error
  }
}
