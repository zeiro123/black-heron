import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import type { Shape } from './BoardArrows'
import { SimpleBoard } from './SimpleBoard'
import { legalDests } from '../game/chessGame'
import { usePuzzleStore } from '../store/puzzleStore'
import { puzzleSide } from '../store/puzzleStore'

const PUZZLE_THEMES = ['mate', 'mateIn2', 'mateIn3', 'fork', 'pin', 'skewer', 'hangingPiece', 'sacrifice', 'endgame', 'trappedPiece']

export function PuzzlesTab() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const fen = usePuzzleStore((s) => s.fen)
  const status = usePuzzleStore((s) => s.status)
  const step = usePuzzleStore((s) => s.step)
  const hintUsed = usePuzzleStore((s) => s.hintUsed)
  const loading = usePuzzleStore((s) => s.loading)
  const error = usePuzzleStore((s) => s.error)
  const streak = usePuzzleStore((s) => s.streak)
  const bestStreak = usePuzzleStore((s) => s.bestStreak)
  const solved = usePuzzleStore((s) => s.solved)
  const lastRatingTarget = usePuzzleStore((s) => s.lastRatingTarget)
  const load = usePuzzleStore((s) => s.load)
  const tryMove = usePuzzleStore((s) => s.tryMove)
  const hint = usePuzzleStore((s) => s.hint)
  const next = usePuzzleStore((s) => s.next)
  const resetStats = usePuzzleStore((s) => s.resetStats)
  const [rating, setRating] = useState(lastRatingTarget)
  const [theme, setTheme] = useState('')

  // Load the first puzzle when the tab opens.
  useEffect(() => {
    if (!puzzle && !loading && !error) void load({ rating })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const side = fen ? puzzleSide(fen) : 'w'
  const dests = fen && status === 'solving' ? legalDests(new Chess(fen)) : undefined

  // Hint: circle the piece that makes the expected move.
  const hintShapes: Shape[] =
    hintUsed && puzzle && status === 'solving'
      ? [{ kind: 'circle', from: puzzle.solutionUci[step].slice(0, 2), to: puzzle.solutionUci[step].slice(0, 2), color: '#003088' }]
      : []

  const solveMessage =
    status === 'solved'
      ? 'Solved! Streak extended.'
      : status === 'wrong'
        ? 'Not that move — try again (streak reset).'
        : hintUsed
          ? 'Hint: the highlighted piece makes the move.'
          : `${side === 'w' ? 'White' : 'Black'} to play and win.`

  return (
    <main className="flex flex-col items-start gap-6 md:flex-row">
      <div className="flex w-full max-w-[480px] shrink-0 flex-col gap-2">
        {fen ? (
          <SimpleBoard
            fen={fen}
            orientation={side}
            movableColor={status === 'solving' ? side : undefined}
            dests={dests}
            onMove={(from, to, promotion) => tryMove(from, to, promotion)}
            hintShapes={hintShapes}
          />
        ) : (
          <div className="flex h-[420px] w-full max-w-[480px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-500">
            {loading ? 'Loading a puzzle…' : 'No puzzle loaded.'}
          </div>
        )}
      </div>

      <aside className="w-full space-y-4 lg:w-80">
        <div className="flex gap-2 text-sm">
          <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <p className="text-xs text-zinc-500">Streak</p>
            <p className="text-lg font-semibold text-zinc-100">{streak} 🔥</p>
          </div>
          <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <p className="text-xs text-zinc-500">Solved</p>
            <p className="text-lg font-semibold text-zinc-100">{solved}</p>
          </div>
          <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <p className="text-xs text-zinc-500">Best streak</p>
            <p className="text-lg font-semibold text-zinc-100">{bestStreak}</p>
          </div>
        </div>

        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            status === 'solved'
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
              : status === 'wrong'
                ? 'border-red-500/60 bg-red-500/10 text-red-200'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-200'
          }`}
        >
          {fen ? solveMessage : 'Press Next puzzle to begin.'}
        </div>

        {puzzle && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
            <p>Puzzle {puzzle.id} · rating {puzzle.rating}</p>
            <p className="mt-1">Themes: {puzzle.themes.slice(0, 5).join(', ') || '—'}</p>
            {status === 'solved' && (
              <p className="mt-1 text-zinc-500">Solution: {puzzle.solutionSan.join(' ')}</p>
            )}
            <a href={puzzle.gameUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sky-400 hover:underline">
              View the game on Lichess ↗
            </a>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={hint}
            disabled={!puzzle || status !== 'solving'}
            className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Hint
          </button>
          <button
            onClick={() => void next()}
            disabled={loading}
            className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            {loading ? 'Loading…' : 'Next puzzle'}
          </button>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Difficulty target</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={800}
                max={2400}
                step={100}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="w-10 text-right text-xs text-zinc-400">{rating}</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Theme</p>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400"
            >
              <option value="">Any theme</option>
              {PUZZLE_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => void load({ rating, theme: theme || undefined })}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Load puzzle with these settings
          </button>
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}

        <button
          onClick={resetStats}
          className="w-full rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Reset streak &amp; counters
        </button>
      </aside>
    </main>
  )
}
