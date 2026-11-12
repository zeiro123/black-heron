import { Chess } from 'chess.js'
import { positionAtPly } from '../game/chessGame'
import type { UciEngine } from './uciEngine'

// Phase 4 — game review: convert engine evaluations into win probabilities,
// label every move (Brilliant → Blunder), and score per-player accuracy.

export type MoveLabel =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'

/** Lichess's win-probability model: cp (centipawns, side-to-move perspective) → win%. */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

/** Mate scores are treated as ±10000 cp. */
export function cpFromScore(cp: number | null, mate: number | null): number {
  if (mate !== null) return mate > 0 ? 10000 : -10000
  return cp ?? 0
}

/** Lichess's per-move accuracy: how much of the win% the mover kept. */
export function moveAccuracy(loss: number): number {
  const raw = 103.1668 * Math.exp(-0.04354 * Math.max(0, loss)) - 3.1669
  return Math.max(0, Math.min(100, raw))
}

export interface ClassifyArgs {
  /** Win% the mover lost with this move. */
  loss: number
  /** The played move was the engine's top choice. */
  playedBest: boolean
  /** Mover's win% before the move. */
  winBefore: number
  /** The move gives up material (captured piece worth much less than the mover's). */
  isSacrifice: boolean
  /** Win% gap between the best and second-best engine line (0 when MultiPV 1). */
  secondBestWinGap: number
}

export function classifyMove(args: ClassifyArgs): MoveLabel {
  const { loss, playedBest, winBefore, isSacrifice, secondBestWinGap } = args
  const alreadyWinning = winBefore >= 85
  // Brilliant: a sacrifice that is still near-best while the game is not already won.
  if (isSacrifice && loss <= 2 && !alreadyWinning) return 'brilliant'
  // Great: near-best while every alternative loses a chunk of win probability.
  if (loss <= 2 && secondBestWinGap >= 8) return 'great'
  if (loss <= 1 || playedBest) return 'best'
  if (loss < 2) return 'excellent'
  if (loss < 5) return 'good'
  if (loss < 10) return 'inaccuracy'
  if (loss < 20) return 'mistake'
  return 'blunder'
}

export interface GameReview {
  /** One label per played move. */
  labels: MoveLabel[]
  /** White's win% after each ply (index 0 = starting position), length = plies + 1. */
  winHistory: number[]
  /** Engine best move per position, UCI. */
  bestMoves: (string | null)[]
  accuracies: { w: number; b: number }
}

export const REVIEW_DEPTH = 10
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Analyse every position of a game and label each move. */
export async function reviewGame(
  history: string[],
  engine: UciEngine,
  onProgress?: (done: number, total: number) => void,
): Promise<GameReview> {
  const plies = history.length
  const fens: string[] = []
  for (let i = 0; i <= plies; i++) fens.push(positionAtPly(history, i).fen)

  engine.newGame()
  const winWhite: number[] = []
  const bestMoves: (string | null)[] = []
  const secondGap: number[] = []
  for (let i = 0; i <= plies; i++) {
    const { infos } = await engine.go({ fen: fens[i], depth: REVIEW_DEPTH, multiPV: 2 })
    const best = infos.find((x) => x.multipv === 1) ?? infos[0]
    const second = infos.find((x) => x.multipv === 2)
    const turn = new Chess(fens[i]).turn()
    const winStm = winPercent(cpFromScore(best?.scoreCp ?? null, best?.scoreMate ?? null))
    winWhite.push(turn === 'w' ? winStm : 100 - winStm)
    bestMoves.push(best?.pv[0] ?? null)
    if (second) {
      const win2 = winPercent(cpFromScore(second.scoreCp, second.scoreMate))
      const win2White = turn === 'w' ? win2 : 100 - win2
      secondGap.push(Math.abs(winWhite[i] - win2White))
    } else {
      secondGap.push(0)
    }
    onProgress?.(i + 1, plies + 1)
  }

  const labels: MoveLabel[] = []
  const accuracies: number[] = []
  for (let i = 0; i < plies; i++) {
    const chess = new Chess(fens[i])
    const mover = chess.turn()
    const winBefore = mover === 'w' ? winWhite[i] : 100 - winWhite[i]
    const winAfter = mover === 'w' ? winWhite[i + 1] : 100 - winWhite[i + 1]
    const loss = Math.max(0, winBefore - winAfter)

    let isSacrifice = false
    let playedUci: string | null = null
    try {
      const played = chess.move(history[i])
      isSacrifice = !!played.captured && PIECE_VALUES[played.captured] + 2 < PIECE_VALUES[played.piece]
      playedUci = `${played.from}${played.to}${played.promotion ?? ''}`
    } catch {
      // Should not happen — the history was recorded from legal play.
    }

    labels.push(
      classifyMove({
        loss,
        playedBest: playedUci !== null && playedUci === bestMoves[i],
        winBefore,
        isSacrifice,
        secondBestWinGap: secondGap[i],
      }),
    )
    accuracies.push(moveAccuracy(loss))
  }

  const mean = (values: number[]): number =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  return {
    labels,
    winHistory: winWhite,
    bestMoves,
    accuracies: {
      w: mean(accuracies.filter((_, i) => i % 2 === 0)),
      b: mean(accuracies.filter((_, i) => i % 2 === 1)),
    },
  }
}
