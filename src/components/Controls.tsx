import { useState } from 'react'
import { BOT_LEVELS } from '../engine/levels'
import { STYLE_LABELS, type PlayStyle } from '../engine/opponent'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

export function Controls() {
  const newGame = useGameStore((s) => s.newGame)
  const undo = useGameStore((s) => s.undo)
  const resign = useGameStore((s) => s.resign)
  const status = useGameStore((s) => s.status)
  const thinking = useGameStore((s) => s.thinking)
  const history = useGameStore((s) => s.history)
  const abort = useGameStore((s) => s.abort)
  const botLevel = useSettingsStore((s) => s.botLevel)
  const playStyle = useSettingsStore((s) => s.playStyle)
  const updateSettings = useSettingsStore((s) => s.update)
  const [color, setColor] = useState<'w' | 'b'>('w')

  const undoDisabled = thinking || status.reason === 'resigned' || history.length === 0
  const resignDisabled = status.over || thinking
  // Chess.com-style abort: only available before both players have moved.
  const abortDisabled = status.over || history.length >= 2

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Bot</p>
        <select
          value={botLevel}
          onChange={(event) => updateSettings({ botLevel: Number(event.target.value) })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
        >
          {BOT_LEVELS.map((bot) => (
            <option key={bot.level} value={bot.level}>
              Level {bot.level} · {bot.name} (~{bot.rating})
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Playing style</p>
        <select
          value={playStyle}
          onChange={(event) => updateSettings({ playStyle: event.target.value as PlayStyle })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
        >
          {STYLE_LABELS.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
      </div>
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
              <span className="text-base leading-none">{c === 'w' ? '♔' : '♚'}</span>
              {c === 'w' ? 'White' : 'Black'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => newGame(color)}
          className="col-span-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
        >
          New game
        </button>
        <button
          onClick={undo}
          disabled={undoDisabled}
          title="Take back your move and the computer's reply"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={abort}
          disabled={abortDisabled}
          title={abortDisabled ? 'Abort is only available before both players have moved' : 'Cancel the game'}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Abort
        </button>
        <button
          onClick={resign}
          disabled={resignDisabled}
          title="Give up the game"
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V4" />
            <path d="M5 4c4-2.2 8 2.2 14 0v9c-6 2.2-10-2.2-14 0" />
          </svg>
          Resign
        </button>
      </div>
    </div>
  )
}
