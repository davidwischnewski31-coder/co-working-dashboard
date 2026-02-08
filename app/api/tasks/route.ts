import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTaskSchema, type Task } from '@/lib/validations'
import { z } from 'zod'

// GET /api/tasks - List all tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const project_id = searchParams.get('project_id')
    const assignee_type = searchParams.get('assignee_type')

    let query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status != 'done'
    `
    const params: any[] = []
    let paramCount = 1

    if (status) {
      query += ` AND t.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (priority) {
      query += ` AND t.priority = $${paramCount}`
      params.push(priority)
      paramCount++
    }

    if (project_id) {
      query += ` AND t.project_id = $${paramCount}`
      params.push(project_id)
      paramCount++
    }

    if (assignee_type) {
      query += ` AND t.assignee_type = $${paramCount}`
      params.push(assignee_type)
      paramCount++
    }

    // V2: Order by priority (high first) then position
    query += ` ORDER BY
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      t.position ASC,
      t.created_at DESC
    `

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    console.error('Database URL exists:', !!process.env.DATABASE_URL)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    const result = await db.query(
      `
      INSERT INTO tasks (
        title, description, project_id, status, priority,
        owner, owner_type, agent_metadata, tags, due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        validated.title,
        validated.description || null,
        validated.project_id || null,
        validated.status || 'todo',
        validated.priority || 'medium',
        validated.owner,
        validated.owner_type,
        validated.agent_metadata ? JSON.stringify(validated.agent_metadata) : null,
        validated.tags || null,
        validated.due_date || null,
      ]
    )

    const task = result.rows[0]

    // Log activity
    await db.query(
      `
      INSERT INTO activity_log (entity_type, entity_id, action, actor, actor_type)
      VALUES ($1, $2, $3, $4, $5)
      `,
      ['task', task.id, 'created', validated.owner, validated.owner_type]
    )

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
