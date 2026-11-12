import { Chess } from 'chess.js'
import { positionAtPly } from '../game/chessGame'
import type { Color } from '../game/types'

// Phase 7 — unlimited puzzles from the Lichess puzzle database (public API, CC0 data).

export interface ChessPuzzle {
  id: string
  fen: string
  /** Solution in UCI, alternating: solver, opponent, solver, ... */
  solutionUci: string[]
  solutionSan: string[]
  rating: number
  themes: string[]
  /** The colour the solver plays. */
  sideToMove: Color
  gameUrl: string
}

interface LichessPuzzleResponse {
  game: { id: string; pgn: string }
  puzzle: {
    id: string
    rating: number
    themes: string[]
    initialPly: number
    solution: string[]
  }
}

/**
 * Fetch the next puzzle from Lichess. `rating` is the target difficulty;
 * `theme` filters the tactical motif (mate, fork, pin, ...).
 */
export async function fetchPuzzle(options?: { rating?: number; theme?: string }): Promise<ChessPuzzle> {
  const url = new URL('https://lichess.org/api/puzzle/next')
  if (options?.rating) url.searchParams.set('rating', String(options.rating))
  if (options?.theme) url.searchParams.set('theme', options.theme)
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Lichess puzzle API failed: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as LichessPuzzleResponse

  // The puzzle position: replay the game's SAN past the opponent's move that leads
  // into the puzzle (initialPly is that opponent move; the board shows the position
  // AFTER it, with the solver to move).
  const game = new Chess()
  game.loadPgn(data.game.pgn)
  const sanHistory = game.history()
  const fen = positionAtPly(sanHistory, data.puzzle.initialPly + 1).fen
  const position = new Chess(fen)

  // The solution alternates: solver, opponent, solver...
  const solutionSan: string[] = []
  const scratch = new Chess(fen)
  for (const uci of data.puzzle.solution) {
    const move = scratch.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    })
    if (!move) throw new Error(`Lichess solution ${data.puzzle.id} is not playable at ${uci}`)
    solutionSan.push(move.san)
  }

  return {
    id: data.puzzle.id,
    fen,
    solutionUci: data.puzzle.solution,
    solutionSan,
    rating: data.puzzle.rating,
    themes: data.puzzle.themes ?? [],
    sideToMove: (position.turn() as Color) ?? 'w',
    gameUrl: `https://lichess.org/${data.game.id}`,
  }
}
