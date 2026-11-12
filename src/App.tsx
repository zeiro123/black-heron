import { useEffect, useState } from 'react'
import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { MoveList } from './components/MoveList'
import { MoveNav } from './components/MoveNav'
import { NavRail } from './components/NavRail'
import { PlayerBar } from './components/PlayerBar'
import { PromotionDialog } from './components/PromotionDialog'
import { SettingsPanel } from './components/SettingsPanel'
import { StatusBar } from './components/StatusBar'
import { getBotLevel } from './engine/levels'
import { capturedFromFen } from './game/captured'
import { positionAtPly } from './game/chessGame'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const playerColor = useGameStore((s) => s.playerColor)
  const history = useGameStore((s) => s.history)
  const viewPly = useGameStore((s) => s.viewPly)
  const thinking = useGameStore((s) => s.thinking)
  const playerName = useSettingsStore((s) => s.playerName)
  const updateSettings = useSettingsStore((s) => s.update)
  const botLevel = useSettingsStore((s) => s.botLevel)

  const bot = getBotLevel(botLevel)
  const display = positionAtPly(history, viewPly)
  const captured = capturedFromFen(display.fen)
  const playerIsWhite = playerColor === 'w'
  const playerCaptured = playerIsWhite ? captured.byWhite : captured.byBlack
  const opponentCaptured = playerIsWhite ? captured.byBlack : captured.byWhite
  const playerDiff = playerIsWhite ? captured.materialDiff : -captured.materialDiff
  const opponentDiff = -playerDiff

  // Keyboard navigation: ← / → step moves, Home / End jump (ignored while typing).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const state = useGameStore.getState()
      if (event.key === 'ArrowLeft') state.navigateTo(state.viewPly - 1)
      else if (event.key === 'ArrowRight') state.navigateTo(state.viewPly + 1)
      else if (event.key === 'Home') state.navigateTo(0)
      else if (event.key === 'End') state.navigateTo(state.history.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const opponentColor = playerIsWhite ? 'b' : 'w'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-6xl">
        <NavRail />
        <div className="min-w-0 flex-1 px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Chess Coach</h1>
              <p className="text-sm text-zinc-500">
                Human vs computer · you play {playerIsWhite ? 'White' : 'Black'}
              </p>
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
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </header>

          <main className="flex flex-col items-start gap-6 md:flex-row">
            <div className="flex w-full max-w-[560px] shrink-0 flex-col gap-2">
              <PlayerBar
                color={opponentColor}
                name={bot.name}
                subtitle={`Elo ~${bot.rating} · Stockfish (WASM)`}
                captured={opponentCaptured}
                materialDiff={opponentDiff}
                thinking={thinking}
                avatar={bot.initials}
              />
              <Board />
              <PlayerBar
                color={playerColor}
                name={playerName}
                nameEditable
                onNameChange={(name) => updateSettings({ playerName: name })}
                captured={playerCaptured}
                materialDiff={playerDiff}
              />
            </div>
            <aside className="w-full space-y-4 lg:w-80">
              <StatusBar />
              <Controls />
              <MoveNav />
              <MoveList />
              <p className="text-xs text-zinc-600">
                {history.length} {history.length === 1 ? 'half-move' : 'half-moves'} played ·
                right-click drag draws arrows (knight arrows bend) and circles · ← → keys step moves
              </p>
            </aside>
          </main>
        </div>
      </div>
      <PromotionDialog />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
