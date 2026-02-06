import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createProjectSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const external_source = searchParams.get('external_source')

    let query = 'SELECT * FROM projects WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (status) {
      query += ` AND status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (external_source) {
      query += ` AND external_source = $${paramCount}`
      params.push(external_source)
      paramCount++
    }

    query += ' ORDER BY created_at DESC'

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const result = await db.query(
      `
      INSERT INTO projects (
        name, description, status, color,
        external_source, external_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        validated.name,
        validated.description || null,
        validated.status || 'idea',
        validated.color || '#6B7280',
        validated.external_source || null,
        validated.external_id || null,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
