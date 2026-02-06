import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    database_url_exists: !!process.env.DATABASE_URL,
    database_url_host: process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] || 'unknown',
    tests: []
  }

  // Test 1: Basic connection
  try {
    const result = await db.query('SELECT current_database(), current_schema()')
    results.tests.push({
      name: 'Basic connection',
      status: 'success',
      database: result.rows[0].current_database,
      schema: result.rows[0].current_schema
    })
  } catch (error) {
    results.tests.push({
      name: 'Basic connection',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown'
    })
  }

  // Test 2: Check if tables exist
  try {
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tasks', 'projects', 'ideas')
      ORDER BY table_name
    `)
    results.tests.push({
      name: 'Tables exist check',
      status: 'success',
      tables_found: result.rows.map(r => r.table_name)
    })
  } catch (error) {
    results.tests.push({
      name: 'Tables exist check',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown'
    })
  }

  // Test 3: Try to select from tasks
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM tasks')
    results.tests.push({
      name: 'Query tasks table',
      status: 'success',
      count: result.rows[0].count
    })
  } catch (error) {
    results.tests.push({
      name: 'Query tasks table',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown'
    })
  }

  // Test 4: Try the exact query from tasks API
  try {
    const result = await db.query(`
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
      ORDER BY t.created_at DESC
    `)
    results.tests.push({
      name: 'Tasks API query',
      status: 'success',
      row_count: result.rows.length
    })
  } catch (error) {
    results.tests.push({
      name: 'Tasks API query',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown'
    })
  }

  return NextResponse.json(results, { status: 200 })
}
