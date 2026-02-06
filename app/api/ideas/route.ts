import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createIdeaSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/ideas - List all ideas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let query = 'SELECT * FROM ideas WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (status) {
      query += ` AND status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (category) {
      query += ` AND category = $${paramCount}`
      params.push(category)
      paramCount++
    }

    query += ' ORDER BY created_at DESC'

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching ideas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    )
  }
}

// POST /api/ideas - Create a new idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createIdeaSchema.parse(body)

    const result = await db.query(
      `
      INSERT INTO ideas (
        title, description, category, status,
        owner, owner_type, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        validated.title,
        validated.description || null,
        validated.category || null,
        validated.status || 'brainstorm',
        validated.owner,
        validated.owner_type,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
      ]
    )

    const idea = result.rows[0]

    // Log activity
    await db.query(
      `
      INSERT INTO activity_log (entity_type, entity_id, action, actor, actor_type)
      VALUES ($1, $2, $3, $4, $5)
      `,
      ['idea', idea.id, 'created', validated.owner, validated.owner_type]
    )

    return NextResponse.json(idea, { status: 201 })
  } catch (error) {
    console.error('Error creating idea:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    )
  }
}
