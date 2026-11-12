import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { MoveList } from './components/MoveList'
import { PromotionDialog } from './components/PromotionDialog'
import { StatusBar } from './components/StatusBar'
import { useGameStore } from './store/gameStore'

export default function App() {
  const playerColor = useGameStore((s) => s.playerColor)
  const history = useGameStore((s) => s.history)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Chess Coach</h1>
          <p className="text-sm text-zinc-500">
            Human vs computer · you play {playerColor === 'w' ? 'White' : 'Black'}
          </p>
        </header>

        <main className="flex flex-col items-start gap-6 lg:flex-row">
          <Board />
          <aside className="w-full space-y-4 lg:w-80">
            <StatusBar />
            <Controls />
            <MoveList />
            <p className="text-xs text-zinc-600">
              {history.length} {history.length === 1 ? 'half-move' : 'half-moves'} played ·
              right-click drag draws arrows and circles
            </p>
          </aside>
        </main>
      </div>
      <PromotionDialog />
    </div>
  )
}
