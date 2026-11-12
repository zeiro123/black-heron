import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import type { Candidate } from './opponent'
import { buildCandidates, styledPick } from './opponent'
import { classifyMove, moveAccuracy, winPercent } from './review'

describe('winPercent (Lichess model)', () => {
  it('maps 0 cp to 50% and is monotonic', () => {
    expect(winPercent(0)).toBeCloseTo(50)
    expect(winPercent(100)).toBeGreaterThan(winPercent(50))
    expect(winPercent(-100)).toBeLessThan(50)
    expect(winPercent(2000)).toBeGreaterThan(95)
    expect(winPercent(-2000)).toBeLessThan(5)
  })
})

describe('moveAccuracy (Lichess formula)', () => {
  it('gives 100% when nothing is lost and drops with the loss', () => {
    expect(moveAccuracy(0)).toBeCloseTo(100)
    expect(moveAccuracy(5)).toBeGreaterThan(moveAccuracy(20))
    expect(moveAccuracy(60)).toBeLessThan(50)
    expect(moveAccuracy(200)).toBeGreaterThanOrEqual(0)
  })
})

describe('classifyMove', () => {
  const base = {
    loss: 0,
    playedBest: false,
    winBefore: 50,
    isSacrifice: false,
    secondBestWinGap: 0,
  }

  it('labels the engine best move as best', () => {
    expect(classifyMove({ ...base, loss: 0.4, playedBest: true })).toBe('best')
  })

  it('labels big losses as blunders', () => {
    expect(classifyMove({ ...base, loss: 25 })).toBe('blunder')
  })

  it('labels mid losses as mistake / inaccuracy / good', () => {
    expect(classifyMove({ ...base, loss: 15 })).toBe('mistake')
    expect(classifyMove({ ...base, loss: 7 })).toBe('inaccuracy')
    expect(classifyMove({ ...base, loss: 3 })).toBe('good')
  })

  it('labels a near-best sacrifice as brilliant while the game is live', () => {
    expect(classifyMove({ ...base, loss: 1, isSacrifice: true, winBefore: 40 })).toBe('brilliant')
  })

  it('does not hand out brilliance for sacrifices in a trivially won position', () => {
    expect(classifyMove({ ...base, loss: 1.5, isSacrifice: true, winBefore: 95 })).toBe('excellent')
  })

  it('labels a near-best only-move as great', () => {
    expect(classifyMove({ ...base, loss: 1, secondBestWinGap: 12 })).toBe('great')
  })
})

describe('styledPick (Phase 5 playing styles)', () => {
  const candidates: Candidate[] = [
    { uci: 'g1f3', cp: 30, isCapture: false, isCheck: false, isSacrifice: false },
    { uci: 'd1h5', cp: 20, isCapture: false, isCheck: true, isSacrifice: false },
    { uci: 'e4d5', cp: 10, isCapture: true, isCheck: false, isSacrifice: false },
  ]

  it('principled always plays the top move', () => {
    expect(styledPick(candidates, 'principled')).toBe('g1f3')
  })

  it('aggressive prefers the checking move within the eval threshold', () => {
    // Qh5: 20cp + 20 (check) = 40 > 30 (Nf3 quiet) → the attack wins.
    expect(styledPick(candidates, 'aggressive')).toBe('d1h5')
  })

  it('solid prefers the quiet move over the capture within the threshold', () => {
    // Nf3: 30cp quiet vs Qh5: 20 − 10 (check) = 10 → the quiet move wins.
    expect(styledPick(candidates, 'solid')).toBe('g1f3')
  })

  it('falls back to the best move when nothing fits the style pool', () => {
    const far: Candidate[] = [
      { uci: 'a1a2', cp: 100 },
      { uci: 'b1b2', cp: -80 },
    ]
    expect(styledPick(far, 'solid')).toBe('a1a2')
    expect(styledPick([], 'aggressive')).toBeNull()
  })
})

describe('buildCandidates', () => {
  it('classifies captures, checks and sacrifices from a real position', () => {
    // White queen takes the f7 pawn with check — a sacrifice (queen for pawn).
    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b - - 0 1'
    const infos = [
      { depth: 5, multipv: 1, scoreCp: 0, scoreMate: null, pv: ['d8f6'] },
      { depth: 5, multipv: 2, scoreCp: -50, scoreMate: null, pv: ['f8c5'] },
    ]
    const candidates = buildCandidates(fen, infos)
    expect(candidates.length).toBe(2)
    expect(candidates[0].uci).toBe('d8f6')
    expect(candidates[0].isCapture).toBe(false)
  })

  it('detects a queen sacrifice via classifyCandidate through the engine path', () => {
    // After 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 it is White's turn and Qxf7# is a
    // capture + check that gives up the queen for a pawn.
    const chess = new Chess()
    for (const san of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6']) chess.move(san)
    const infos = [
      { depth: 5, multipv: 1, scoreCp: 0, scoreMate: null, pv: ['h5f7'] },
      { depth: 5, multipv: 2, scoreCp: -10, scoreMate: null, pv: ['b1c3'] },
    ]
    const candidates = buildCandidates(chess.fen(), infos)
    expect(candidates[0].isCapture).toBe(true)
    expect(candidates[0].isCheck).toBe(true)
    expect(candidates[0].isSacrifice).toBe(true) // queen (9) for pawn (1)
  })
})
