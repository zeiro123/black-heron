import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Opening } from '../data/openings'

interface OpeningProgress {
  drilled: number
  correct: number
  wrong: number
  streak: number
  lastAt: number
}

interface OpeningsState {
  progress: Record<string, OpeningProgress>
  mark: (opening: Opening, correct: boolean) => void
  reset: (key: string) => void
}

const keyOf = (opening: Opening): string => `${opening.eco}|${opening.name}`

/** Spaced-repetition-lite: opennings with low streaks come back first. */
export function dueSort<T extends Opening>(openings: T[], progress: Record<string, OpeningProgress>): T[] {
  const score = (opening: T): number => {
    const entry = progress[keyOf(opening)]
    if (!entry) return -1 // never drilled → highest priority
    return entry.streak - entry.wrong * 2 + entry.drilled * 0.1
  }
  return [...openings].sort((a, b) => score(a) - score(b))
}

export const useOpeningsStore = create<OpeningsState>()(
  persist(
    (set) => ({
      progress: {},
      mark: (opening, correct) => {
        const key = keyOf(opening)
        set((state) => {
          const current = state.progress[key] ?? {
            drilled: 0, correct: 0, wrong: 0, streak: 0, lastAt: 0,
          }
          return {
            progress: {
              ...state.progress,
              [key]: {
                drilled: current.drilled + 1,
                correct: current.correct + (correct ? 1 : 0),
                wrong: current.wrong + (correct ? 0 : 1),
                streak: correct ? current.streak + 1 : 0,
                lastAt: Date.now(),
              },
            },
          }
        })
      },
      reset: (key) =>
        set((state) => ({ progress: { ...state.progress, [key]: {
          drilled: 0, correct: 0, wrong: 0, streak: 0, lastAt: 0,
        } } })),
    }),
    { name: 'chess-coach-openings' },
  ),
)

export { keyOf as openingKey }
