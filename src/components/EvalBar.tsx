import { winPercent } from '../engine/review'

/**
 * Vertical eval bar: black on top, White at the bottom, sized by White's win
 * probability from the engine's current evaluation.
 */
export function EvalBar({ cpWhite, orientation }: { cpWhite: number; orientation: 'w' | 'b' }) {
  const winWhite = Math.max(0, Math.min(100, winPercent(cpWhite)))
  // When the board is flipped (Black at the bottom), mirror the bar too.
  const whiteShare = orientation === 'w' ? winWhite : 100 - winWhite
  return (
    <div
      className="flex h-auto w-4 shrink-0 flex-col overflow-hidden rounded border border-zinc-700"
      title={`Eval: ${(cpWhite / 100).toFixed(2)}`}
      aria-label="Evaluation bar"
    >
      <div className="bg-zinc-800 transition-all duration-300" style={{ height: `${100 - whiteShare}%` }} />
      <div className="bg-zinc-100 transition-all duration-300" style={{ height: `${whiteShare}%` }} />
    </div>
  )
}
