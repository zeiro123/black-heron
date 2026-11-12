// Tiny .env loader shared by the database scripts (no dotenv dependency needed).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function loadDotEnv() {
  let text
  try {
    text = readFileSync(path.join(rootDir, '.env'), 'utf8')
  } catch {
    return // No .env file — real environment variables are used as-is.
  }
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const value = match[2].replace(/^["']|["']$/g, '')
    if (process.env[match[1]] === undefined) process.env[match[1]] = value
  }
}

export function databaseUrl() {
  loadDotEnv()
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and set it first.')
    process.exit(1)
  }
  return url
}

/** Port parsed out of DATABASE_URL (defaults to 5432). */
export function databasePort() {
  const match = databaseUrl().match(/:(\d+)\//)
  return match ? Number(match[1]) : 5432
}

export function projectRoot() {
  return rootDir
}
