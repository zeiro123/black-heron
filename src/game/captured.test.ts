import { describe, expect, it } from 'vitest'
import { capturedFromFen } from './captured'

describe('capturedFromFen', () => {
  it('is empty at the starting position', () => {
    const summary = capturedFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1')
    expect(summary.byWhite).toEqual([])
    expect(summary.byBlack).toEqual([])
    expect(summary.materialDiff).toBe(0)
  })

  it('reports nothing captured after a non-capturing move', () => {
    const summary = capturedFromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b - - 0 1')
    expect(summary.byWhite).toEqual([])
    expect(summary.materialDiff).toBe(0)
  })

  it('detects a missing black queen as captured by White (+9)', () => {
    const summary = capturedFromFen('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1')
    expect(summary.byWhite).toEqual(['q'])
    expect(summary.byBlack).toEqual([])
    expect(summary.materialDiff).toBe(9)
  })

  it('detects a missing white knight as captured by Black (−3)', () => {
    const summary = capturedFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR b - - 0 1')
    expect(summary.byBlack).toEqual(['n'])
    expect(summary.materialDiff).toBe(-3)
  })

  it('sorts multiple captured pieces by value, most valuable first', () => {
    const summary = capturedFromFen('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w - - 0 1')
    expect(summary.byWhite).toEqual(['q'])
    // White lost a knight (−3) and Black lost a queen (+9) → +6 for White.
    expect(summary.materialDiff).toBe(6)
  })
})
