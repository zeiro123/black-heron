import { Board } from './Board'
import { CoachPanel } from './CoachPanel'
import { useCoachStore } from '../store/coachStore'
import { useGameStore } from '../store/gameStore'

export function CoachTab() {
  const best = useCoachStore((s) => s.report?.best ?? null)
  const tryPlayerMove = useGameStore((s) => s.tryPlayerMove)
  const thinking = useGameStore((s) => s.thinking)

  function playBest(): void {
    const coachBest = useCoachStore.getState().report?.best
    if (!coachBest || thinking) return
    tryPlayerMove(coachBest.uci.slice(0, 2), coachBest.uci.slice(2, 4))
  }

  return (
    <main className="flex flex-col items-start gap-6 md:flex-row">
      <div className="flex w-full max-w-[560px] shrink-0 flex-col gap-2">
        <Board />
        <p className="text-xs text-zinc-600">
          Play moves on the board — the coach follows along and updates the hints after every move.
        </p>
      </div>
      <aside className="w-full space-y-4 lg:w-80">
        <CoachPanel />
        {best && (
          <button
            onClick={playBest}
            disabled={thinking}
            className="w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Play the coach's move ({best.san})
          </button>
        )}
      </aside>
    </main>
  )
}
