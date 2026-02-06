import { Pool, QueryResult } from 'pg'

// Create a singleton connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,  // Reduced for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,  // Increased for cold starts
      allowExitOnIdle: true,  // Allow serverless to clean up
    })

    pool.on('error', (err) => {
      console.error('Database connection error:', err)
      // Don't exit - let Vercel handle it
    })
  }

  return pool
}

export const db = {
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const pool = getPool()
    return pool.query(text, params)
  },

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const pool = getPool()
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async close(): Promise<void> {
    if (pool) {
      await pool.end()
      pool = null
    }
  }
}
