// Quick smoke check: can we reach the database, and what is in it?
import pg from 'pg'
import { databaseUrl } from './env.mjs'

const { Pool } = pg

async function main() {
  const pool = new Pool({ connectionString: databaseUrl(), max: 1 })
  try {
    const version = await pool.query('SELECT version()')
    console.log('Server:', String(version.rows[0].version).split(',')[0])
    const tables = await pool.query(
      `SELECT COUNT(*)::int AS count FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'games'`,
    )
    console.log('Games table exists:', tables.rows[0].count === 1)
    const games = await pool.query('SELECT COUNT(*)::int AS count FROM games')
    console.log('Stored games:', games.rows[0].count)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Database check failed:', error.message)
  process.exit(1)
})
