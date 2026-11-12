// Lichess API helper for later phases (puzzles, opening explorer, game import).
// Reads LICHESS_API_TOKEN from .env — the token is SERVER-SIDE ONLY and must
// never appear in frontend code (see the project rules: no secrets in frontend).
import { loadDotEnv } from './env.mjs'

export function lichessToken() {
  loadDotEnv()
  const token = process.env.LICHESS_API_TOKEN
  if (!token) {
    console.error('LICHESS_API_TOKEN is not set. Add it to .env (see .env.example).')
    process.exit(1)
  }
  return token
}

export async function lichess(path) {
  const response = await fetch(`https://lichess.org${path}`, {
    headers: { Authorization: `Bearer ${lichessToken()}` },
  })
  if (!response.ok) {
    throw new Error(`Lichess API ${path} failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Smoke check: node server/lichess.mjs
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const account = await lichess('/api/account')
  console.log('Token OK — Lichess account:', account.username)
  const daily = await fetch('https://lichess.org/api/puzzle/daily').then((r) => r.json())
  console.log('Daily puzzle:', daily.puzzle.id, `(${daily.puzzle.rating})`)
}
