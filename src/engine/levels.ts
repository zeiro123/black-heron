import type { EngineInfo } from './uciEngine'

export interface BotLevel {
  level: number
  name: string
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

// Difficulty ladder inspired by Lichess (levels 1–8). Lower levels combine a weak
// Skill Level with a shallow search and some randomness between the best moves;
// higher levels play closer to full strength.
export const BOT_LEVELS: BotLevel[] = [
  { level: 1, name: 'Pip', rating: 500, skill: 0, depth: 1, multiPV: 4, pickFrom: 4 },
  { level: 2, name: 'Milo', rating: 800, skill: 3, depth: 2, multiPV: 4, pickFrom: 3 },
  { level: 3, name: 'Ziggy', rating: 1100, skill: 6, depth: 4, multiPV: 3, pickFrom: 3 },
  { level: 4, name: 'Vesper', rating: 1400, skill: 9, depth: 6, multiPV: 2, pickFrom: 2 },
  { level: 5, name: 'Orion', rating: 1700, skill: 12, depth: 9, multiPV: 1, pickFrom: 1 },
  { level: 6, name: 'Magno', rating: 2000, skill: 15, depth: 12, multiPV: 1, pickFrom: 1 },
  { level: 7, name: 'Nyx', rating: 2300, skill: 18, depth: 16, multiPV: 1, pickFrom: 1 },
  { level: 8, name: 'Black Heron', rating: 2600, skill: 20, depth: 20, multiPV: 1, pickFrom: 1 },
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
