import { Chess } from 'chess.js'

// Temporary computer opponent (Phase 1).
// Phase 2 replaces this file's implementation with Stockfish (WASM, single-threaded lite
// build) running in a Web Worker — behind the same `getComputerMove(fen): Promise<string>`
// interface. The UI and the store will not change when that happens.

const THINK_DELAY_MS = 400

export const opponentName = 'Random opponent (temporary)'

/**
 * Returns the chosen move in UCI notation, e.g. "e2e4" or "e7e8q".
 * Throws if the side to move has no legal moves.
 */
export async function getComputerMove(fen: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, THINK_DELAY_MS))
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) {
    throw new Error(`No legal moves in position: ${fen}`)
  }
  const move = moves[Math.floor(Math.random() * moves.length)]
  return `${move.from}${move.to}${move.promotion ?? ''}`
}
