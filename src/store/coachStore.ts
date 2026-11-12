import { create } from 'zustand'
import { analyseForCoach, type CoachReport } from '../engine/coachAnalysis'
import { getEngine } from '../engine/opponent'
import { useGameStore } from './gameStore'
import { useSettingsStore } from './settingsStore'

interface LogEntry {
  id: number
  role: 'coach' | 'you'
  text: string
  kind: 'template' | 'ai' | 'question'
}

interface CoachState {
  status: 'idle' | 'analysing' | 'ready'
  report: CoachReport | null
  /** Cache key: gameId:ply — the analysis is only valid for the position it was made on. */
  key: string | null
  /** Dialogue log between the coach and the player. */
  log: LogEntry[]
  chatBusy: boolean
  /** White-perspective cp at our previous turn — powers the "your last move" warning. */
  prevOurTurnCpWhite: number | null
  lastGameId: number
  showLine: boolean
  analyse: () => Promise<void>
  appendLog: (role: 'coach' | 'you', text: string, kind: 'template' | 'ai' | 'question') => void
  setChatBusy: (value: boolean) => void
  setShowLine: (value: boolean) => void
}

export const useCoachStore = create<CoachState>((set, get) => ({
  status: 'idle',
  report: null,
  key: null,
  log: [],
  chatBusy: false,
  prevOurTurnCpWhite: null,
  lastGameId: -1,
  showLine: false,

  appendLog: (role, text, kind) =>
    set((state) => ({
      // Cap the dialogue so it never grows unbounded.
      log: [...state.log.slice(-29), { id: Date.now() + Math.random(), role, text, kind }],
    })),

  setChatBusy: (value) => set({ chatBusy: value }),

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
