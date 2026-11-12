import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { OPENINGS, type Opening } from '../data/openings'
import { dueSort, openingKey, useOpeningsStore } from '../store/openingsStore'
import { positionAtPly, legalDests } from '../game/chessGame'
import type { Color } from '../game/types'
import { SimpleBoard } from './SimpleBoard'

const ECO_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

/** SAN list of an opening's line. */
function lineOf(opening: Opening): string[] {
  return opening.moves.split(/\s+/).filter(Boolean)
}

function sideAt(ply: number): Color {
  return ply % 2 === 0 ? 'w' : 'b'
}

export function OpeningsTab() {
  const [letter, setLetter] = useState<(typeof ECO_LETTERS)[number]>('B')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Opening>(OPENINGS[21]) // Sicilian
  const [step, setStep] = useState(0)
  const [practising, setPractising] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const progress = useOpeningsStore((s) => s.progress)
  const mark = useOpeningsStore((s) => s.mark)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = OPENINGS.filter(
      (o) => o.eco.startsWith(letter) && (!query || o.name.toLowerCase().includes(query)),
    )
    return dueSort(list, progress)
  }, [letter, search, progress])

  const line = lineOf(selected)
  const ply = Math.min(step, line.length)
  const { fen } = positionAtPly(line, ply)
  const side = sideAt(ply)
  const key = openingKey(selected)
  const stats = progress[key]

  // Practice mode: the solver plays the next book move — only on their booked side?
  // Keep it simple and precise: the solver plays every move of the line in order.
  const dests = practising && ply < line.length ? legalDests(new Chess(fen)) : undefined

  function onBoardMove(from: string, to: string): void {
    if (!practising || ply >= line.length) return
    const position = new Chess(fen)
    const played = position.move({ from, to })
    if (!played) return
    const expected = line[ply]
    if (played.san === expected) {
      setStep(ply + 1)
      setFeedback(null)
      if (ply + 1 === line.length) {
        mark(selected, true)
        setFeedback('Line completed — nicely done!')
      }
    } else {
      setFeedback(`The book move is ${expected}.`)
      mark(selected, false)
      setStep(0)
      setPractising(false)
    }
  }

  function startPractice(): void {
    setStep(0)
    setPractising(true)
    setFeedback(null)
  }

  return (
    <main className="flex flex-col items-start gap-6 md:flex-row">
      <div className="flex w-full max-w-[480px] shrink-0 flex-col gap-2">
        <SimpleBoard
          fen={fen}
          orientation={sideAt(0)}
          movableColor={practising ? side : undefined}
          dests={dests}
          onMove={onBoardMove}
          enabled={practising}
        />
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
          <span className="text-zinc-400">
            {selected.eco} · {selected.name}
          </span>
          <span className="text-xs text-zinc-500">
            move {ply}/{line.length}
          </span>
        </div>
        {feedback && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200">
            {feedback}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setStep(Math.max(0, ply - 1))}
            disabled={ply === 0}
            className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            ◀ Back
          </button>
          <button
            onClick={() => setStep(Math.min(line.length, ply + 1))}
            disabled={ply >= line.length}
            className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Next ▶
          </button>
          <button
            onClick={startPractice}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              practising
                ? 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            }`}
          >
            {practising ? 'Restart drill' : 'Practice line'}
          </button>
        </div>
        {practising && (
          <p className="text-xs text-zinc-500">
            Play the next book move on the board. A wrong move resets the drill.
          </p>
        )}
      </div>

      <aside className="w-full space-y-4 lg:w-80">
        <div>
          <div className="mb-2 flex gap-1">
            {ECO_LETTERS.map((l) => (
              <button
                key={l}
                onClick={() => setLetter(l)}
                className={`flex-1 rounded-md border px-2 py-1 text-sm transition-colors ${
                  letter === l ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search openings…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400"
          />
        </div>

        <div className="moves-scroll max-h-[420px] space-y-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
          {filtered.map((opening) => {
            const entry = progress[openingKey(opening)]
            const active = opening === selected
            return (
              <button
                key={openingKey(opening)}
                onClick={() => {
                  setSelected(opening)
                  setStep(0)
                  setPractising(false)
                  setFeedback(null)
                }}
                className={`w-full rounded-md px-2 py-1.5 text-left transition-colors ${
                  active ? 'bg-amber-500/10 text-amber-200' : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <p className="text-sm">
                  <span className="mr-1.5 text-xs text-zinc-500">{opening.eco}</span>
                  {opening.name}
                </p>
                {entry && (
                  <p className="text-[10px] text-zinc-600">
                    drilled {entry.drilled} · streak {entry.streak}
                    {entry.wrong > 0 ? ` · ${entry.wrong} misses` : ''}
                  </p>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="p-2 text-xs text-zinc-600">No openings match — try another letter or search.</p>
          )}
        </div>

        {stats && (
          <p className="text-xs text-zinc-600">
            Your progress on {selected.name}: {stats.correct} correct / {stats.drilled} drills.
          </p>
        )}
        <p className="text-xs text-zinc-600">
          Lines follow mainstream theory. Openings you miss come back first in the list.
        </p>
      </aside>
    </main>
  )
}
