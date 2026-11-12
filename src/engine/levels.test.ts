import { describe, expect, it } from 'vitest'
import type { EngineInfo } from './uciEngine'
import { BOT_LEVELS, chooseMove, getBotLevel } from './levels'

const info = (multipv: number, depth: number, pv: string): EngineInfo => ({
  depth,
  multipv,
  scoreCp: 10,
  scoreMate: null,
  pv: [pv],
})

describe('BOT_LEVELS (Lichess-style ladder, 1–8)', () => {
  it('has exactly 8 levels with unique names and rising strength', () => {
    expect(BOT_LEVELS.length).toBe(8)
    expect(new Set(BOT_LEVELS.map((b) => b.name)).size).toBe(8)
    for (let i = 1; i < BOT_LEVELS.length; i++) {
      expect(BOT_LEVELS[i].rating).toBeGreaterThan(BOT_LEVELS[i - 1].rating)
      expect(BOT_LEVELS[i].skill).toBeGreaterThanOrEqual(BOT_LEVELS[i - 1].skill)
      expect(BOT_LEVELS[i].depth).toBeGreaterThanOrEqual(BOT_LEVELS[i - 1].depth)
    }
  })

  it('clamps out-of-range levels', () => {
    expect(getBotLevel(0).level).toBe(1)
    expect(getBotLevel(-3).level).toBe(1)
    expect(getBotLevel(99).level).toBe(8)
    expect(getBotLevel(3.6).level).toBe(4) // rounds
  })
})

describe('chooseMove', () => {
  it('keeps the best depth per MultiPV line', () => {
    const infos = [info(1, 1, 'a1a2'), info(1, 5, 'b1b2'), info(2, 5, 'c1c2')]
    for (let i = 0; i < 20; i++) {
      expect(chooseMove(infos, 1)).toBe('b1b2')
    }
  })

  it('picks randomly among the top pickFrom lines', () => {
    const infos = [info(1, 5, 'e2e4'), info(2, 5, 'd2d4'), info(3, 5, 'g1f3')]
    const picks = new Set<string>()
    for (let i = 0; i < 200; i++) picks.add(chooseMove(infos, 2) ?? '')
    expect(picks).toEqual(new Set(['e2e4', 'd2d4']))
  })

  it('returns null when the engine produced nothing', () => {
    expect(chooseMove([], 2)).toBeNull()
  })
})
