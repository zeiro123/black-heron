import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlayStyle } from '../engine/opponent'

export type BoardTheme = 'brown' | 'green' | 'blue' | 'slate'

export interface Settings {
  showDests: boolean
  showCoordinates: boolean
  coordPlacement: 'inside' | 'outside'
  highlightLastMove: boolean
  animateMoves: boolean
  autoQueen: boolean
  boardTheme: BoardTheme
  botLevel: number
  playStyle: PlayStyle
  playerName: string
}

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void
}

export const DEFAULT_SETTINGS: Settings = {
  showDests: true,
  showCoordinates: true,
  coordPlacement: 'inside',
  highlightLastMove: true,
  animateMoves: true,
  autoQueen: false,
  boardTheme: 'brown',
  botLevel: 4,
  playStyle: 'balanced',
  playerName: '',
}

/** Preferences (persisted to localStorage). Game state lives in gameStore. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    { name: 'chess-coach-settings' },
  ),
)
