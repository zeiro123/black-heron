import { useEffect } from 'react'
import { useCoachStore } from '../store/coachStore'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'

export function CoachPanel() {
  const status = useCoachStore((s) => s.status)
  const report = useCoachStore((s) => s.report)
  const showLine = useCoachStore((s) => s.showLine)
  const setShowLine = useCoachStore((s) => s.setShowLine)
  const analyse = useCoachStore((s) => s.analyse)

  const gameId = useGameStore((s) => s.gameId)
  const history = useGameStore((s) => s.history)
  const thinking = useGameStore((s) => s.thinking)
  const playerColor = useGameStore((s) => s.playerColor)
  const liveCoach = useSettingsStore((s) => s.liveCoach)

  // Live coach: analyse whenever it is the player's turn and nothing is pending.
  useEffect(() => {
    if (!liveCoach || thinking) return
    void analyse()
  }, [gameId, history.length, thinking, liveCoach, analyse, playerColor])

  const analysing = status === 'analysing'

  return (
    <div>
      <p className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
        <span>Coach</span>
        {analysing && <span className="font-normal normal-case text-amber-300">thinking…</span>}
      </p>

      {!liveCoach && (
        <p className="text-xs text-zinc-600">Live coach is off — enable it in the settings.</p>
      )}

      {liveCoach && report && (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
          <p className="text-zinc-300">{report.evalPhrase}</p>

          {report.best && (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-zinc-100">Try {report.best.san}</p>
                <p className="text-xs text-zinc-400">{report.best.phrase}</p>
              </div>
              <button
                onClick={() => setShowLine(!showLine)}
                className={`shrink-0 rounded-md border px-2 py-1 text-xs transition-colors ${
                  showLine
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                    : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {showLine ? 'Hide line' : 'Show line'}
              </button>
            </div>
          )}

          {report.continuation.length > 0 && showLine && (
            <p className="text-xs text-sky-300">
              Expected line drawn on the board: {report.continuation.slice(0, 4).join(' → ')}
            </p>
          )}

          {(report.threats.ourHanging.length > 0 ||
            report.threats.ourPins.length > 0 ||
            report.threats.inCheck ||
            (report.threats.mateIn !== null && report.threats.mateIn < 0)) && (
            <div className="rounded-md border border-red-500/40 bg-red-500/5 p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Watch out</p>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                {report.threats.inCheck && <li>Your king is in check.</li>}
                {report.threats.mateIn !== null && report.threats.mateIn < 0 && (
                  <li>You get mated in {Math.abs(report.threats.mateIn)} moves — find the defence.</li>
                )}
                {report.threats.ourHanging.map((h) => (
                  <li key={h.square}>
                    Your {h.piece} on {h.square} is {h.reason}.
                  </li>
                ))}
                {report.threats.ourPins.map((p) => (
                  <li key={p.square}>
                    Your {p.piece} on {p.square} is pinned by the {p.byPiece} on {p.bySquare}.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.threats.theirHanging.length > 0 && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Opportunities</p>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
                {report.threats.theirHanging.map((h) => (
                  <li key={h.square}>
                    Their {h.piece} on {h.square} is {h.reason} — win it.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.lastMove && (
            <div className="rounded-md border border-zinc-700 bg-zinc-800/40 p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Last move ({report.lastMove.san})
              </p>
              <p className="mt-1 text-xs text-zinc-300">{report.lastMove.phrase}</p>
            </div>
          )}

          {report.ourLastWarning && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
              <p className="text-xs text-amber-200">{report.ourLastWarning.phrase}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
