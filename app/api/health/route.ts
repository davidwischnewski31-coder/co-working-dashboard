import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health - Database health check
export async function GET() {
  const startTime = Date.now()

  try {
    // Test database connection
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version')
    const latency = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: result.rows[0].current_time,
      postgres_version: result.rows[0].pg_version,
      environment: {
        node_env: process.env.NODE_ENV,
        has_database_url: !!process.env.DATABASE_URL,
      }
    })
  } catch (error) {
    const latency = Date.now() - startTime

    console.error('Health check failed:', error)
    console.error('Database URL exists:', !!process.env.DATABASE_URL)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        latency: `${latency}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          node_env: process.env.NODE_ENV,
          has_database_url: !!process.env.DATABASE_URL,
        }
      },
      { status: 503 }
    )
  }
}
