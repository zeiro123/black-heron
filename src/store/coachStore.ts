import { create } from 'zustand'
import { analyseForCoach, type CoachReport } from '../engine/coachAnalysis'
import { getEngine } from '../engine/opponent'
import { useGameStore } from './gameStore'
import { useSettingsStore } from './settingsStore'

interface CoachState {
  status: 'idle' | 'analysing' | 'ready'
  report: CoachReport | null
  /** Cache key: gameId:ply — the analysis is only valid for the position it was made on. */
  key: string | null
  /** White-perspective cp at our previous turn — powers the "your last move" warning. */
  prevOurTurnCpWhite: number | null
  lastGameId: number
  showLine: boolean
  analyse: () => Promise<void>
  setShowLine: (value: boolean) => void
}

export const useCoachStore = create<CoachState>((set, get) => ({
  status: 'idle',
  report: null,
  key: null,
  prevOurTurnCpWhite: null,
  lastGameId: -1,
  showLine: false,

  analyse: async () => {
    const game = useGameStore.getState()
    const settings = useSettingsStore.getState()
    if (!settings.liveCoach) return
    const key = `${game.gameId}:${game.history.length}`
    if (get().key === key || get().status === 'analysing') return
    // A new game invalidates the previous our-turn evaluation.
    const freshGame = game.gameId !== get().lastGameId
    set({ status: 'analysing', key })
    try {
      const engine = await getEngine()
      const report = await analyseForCoach(engine, {
        history: game.history,
        ply: game.history.length,
        prevOurTurnCpWhite: freshGame ? null : get().prevOurTurnCpWhite,
      })
      const our = game.playerColor
      const cpOur = our === 'w' ? report.cpWhite : -report.cpWhite
      set({ status: 'ready', report, prevOurTurnCpWhite: cpOur, lastGameId: game.gameId })
    } catch (error) {
      console.error('Coach analysis failed:', error)
      set({ status: 'idle' })
    }
  },

  setShowLine: (value) => set({ showLine: value }),
}))
