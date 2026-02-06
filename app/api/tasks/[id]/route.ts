import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateTaskSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await db.query(
      `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    // Get current task for activity log
    const currentResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id])
    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    const currentTask = currentResult.rows[0]

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const updateFields = {
      title: validated.title,
      description: validated.description,
      project_id: validated.project_id,
      status: validated.status,
      priority: validated.priority,
      owner: validated.owner,
      owner_type: validated.owner_type,
      agent_metadata: validated.agent_metadata ? JSON.stringify(validated.agent_metadata) : undefined,
      tags: validated.tags,
      due_date: validated.due_date,
    }

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(currentTask)
    }

    values.push(id)
    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await db.query(query, values)
    const updatedTask = result.rows[0]

    // Determine action for activity log
    let action = 'updated'
    if (validated.status && validated.status !== currentTask.status) {
      if (validated.status === 'done') {
        action = 'completed'
      } else {
        action = 'moved'
      }
    }

    // Log activity
    await db.query(
      `
      INSERT INTO activity_log (entity_type, entity_id, action, actor, actor_type, changes)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        'task',
        id,
        action,
        validated.owner || currentTask.owner,
        validated.owner_type || currentTask.owner_type,
        JSON.stringify({ before: currentTask, after: updatedTask })
      ]
    )

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get task for activity log
    const currentResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id])
    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    const task = currentResult.rows[0]

    // Log activity before deletion
    await db.query(
      `
      INSERT INTO activity_log (entity_type, entity_id, action, actor, actor_type)
      VALUES ($1, $2, $3, $4, $5)
      `,
      ['task', id, 'deleted', task.owner, task.owner_type]
    )

    // Delete task
    await db.query('DELETE FROM tasks WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
