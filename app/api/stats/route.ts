import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get task stats from view
    const statsResult = await db.query(`
      SELECT
        week,
        tasks_completed,
        human_tasks,
        agent_tasks,
        high_priority,
        medium_priority,
        low_priority
      FROM task_stats
      ORDER BY week DESC
      LIMIT 8
    `)

    // Get overall counts
    const countsResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'done') as total_completed,
        COUNT(*) FILTER (WHERE status = 'todo' OR status = 'in_progress') as total_active,
        COUNT(*) FILTER (WHERE status = 'backlog') as total_backlog,
        COUNT(*) FILTER (WHERE assignee_type = 'human' AND status != 'done') as active_human,
        COUNT(*) FILTER (WHERE assignee_type = 'agent' AND status != 'done') as active_agent
      FROM tasks
    `)

    // Get project breakdown
    const projectsResult = await db.query(`
      SELECT
        p.id,
        p.name,
        p.color,
        COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status != 'done') as active_tasks
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id, p.name, p.color
      ORDER BY active_tasks DESC, completed_tasks DESC
    `)

    return NextResponse.json({
      stats: statsResult.rows,
      counts: countsResult.rows[0] || {},
      projects: projectsResult.rows,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
