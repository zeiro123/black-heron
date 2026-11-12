import { create } from 'zustand'
import { getEngine } from '../engine/opponent'
import { reviewGame, type GameReview } from '../engine/review'
import { useGameStore } from './gameStore'

interface ReviewState {
  status: 'idle' | 'running' | 'done'
  progress: { done: number; total: number }
  review: GameReview | null
  /** History length at review time — if the game changed since, the review is stale. */
  reviewedPlies: number
  run: () => Promise<void>
  clear: () => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  status: 'idle',
  progress: { done: 0, total: 0 },
  review: null,
  reviewedPlies: 0,

  run: async () => {
    const history = useGameStore.getState().history
    if (history.length === 0 || get().status === 'running') return
    set({
      status: 'running',
      progress: { done: 0, total: history.length + 1 },
      review: null,
      reviewedPlies: history.length,
    })
    try {
      const engine = await getEngine()
      const review = await reviewGame(history, engine, (done, total) =>
        set({ progress: { done, total } }),
      )
      // Only keep the result if the game did not change while analysing.
      if (useGameStore.getState().history.length === history.length) {
        set({ status: 'done', review })
      } else {
        set({ status: 'idle' })
      }
    } catch (error) {
      console.error('Game review failed:', error)
      set({ status: 'idle' })
    }
  },

  clear: () =>
    set({ status: 'idle', review: null, reviewedPlies: 0, progress: { done: 0, total: 0 } }),
}))
