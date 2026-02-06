import { Pool, QueryResult } from 'pg'

// Create a singleton connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
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
