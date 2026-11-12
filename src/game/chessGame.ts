import { Chess, type Move, type Square as JsSquare } from 'chess.js'
import type { Color, DestsMap, GameStatus, PromotionPiece, Square } from './types'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Pure chess.js helpers — no React, no DOM, no engine. Fully unit-testable. */

export function other(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

/** Classify the position: who won, or is it a draw, or still playing? */
export function statusOf(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return { over: true, reason: 'checkmate', winner: other(chess.turn()), check: true }
  }
  if (chess.isStalemate()) {
    return { over: true, reason: 'stalemate', winner: null, check: false }
  }
  if (chess.isInsufficientMaterial()) {
    return { over: true, reason: 'insufficient-material', winner: null, check: false }
  }
  if (chess.isThreefoldRepetition()) {
    return { over: true, reason: 'threefold-repetition', winner: null, check: false }
  }
  if (chess.isDraw()) {
    return { over: true, reason: 'fifty-move', winner: null, check: false }
  }
  return { over: false, reason: null, winner: null, check: chess.isCheck() }
}

/** All legal destinations for the side to move, in chessground's Map shape. */
export function legalDests(chess: Chess): DestsMap {
  const dests: DestsMap = new Map()
  for (const move of chess.moves({ verbose: true })) {
    const list = dests.get(move.from)
    if (list) list.push(move.to)
    else dests.set(move.from, [move.to])
  }
  return dests
}

/** Square of the given color's king (for chessground's check highlight). */
export function kingSquare(chess: Chess, color: Color): Square | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square
    }
  }
  return null
}

/** True when moving from `from` to `to` promotes a pawn (so the UI must ask which piece). */
export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  const piece = chess.get(from as JsSquare)
  return piece?.type === 'p' && (to[1] === '8' || to[1] === '1')
}

/** Apply a move; returns the move, or null if it was illegal. Never throws. */
export function applyMove(
  chess: Chess,
  from: Square,
  to: Square,
  promotion?: PromotionPiece,
): Move | null {
  try {
    if (promotion) {
      return chess.move({ from: from as JsSquare, to: to as JsSquare, promotion })
    }
    return chess.move({ from: from as JsSquare, to: to as JsSquare })
  } catch {
    return null
  }
}

/** [from, to] of the last ply, for chessground's last-move highlight. */
export function lastMoveOf(chess: Chess): [Square, Square] | null {
  const history = chess.history({ verbose: true })
  const last = history[history.length - 1]
  return last ? [last.from, last.to] : null
}
