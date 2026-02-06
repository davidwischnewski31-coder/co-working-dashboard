import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createArticleSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/articles - List articles (optionally filtered by reading list)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reading_list_id = searchParams.get('reading_list_id')

    let query = 'SELECT * FROM articles WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (reading_list_id) {
      query += ` AND reading_list_id = $${paramCount}`
      params.push(reading_list_id)
      paramCount++
    }

    query += ' ORDER BY added_at DESC'

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST /api/articles - Add a new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createArticleSchema.parse(body)

    const result = await db.query(
      `
      INSERT INTO articles (
        reading_list_id, url, title, author, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        validated.reading_list_id,
        validated.url,
        validated.title || null,
        validated.author || null,
        validated.status || 'unread',
        validated.notes || null,
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
