import { useGameStore } from '../store/gameStore'

export function StatusBar() {
  const status = useGameStore((s) => s.status)
  const thinking = useGameStore((s) => s.thinking)
  const turn = useGameStore((s) => s.turn)
  const playerColor = useGameStore((s) => s.playerColor)
  const pendingPromotion = useGameStore((s) => s.pendingPromotion)

  const text = (() => {
    if (status.over) {
      if (status.reason === 'resigned') return 'You resigned — the computer wins.'
      if (status.reason === 'aborted') return 'Game aborted.'
      if (status.reason === 'checkmate') {
        return status.winner === playerColor
          ? 'Checkmate — you win!'
          : 'Checkmate — the computer wins.'
      }
      switch (status.reason) {
        case 'stalemate':
          return 'Draw — stalemate.'
        case 'insufficient-material':
          return 'Draw — neither side can force checkmate.'
        case 'threefold-repetition':
          return 'Draw — threefold repetition.'
        case 'fifty-move':
          return 'Draw — fifty-move rule.'
        default:
          return 'Game over.'
      }
    }
    if (pendingPromotion) return 'Choose a piece to promote to.'
    if (thinking) return 'The computer is thinking…'
    if (turn !== playerColor) return 'Computer to move…'
    return status.check ? 'Your move — you are in check!' : 'Your move.'
  })()

  const urgent = status.over || status.check

  return (
    <div
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${
        urgent
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-200'
      }`}
    >
      {text}
    </div>
  )
}
