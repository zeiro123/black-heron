import type { Color } from '../game/types'

const BLACK_GLYPHS: Record<string, string> = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const WHITE_GLYPHS: Record<string, string> = { q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }

export function PlayerBar({
  color,
  name,
  nameEditable,
  onNameChange,
  captured,
  materialDiff,
  thinking,
  subtitle,
}: {
  color: Color
  name: string
  nameEditable?: boolean
  onNameChange?: (name: string) => void
  /** Piece letters this player has captured, most valuable first. */
  captured: string[]
  /** This player's material minus the opponent's, in pawn points. */
  materialDiff: number
  thinking?: boolean
  subtitle?: string
}) {
  // Captured pieces belong to the opposite color — show them in their own style.
  const glyphs = color === 'w' ? BLACK_GLYPHS : WHITE_GLYPHS
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-lg leading-none ${
          color === 'w'
            ? 'border-zinc-500 bg-zinc-200 text-zinc-700'
            : 'border-zinc-600 bg-zinc-800 text-zinc-200'
        }`}
        title={color === 'w' ? 'White' : 'Black'}
      >
        {color === 'w' ? '♔' : '♚'}
      </span>
      <div className="min-w-0 flex-1">
        {nameEditable && onNameChange ? (
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Type your name…"
            maxLength={24}
            className="w-full bg-transparent text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        ) : (
          <p className="truncate text-sm font-medium text-zinc-100">
            {name}
            {thinking && <span className="ml-1 text-xs font-normal text-amber-300">· thinking…</span>}
          </p>
        )}
        {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`text-base leading-none ${color === 'w' ? 'text-zinc-500' : 'text-zinc-300'}`}>
          {captured.map((piece, index) => (
            <span key={`${piece}-${index}`}>{glyphs[piece]}</span>
          ))}
        </span>
        {materialDiff > 0 && <span className="text-xs font-semibold text-zinc-400">+{materialDiff}</span>}
      </div>
    </div>
  )
}
