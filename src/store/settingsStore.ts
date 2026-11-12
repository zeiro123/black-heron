import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STYLES } from '../data/styles'

export type BoardTheme = 'brown' | 'green' | 'blue' | 'slate'

export interface Settings {
  showDests: boolean
  showCoordinates: boolean
  coordPlacement: 'inside' | 'outside'
  highlightLastMove: boolean
  animateMoves: boolean
  autoQueen: boolean
  liveCoach: boolean
  boardTheme: BoardTheme
  pieceSet: 'classic' | 'unicode'
  /** The selected opponent from the style library. */
  botId: string
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
  liveCoach: true,
  boardTheme: 'brown',
  pieceSet: 'classic',
  botId: STYLES.find((style) => style.name === 'Levy Rozman')?.id ?? STYLES[0].id,
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
