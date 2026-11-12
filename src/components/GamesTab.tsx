import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessground } from 'chessground'
import { OPENINGS, type Opening } from '../data/openings'
import { legalDests } from '../game/chessGame'
import type { Api } from 'chessground/api'
import type { Dests, Key } from 'chessground/types'
import { TIME_CONTROLS, useGuidedStore, type GuidedMode, type TimeControl } from '../store/guidedStore'
import { EvalBar } from './EvalBar'
import { useSettingsStore } from '../store/settingsStore'

export function GamesTab() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Opening | null>(null)
  const [side, setSide] = useState<'w' | 'b'>('w')
  const [mode, setMode] = useState<GuidedMode>('play')
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS[2])
  const start = useGuidedStore((s) => s.start)
  const active = useGuidedStore((s) => s.opening)
  const tick = useGuidedStore((s) => s.tick)
  const evalBarOn = useSettingsStore((s) => s.evalBar)
  const guidedCp = useGuidedStore((s) => s.cpWhite)
  const guidedSide = useGuidedStore((s) => s.playerSide)

  // The clock ticks in real time while a timed game is running.
  useEffect(() => {
    const id = window.setInterval(() => tick(), 100)
    return () => window.clearInterval(id)
  }, [tick])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return OPENINGS.slice(0, 12)
    return OPENINGS.filter(
      (o) => o.name.toLowerCase().includes(q) || o.eco.toLowerCase().includes(q),
    ).slice(0, 12)
  }, [query])

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="w-full max-w-[560px] shrink-0">
        {active ? (
          <>
            <Clocks />
            <div className="flex gap-2">
              {evalBarOn && guidedCp !== null && (
                <EvalBar cpWhite={guidedCp} orientation={guidedSide} />
              )}
              <div className="min-w-0 flex-1">
                <GuidedBoard />
              </div>
            </div>
          </>
        ) : (
          <PlaceholderBoard />
        )}
      </div>
      <aside className="w-full space-y-4 lg:w-96">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Opening</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search openings (name or ECO)…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
          />
          <div className="moves-scroll mt-2 max-h-44 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            {results.map((opening) => (
              <button
                key={`${opening.eco}|${opening.name}`}
                onClick={() => setSelected(opening)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors ${
                  selected?.name === opening.name
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <span className="truncate">{opening.name}</span>
                <span className="ml-2 shrink-0 text-xs text-zinc-500">{opening.eco}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Your side</p>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {(['w', 'b'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setSide(c)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  side === c ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">{c === 'w' ? '♔' : '♚'}</span>
                {c === 'w' ? 'White' : 'Black'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Mode</p>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {(
              [
                { id: 'play', label: 'Play (computer follows the book)' },
                { id: 'walkthrough', label: 'Walkthrough (coach guides you)' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
                  mode === m.id ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Timing</p>
          <select
            value={timeControl.label}
            onChange={(event) =>
              setTimeControl(TIME_CONTROLS.find((t) => t.label === event.target.value) ?? TIME_CONTROLS[0])
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
          >
            {TIME_CONTROLS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => selected && start(selected, mode, side, timeControl)}
          disabled={!selected}
          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start game
        </button>

        <GuidedPanel />
      </aside>
    </div>
  )
}

function GuidedPanel() {
  const opening = useGuidedStore((s) => s.opening)
  const feedback = useGuidedStore((s) => s.feedback)
  const suggestion = useGuidedStore((s) => s.suggestion)
  const result = useGuidedStore((s) => s.resultPhrase)
  const over = useGuidedStore((s) => s.over)
  const requestHint = useGuidedStore((s) => s.requestHint)
  const resign = useGuidedStore((s) => s.resign)
  const mode = useGuidedStore((s) => s.mode)

  if (!opening) return null
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
      <p className="text-xs text-zinc-500">
        {opening.name} · {opening.eco} · {mode === 'walkthrough' ? 'walkthrough' : 'book game'}
      </p>
      {feedback && <p className="text-zinc-300">{feedback}</p>}
      {suggestion && <p className="text-sky-300">Suggested: {suggestion}</p>}
      {result && <p className="font-medium text-amber-300">{result}</p>}
      <div className="flex gap-2">
        <button
          onClick={requestHint}
          disabled={over}
          className="flex-1 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
        >
          Hint
        </button>
        <button
          onClick={resign}
          disabled={over}
          className="flex-1 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
        >
          Resign
        </button>
      </div>
    </div>
  )
}

function PlaceholderBoard() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500">
      Pick an opening and press Start.
    </div>
  )
}

/** mm:ss — switches to seconds.tenths under 20s and seconds.centiseconds under 10s. */
export function formatClock(ms: number): string {
  if (ms < 10000) {
    const s = Math.floor(ms / 1000)
    const cs = Math.floor((ms % 1000) / 10)
    return `${s}.${String(cs).padStart(2, '0')}`
  }
  if (ms < 20000) {
    const s = Math.floor(ms / 1000)
    const tenths = Math.floor((ms % 1000) / 100)
    return `${s}.${tenths}`
  }
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Clocks() {
  const remaining = useGuidedStore((s) => s.remaining)
  const fen = useGuidedStore((s) => s.fen)
  const playerSide = useGuidedStore((s) => s.playerSide)
  if (!remaining) return null
  const active = new Chess(fen).turn()
  const engineSide: 'w' | 'b' = playerSide === 'w' ? 'b' : 'w'
  const box = (side: 'w' | 'b', name: string) => {
    const ms = remaining[side]
    const low = ms <= 30000
    const isTurn = active === side
    return (
      <div
        className={`flex-1 rounded-lg border px-3 py-2 text-center text-2xl font-semibold tabular-nums transition-colors ${
          low ? 'border-red-500/60 bg-red-500/10 text-red-300' : 'border-zinc-700 bg-zinc-900/60 text-zinc-100'
        } ${isTurn ? 'ring-1 ring-amber-400/60' : ''}`}
        title={name}
      >
        {formatClock(ms)}
      </div>
    )
  }
  return (
    <div className="mb-2 flex gap-2">
      {box(engineSide, 'Computer')}
      {box(playerSide, 'You')}
    </div>
  )
}

/** Dedicated chessground instance driven by the guided store. */
function GuidedBoard() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)

  const fen = useGuidedStore((s) => s.fen)
  const lastMove = useGuidedStore((s) => s.lastMove)
  const playerSide = useGuidedStore((s) => s.playerSide)
  const over = useGuidedStore((s) => s.over)
  const thinking = useGuidedStore((s) => s.thinking)
  const tryMove = useGuidedStore((s) => s.tryMove)

  const dests = useMemo(() => legalDests(new Chess(fen)), [fen])

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const api = Chessground(el, { movable: { free: false } })
    apiRef.current = api
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    const blocked = over || thinking
    api.set({
      fen,
      orientation: playerSide === 'w' ? 'white' : 'black',
      lastMove: (lastMove ?? []) as Key[],
      check: fen.includes('+') ? true : false,
      movable: {
        free: false,
        color: blocked ? undefined : playerSide === 'w' ? 'white' : 'black',
        dests: dests as unknown as Dests,
        showDests: true,
        events: { after: (orig, dest) => tryMove(orig, dest) },
      },
    })
  }, [fen, lastMove, playerSide, over, thinking, dests, tryMove])

  return (
    <div className="board-shell">
      <div ref={elRef} className="board" />
    </div>
  )
}
