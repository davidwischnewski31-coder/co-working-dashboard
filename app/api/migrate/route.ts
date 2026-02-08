import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Temporary migration endpoint - DELETE after running
export async function POST(request: NextRequest) {
  try {
    // Simple auth check - only allow if coming from trusted source
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.MIGRATION_SECRET || 'run-v2-migration'

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Running V2 migration...')

    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', '002_v2_priority_lanes.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Execute migration
    await db.query(migrationSQL)

    console.log('✅ Migration completed successfully')

    // Verify new columns
    const result = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      AND column_name IN ('assignee', 'assignee_type', 'position', 'completed_at')
      ORDER BY column_name
    `)

    // Check for view
    const viewResult = await db.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_name = 'task_stats'
    `)

    return NextResponse.json({
      success: true,
      message: 'V2 migration completed successfully',
      verified: {
        newColumns: result.rows.map(r => r.column_name),
        taskStatsView: viewResult.rows.length > 0
      }
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
