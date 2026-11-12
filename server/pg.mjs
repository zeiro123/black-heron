// Controls the project's own PostgreSQL cluster (data in .pgdata/, port from .env).
// The cluster was created from the PostgreSQL 18 binaries already installed on this
// machine — nothing extra had to be downloaded, and the service on port 5432 is untouched.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { databasePort, projectRoot } from './env.mjs'

const pgCtl = path.join('C:', 'Program Files', 'PostgreSQL', '18', 'bin', 'pg_ctl.exe')
const dataDir = path.join(projectRoot(), '.pgdata')
const logFile = path.join(dataDir, 'pg.log')

const command = process.argv[2]

if (!existsSync(pgCtl) || !existsSync(dataDir)) {
  console.error('Local PostgreSQL cluster not found. See README → "Storage (PostgreSQL)".')
  process.exit(1)
}

switch (command) {
  case 'start':
    run(['-D', dataDir, '-o', `-p ${databasePort()}`, '-l', logFile, 'start'])
    break
  case 'stop':
    run(['-D', dataDir, 'stop', '-m', 'fast'])
    break
  case 'status':
    run(['-D', dataDir, 'status'])
    break
  default:
    console.log('Usage: node server/pg.mjs start|stop|status')
}

function run(args) {
  const result = spawnSync(pgCtl, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exitCode = result.status ?? 1
}
