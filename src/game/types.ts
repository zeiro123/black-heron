export type Color = 'w' | 'b'
export type Square = string
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

/** Destination map for the chessground board: origin square -> reachable squares. */
export type DestsMap = Map<Square, Square[]>

export type GameOverReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move'
  | 'resigned'

export interface GameStatus {
  over: boolean
  reason: GameOverReason | null
  /** Only set for checkmate; null for draws and while playing. */
  winner: Color | null
  check: boolean
}
