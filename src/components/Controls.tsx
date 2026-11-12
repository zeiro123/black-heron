import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function Controls() {
  const newGame = useGameStore((s) => s.newGame)
  const undo = useGameStore((s) => s.undo)
  const resign = useGameStore((s) => s.resign)
  const status = useGameStore((s) => s.status)
  const thinking = useGameStore((s) => s.thinking)
  const history = useGameStore((s) => s.history)
  const [color, setColor] = useState<'w' | 'b'>('w')

  const undoDisabled = thinking || status.reason === 'resigned' || history.length === 0
  const resignDisabled = status.over || thinking

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Play as</p>
        <div className="flex overflow-hidden rounded-lg border border-zinc-700">
          {(['w', 'b'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex-1 px-3 py-1.5 text-sm transition-colors ${
                color === c ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {c === 'w' ? 'White' : 'Black'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => newGame(color)}
          className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
        >
          New game
        </button>
        <button
          onClick={undo}
          disabled={undoDisabled}
          className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={resign}
          disabled={resignDisabled}
          className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Resign
        </button>
      </div>
    </div>
  )
}
