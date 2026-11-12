import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { getComputerMove } from './opponent'

describe('getComputerMove (temporary random opponent)', () => {
  it('returns a legal UCI move from the starting position', async () => {
    const chess = new Chess()
    const uci = await getComputerMove(chess.fen())
    expect(uci).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/)
    const apply = {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci.length === 5 ? { promotion: uci[4] as 'q' } : {}),
    }
    expect(() => chess.move(apply)).not.toThrow()
  })

  it('throws when the side to move has no legal moves', async () => {
    const stalemate = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    await expect(getComputerMove(stalemate.fen())).rejects.toThrow()
  })
})
