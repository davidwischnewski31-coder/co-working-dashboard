import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTaskSchema, type Task } from '@/lib/validations'
import { z } from 'zod'

// GET /api/tasks - List all tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const project_id = searchParams.get('project_id')
    const owner_type = searchParams.get('owner_type')

    let query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (status) {
      query += ` AND t.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (project_id) {
      query += ` AND t.project_id = $${paramCount}`
      params.push(project_id)
      paramCount++
    }

    if (owner_type) {
      query += ` AND t.owner_type = $${paramCount}`
      params.push(owner_type)
      paramCount++
    }

    query += ` ORDER BY t.created_at DESC`

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
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
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
