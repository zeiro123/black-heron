import { useGameStore } from '../store/gameStore'

function Chevron({ kind }: { kind: 'first' | 'prev' | 'next' | 'last' }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      {kind === 'first' && <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" {...stroke} />}
      {kind === 'prev' && <path d="M14 17l-5-5 5-5" {...stroke} />}
      {kind === 'next' && <path d="M10 7l5 5-5 5" {...stroke} />}
      {kind === 'last' && <path d="M13 7l5 5-5 5M6 7l5 5-5 5" {...stroke} />}
    </svg>
  )
}

export function MoveNav() {
  const viewPly = useGameStore((s) => s.viewPly)
  const history = useGameStore((s) => s.history)
  const navigateTo = useGameStore((s) => s.navigateTo)

  const atStart = viewPly === 0
  const atLive = viewPly === history.length
  const cls = () =>
    `rounded-md border border-zinc-700 p-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30`

  return (
    <div className="flex gap-1.5" title="Step through the game (← / → keys work too)">
      <button aria-label="First move" disabled={atStart} onClick={() => navigateTo(0)} className={cls()}>
        <Chevron kind="first" />
      </button>
      <button aria-label="Previous move" disabled={atStart} onClick={() => navigateTo(viewPly - 1)} className={cls()}>
        <Chevron kind="prev" />
      </button>
      <button aria-label="Next move" disabled={atLive} onClick={() => navigateTo(viewPly + 1)} className={cls()}>
        <Chevron kind="next" />
      </button>
      <button aria-label="Latest move" disabled={atLive} onClick={() => navigateTo(history.length)} className={cls()}>
        <Chevron kind="last" />
      </button>
      <span className="ml-auto self-center text-xs text-zinc-500">
        move {Math.ceil(viewPly / 2) || 0} / {Math.ceil(history.length / 2)}
      </span>
    </div>
  )
}
