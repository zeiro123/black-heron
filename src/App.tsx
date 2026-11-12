import { useEffect, useState } from 'react'
import { AiTab } from './components/AiTab'
import { CoachTab } from './components/CoachTab'
import { NavRail, type Tab } from './components/NavRail'
import { OpeningsTab } from './components/OpeningsTab'
import { PlayTab } from './components/PlayTab'
import { PuzzlesTab } from './components/PuzzlesTab'
import { PromotionDialog } from './components/PromotionDialog'
import { SettingsPanel } from './components/SettingsPanel'
import { StylesTab } from './components/StylesTab'
import { GamesTab } from './components/GamesTab'
import { playCapture, playCheck, playGameEnd, playMove } from './game/sound'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'

const TAB_SUBTITLES: Record<Tab, string> = {
  play: 'Human vs computer',
  coach: 'Hints, threats and the expected line',
  games: 'Play an opening against the computer',
  puzzles: 'Unlimited puzzles from the Lichess database',
  openings: 'Learn and drill opening lines',
  ai: 'Bring your own model — coach explanations in plain language',
  styles: '100 opponents, each with their own style',
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('play')
  const uiTheme = useSettingsStore((s) => s.uiTheme)

  // Game sounds: react to the last played move, checks and game end.
  const lastSan = useGameStore((s) => (s.history.length ? s.history[s.history.length - 1] : null))
  const over = useGameStore((s) => s.status.over)
  const playSounds = useSettingsStore((s) => s.playSounds)

  useEffect(() => {
    if (!playSounds || !lastSan) return
    if (lastSan.includes('x')) playCapture()
    else playMove()
  }, [lastSan, playSounds])

  useEffect(() => {
    if (!playSounds || !over) return
    playGameEnd()
  }, [over, playSounds])

  useEffect(() => {
    if (!playSounds) return
    const check = useGameStore.getState().status.check
    if (check) playCheck()
  }, [lastSan, playSounds])

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 ${uiTheme === 'light' ? 'ui-light' : ''}`}>
      <div className="mx-auto flex max-w-6xl">
        <NavRail tab={tab} onTab={setTab} />
        <div className="min-w-0 flex-1 px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Black Heron</h1>
              <p className="text-sm text-zinc-500">{TAB_SUBTITLES[tab]}</p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Game settings"
              className="rounded-lg border border-zinc-700 p-2 text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </header>

          {tab === 'play' && <PlayTab />}
          {tab === 'coach' && <CoachTab />}
          {tab === 'games' && <GamesTab />}
          {tab === 'puzzles' && <PuzzlesTab />}
          {tab === 'openings' && <OpeningsTab />}
          {tab === 'ai' && <AiTab />}
          {tab === 'styles' && <StylesTab />}
        </div>
      </div>
      <PromotionDialog />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
