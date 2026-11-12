import { Chess } from 'chess.js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPuzzle, type ChessPuzzle } from '../engine/puzzles'
import type { Color } from '../game/types'

interface PuzzleState {
  puzzle: ChessPuzzle | null
  /** Position FEN as the solver sees it (advances through the solution). */
  fen: string
  step: number
  status: 'solving' | 'solved' | 'wrong'
  hintUsed: boolean
  loading: boolean
  error: string | null
  /** Stats (persisted). */
  streak: number
  bestStreak: number
  solved: number
  lastRatingTarget: number

  load: (options?: { rating?: number; theme?: string }) => Promise<void>
  tryMove: (from: string, to: string, promotion?: string) => void
  hint: () => void
  next: () => Promise<void>
  resetStats: () => void
}

export const usePuzzleStore = create<PuzzleState>()(
  persist(
    (set, get) => ({
      puzzle: null,
      fen: '',
      step: 0,
      status: 'solving',
      hintUsed: false,
      loading: false,
      error: null,
      streak: 0,
      bestStreak: 0,
      solved: 0,
      lastRatingTarget: 1500,

      load: async (options) => {
        if (get().loading) return
        set({ loading: true, error: null })
        try {
          const rating = options?.rating ?? get().lastRatingTarget
          const theme = options?.theme
          const puzzle = await fetchPuzzle({ rating, theme })
          set({
            puzzle,
            fen: puzzle.fen,
            step: 0,
            status: 'solving',
            hintUsed: false,
            loading: false,
            lastRatingTarget: rating,
          })
        } catch (error) {
          set({ loading: false, error: error instanceof Error ? error.message : String(error) })
        }
      },

      tryMove: (from, to, promotion) => {
        const state = get()
        const puzzle = state.puzzle
        if (!puzzle || state.status === 'solved') return
        const expected = puzzle.solutionUci[state.step]
        const played = `${from}${to}${promotion ?? ''}`
        if (played !== expected) {
          // Wrong move — streak resets.
          set({ status: 'wrong', streak: 0 })
          return
        }
        // Correct: apply it, then the opponent's reply (if any) plays itself.
        const chess = new Chess(state.fen)
        chess.move({ from, to, promotion: promotion ?? undefined })
        const nextStep = state.step + 1
        if (nextStep >= puzzle.solutionUci.length) {
          set({
            fen: chess.fen(),
            step: nextStep,
            status: 'solved',
            solved: state.solved + 1,
            streak: state.hintUsed ? state.streak : state.streak + 1,
            bestStreak: Math.max(state.bestStreak, state.hintUsed ? state.streak : state.streak + 1),
          })
          return
        }
        // Opponent's reply from the solution.
        const reply = puzzle.solutionUci[nextStep]
        chess.move({
          from: reply.slice(0, 2),
          to: reply.slice(2, 4),
          promotion: (reply[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
        })
        const done = nextStep + 1 >= puzzle.solutionUci.length
        set({
          fen: chess.fen(),
          step: nextStep + 1,
          status: done ? 'solved' : 'solving',
          solved: done ? state.solved + 1 : state.solved,
          streak: done ? (state.hintUsed ? state.streak : state.streak + 1) : state.streak,
          bestStreak: done
            ? Math.max(state.bestStreak, state.hintUsed ? state.streak : state.streak + 1)
            : state.bestStreak,
        })
      },

      hint: () => {
        const state = get()
        const puzzle = state.puzzle
        if (!puzzle || state.status === 'solved') return
        set({ hintUsed: true })
      },

      next: async () => {
        await get().load({ rating: get().lastRatingTarget })
      },

      resetStats: () => set({ streak: 0, bestStreak: 0, solved: 0 }),
    }),
    {
      name: 'chess-coach-puzzles',
      partialize: (state) => ({
        streak: state.streak,
        bestStreak: state.bestStreak,
        solved: state.solved,
        lastRatingTarget: state.lastRatingTarget,
      }),
    },
  ),
)

/** The side the solver plays on the current puzzle. */
export function puzzleSide(fen: string): Color {
  return new Chess(fen).turn()
}
