// Applies server/schema.sql to the PostgreSQL database named in .env (DATABASE_URL).
// Safe to run any number of times — everything is written with IF NOT EXISTS.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { databaseUrl, projectRoot } from './env.mjs'

const { Pool } = pg

async function main() {
  const pool = new Pool({ connectionString: databaseUrl(), max: 1 })
  try {
    const schemaPath = path.join(projectRoot(), 'server', 'schema.sql')
    await pool.query(readFileSync(schemaPath, 'utf8'))
    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
    )
    console.log('Schema applied. Tables now in the database:')
    for (const row of rows) console.log(`  - ${row.table_name}`)
    if (!rows.some((row) => row.table_name === 'games')) {
      console.error('Expected a "games" table but did not find one.')
      process.exitCode = 1
    }
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
