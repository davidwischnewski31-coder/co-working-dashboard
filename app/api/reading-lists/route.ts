import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createReadingListSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/reading-lists - List all reading lists with articles
export async function GET() {
  try {
    const result = await db.query(`
      SELECT 
        rl.*,
        COUNT(a.id) as article_count,
        COUNT(CASE WHEN a.status = 'unread' THEN 1 END) as unread_count
      FROM reading_lists rl
      LEFT JOIN articles a ON rl.id = a.reading_list_id
      GROUP BY rl.id
      ORDER BY rl.created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching reading lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading lists' },
      { status: 500 }
    )
  }
}

// POST /api/reading-lists - Create a new reading list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createReadingListSchema.parse(body)

    const result = await db.query(
      `
      INSERT INTO reading_lists (name, description)
      VALUES ($1, $2)
      RETURNING *
      `,
      [validated.name, validated.description || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating reading list:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create reading list' },
      { status: 500 }
    )
  }
}
