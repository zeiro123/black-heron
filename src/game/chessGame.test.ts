import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import {
  START_FEN,
  applyMove,
  isPromotion,
  kingSquare,
  lastMoveOf,
  legalDests,
  other,
  statusOf,
} from './chessGame'

describe('legalDests', () => {
  it('gives the 20 opening moves across 10 origin squares', () => {
    const dests = legalDests(new Chess())
    expect(dests.size).toBe(10)
    expect([...dests.values()].flat().length).toBe(20)
  })

  it('only contains moves for the side to move', () => {
    const chess = new Chess(START_FEN.replace(' w ', ' b '))
    const dests = legalDests(chess)
    expect(dests.has('e7')).toBe(true)
    expect(dests.has('e2')).toBe(false)
  })
})

describe('statusOf', () => {
  it("detects Scholar's mate as checkmate won by White", () => {
    const chess = new Chess()
    for (const san of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6']) chess.move(san)
    chess.move('Qxf7#')
    expect(statusOf(chess)).toEqual({ over: true, reason: 'checkmate', winner: 'w', check: true })
  })

  it('detects stalemate as a draw with no winner', () => {
    const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    expect(statusOf(chess)).toEqual({ over: true, reason: 'stalemate', winner: null, check: false })
  })

  it('flags check while the game is still live', () => {
    const chess = new Chess('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1')
    expect(statusOf(chess)).toEqual({ over: false, reason: null, winner: null, check: true })
  })

  it('reports a normal position as still playing', () => {
    expect(statusOf(new Chess())).toEqual({ over: false, reason: null, winner: null, check: false })
  })
})

describe('isPromotion', () => {
  it('is true when a pawn reaches the last rank', () => {
    const chess = new Chess('8/P6k/8/8/8/8/7K/8 w - - 0 1')
    expect(isPromotion(chess, 'a7', 'a8')).toBe(true)
  })

  it('is false for normal moves', () => {
    const chess = new Chess()
    expect(isPromotion(chess, 'g1', 'f3')).toBe(false)
    expect(isPromotion(chess, 'e2', 'e4')).toBe(false)
  })
})

describe('applyMove', () => {
  it('applies a legal move and returns it', () => {
    const chess = new Chess()
    const move = applyMove(chess, 'e2', 'e4')
    expect(move?.san).toBe('e4')
    expect(chess.turn()).toBe('b')
  })

  it('promotes with the chosen piece', () => {
    const chess = new Chess('8/P6k/8/8/8/8/7K/8 w - - 0 1')
    const move = applyMove(chess, 'a7', 'a8', 'n')
    expect(move?.san).toBe('a8=N')
  })

  it('returns null for an illegal move and leaves the position untouched', () => {
    const chess = new Chess()
    expect(applyMove(chess, 'e2', 'e5')).toBeNull()
    expect(chess.turn()).toBe('w')
    expect(chess.moves().length).toBe(20)
  })
})

describe('kingSquare', () => {
  it('finds the king of each color', () => {
    expect(kingSquare(new Chess(), 'w')).toBe('e1')
    expect(kingSquare(new Chess(), 'b')).toBe('e8')
  })
})

describe('lastMoveOf', () => {
  it('is null before any move', () => {
    expect(lastMoveOf(new Chess())).toBeNull()
  })

  it('returns the from/to of the last ply', () => {
    const chess = new Chess()
    chess.move('e4')
    expect(lastMoveOf(chess)).toEqual(['e2', 'e4'])
  })
})

describe('other', () => {
  it('flips the color', () => {
    expect(other('w')).toBe('b')
    expect(other('b')).toBe('w')
  })
})
