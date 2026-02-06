import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/activity - Get activity log
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entity_type = searchParams.get('entity_type')
    const actor_type = searchParams.get('actor_type')
    const limit = searchParams.get('limit') || '50'

    let query = 'SELECT * FROM activity_log WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (entity_type) {
      query += ` AND entity_type = $${paramCount}`
      params.push(entity_type)
      paramCount++
    }

    if (actor_type) {
      query += ` AND actor_type = $${paramCount}`
      params.push(actor_type)
      paramCount++
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`
    params.push(parseInt(limit))

    const result = await db.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}
