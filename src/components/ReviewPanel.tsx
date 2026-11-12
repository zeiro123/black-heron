import type { MoveLabel } from '../engine/review'
import { useGameStore } from '../store/gameStore'
import { useReviewStore } from '../store/reviewStore'

/** Chess.com-ish label colours. */
export const LABEL_COLORS: Record<MoveLabel, string> = {
  brilliant: '#26c2a3',
  great: '#5b8bb0',
  best: '#95bb4a',
  excellent: '#96b948',
  good: '#9cb37e',
  inaccuracy: '#f7c631',
  mistake: '#ffa459',
  blunder: '#fa412d',
}

export function ReviewPanel() {
  const status = useReviewStore((s) => s.status)
  const progress = useReviewStore((s) => s.progress)
  const review = useReviewStore((s) => s.review)
  const reviewedPlies = useReviewStore((s) => s.reviewedPlies)
  const run = useReviewStore((s) => s.run)
  const history = useGameStore((s) => s.history)
  const navigateTo = useGameStore((s) => s.navigateTo)
  const playerColor = useGameStore((s) => s.playerColor)

  const running = status === 'running'
  const disabled = running || history.length === 0
  const stale = status === 'done' && reviewedPlies !== history.length

  // White win% at the currently viewed ply, for the graph marker.
  const viewPly = useGameStore((s) => s.viewPly)
  const marker =
    review && viewPly < review.winHistory.length ? review.winHistory[viewPly] : null

  const graphClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!review) return
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = (event.clientX - rect.left) / rect.width
    navigateTo(Math.round(fraction * (review.winHistory.length - 1)))
  }

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Game review</p>
      <button
        onClick={() => void run()}
        disabled={disabled}
        className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running
          ? `Analysing ${progress.done}/${progress.total}…`
          : status === 'done' && !stale
            ? 'Re-run review'
            : 'Review game'}
      </button>

      {stale && (
        <p className="mt-2 text-xs text-amber-300">
          The game changed since this review — run it again for fresh labels.
        </p>
      )}

      {review && !stale && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2 text-sm">
            <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <p className="text-xs text-zinc-500">Your accuracy</p>
              <p className="text-lg font-semibold text-zinc-100">
                {(playerColor === 'w' ? review.accuracies.w : review.accuracies.b).toFixed(1)}%
              </p>
            </div>
            <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <p className="text-xs text-zinc-500">Bot accuracy</p>
              <p className="text-lg font-semibold text-zinc-100">
                {(playerColor === 'w' ? review.accuracies.b : review.accuracies.w).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Evaluation graph: white win% over the game; top = White winning. */}
          <svg
            viewBox="0 0 100 40"
            className="h-24 w-full cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/60"
            preserveAspectRatio="none"
            onClick={graphClick}
          >
            <line x1="0" y1="20" x2="100" y2="20" stroke="#52525b" strokeWidth="0.4" />
            {review.winHistory.map((win, i) => {
              if (i === 0) return null
              const prev = review.winHistory[i - 1]
              const x1 = ((i - 1) / (review.winHistory.length - 1)) * 100
              const x2 = (i / (review.winHistory.length - 1)) * 100
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={40 - (prev / 100) * 40}
                  x2={x2}
                  y2={40 - (win / 100) * 40}
                  stroke="#d4d4d8"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              )
            })}
            {marker !== null && (
              <circle
                cx={(viewPly / (review.winHistory.length - 1)) * 100}
                cy={40 - (marker / 100) * 40}
                r="1.2"
                fill="#fbbf24"
              />
            )}
          </svg>

          {/* Move-by-move labels */}
          <div className="moves-scroll max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-sm">
              <tbody>
                {history.map((san, i) => {
                  const label = review.labels[i]
                  return (
                    <tr
                      key={i}
                      className="cursor-pointer border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-800/40"
                      onClick={() => navigateTo(i + 1)}
                    >
                      <td className="w-10 px-2 py-1 text-right text-zinc-500">
                        {i % 2 === 0 ? `${i / 2 + 1}.` : ''}
                      </td>
                      <td className="px-2 py-1 text-zinc-100">{san}</td>
                      <td className="px-2 py-1 text-right">
                        <span
                          title={label}
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: LABEL_COLORS[label] }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600">
            Click a move or the graph to jump to that position. Colours: teal brilliant · blue
            great · green best · yellow inaccuracy · orange mistake · red blunder.
          </p>
        </div>
      )}
    </div>
  )
}
