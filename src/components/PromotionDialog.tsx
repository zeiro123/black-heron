import { useGameStore } from '../store/gameStore'

const PROMOTION_PIECES = ['q', 'r', 'b', 'n'] as const
const GLYPHS = { q: '♛', r: '♜', b: '♝', n: '♞' } as const

export function PromotionDialog() {
  const pending = useGameStore((s) => s.pendingPromotion)
  const playerColor = useGameStore((s) => s.playerColor)
  const choosePromotion = useGameStore((s) => s.choosePromotion)
  const cancelPromotion = useGameStore((s) => s.cancelPromotion)

  if (!pending) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={cancelPromotion}
    >
      <div
        className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-3 text-sm text-zinc-400">Promote your pawn to:</p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece}
              onClick={() => choosePromotion(piece)}
              title={piece.toUpperCase()}
              className={`h-16 w-16 rounded-lg border border-zinc-700 text-5xl leading-none transition-colors hover:border-amber-400 hover:bg-zinc-800 ${
                playerColor === 'w' ? 'text-zinc-100' : 'text-zinc-400'
              }`}
            >
              {GLYPHS[piece]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
