import type { EngineInfo } from './uciEngine'

export interface BotLevel {
  level: number
  name: string
  /** Avatar initials for the player-bar face icon. */
  initials: string
  rating: number
  /** UCI Skill Level (0–20). */
  skill: number
  /** Search depth cap. */
  depth: number
  /** How many candidate lines the engine reports. */
  multiPV: number
  /** The bot picks randomly among the top N lines — this is what makes low levels human-like. */
  pickFrom: number
}

// Difficulty ladder inspired by Lichess (levels 1–8). Casual opponent names at the
// lower levels, famous players at the higher Elos. Lower levels think shallowly and
// pick randomly among their best few moves; higher levels play near full strength.
export const BOT_LEVELS: BotLevel[] = [
  { level: 1, name: 'Mark', initials: 'M', rating: 600, skill: 0, depth: 1, multiPV: 4, pickFrom: 4 },
  { level: 2, name: 'John', initials: 'J', rating: 900, skill: 3, depth: 2, multiPV: 4, pickFrom: 3 },
  { level: 3, name: 'Elena', initials: 'E', rating: 1200, skill: 6, depth: 4, multiPV: 3, pickFrom: 3 },
  { level: 4, name: 'Levy Rozman', initials: 'LR', rating: 1600, skill: 9, depth: 6, multiPV: 2, pickFrom: 2 },
  { level: 5, name: 'Bobby Fischer', initials: 'RF', rating: 2000, skill: 12, depth: 9, multiPV: 1, pickFrom: 1 },
  { level: 6, name: 'Garry Kasparov', initials: 'GK', rating: 2400, skill: 15, depth: 12, multiPV: 1, pickFrom: 1 },
  { level: 7, name: 'Hikaru Nakamura', initials: 'HN', rating: 2700, skill: 18, depth: 16, multiPV: 1, pickFrom: 1 },
  { level: 8, name: 'Magnus Carlsen', initials: 'MC', rating: 2882, skill: 20, depth: 20, multiPV: 1, pickFrom: 1 },
]

export function getBotLevel(level: number): BotLevel {
  const clamped = Math.min(BOT_LEVELS.length, Math.max(1, Math.round(level)))
  return BOT_LEVELS[clamped - 1]
}

/** Best move per MultiPV line, then a random pick among the top `pickFrom` lines. */
export function chooseMove(infos: EngineInfo[], pickFrom: number): string | null {
  const bestPerLine = new Map<number, EngineInfo>()
  for (const info of infos) {
    const current = bestPerLine.get(info.multipv)
    if (!current || info.depth >= current.depth) bestPerLine.set(info.multipv, info)
  }
  const ordered = [...bestPerLine.values()]
    .sort((a, b) => a.multipv - b.multipv)
    .slice(0, Math.max(1, pickFrom))
  if (ordered.length === 0) return null
  return ordered[Math.floor(Math.random() * ordered.length)].pv[0]
}
