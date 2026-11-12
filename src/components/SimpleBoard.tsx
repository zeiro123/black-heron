import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Dests, Key } from 'chessground/types'
import { useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import type { Color } from '../game/types'
import { useSettingsStore } from '../store/settingsStore'
import type { Shape } from './BoardArrows'
import { BoardArrows } from './BoardArrows'

const cgColor = (color: Color): 'white' | 'black' => (color === 'w' ? 'white' : 'black')

/** Promotion suffix for a move from `fen`: 'q' when a pawn reaches the last rank. */
function promotionFor(fen: string, from: string, to: string): string | undefined {
  const piece = new Chess(fen).get(from as never)
  if (piece?.type === 'p' && (to[1] === '8' || to[1] === '1')) return 'q'
  return undefined
}

/**
 * A self-contained chessground board for the puzzle and opening tabs: driven purely
 * by props (fen, orientation, movable colour + dests), with optional hint shapes.
 */
export function SimpleBoard({
  fen,
  orientation,
  movableColor,
  dests,
  onMove,
  hintShapes,
  enabled = true,
}: {
  fen: string
  orientation: Color
  movableColor?: Color
  dests?: Map<string, string[]>
  onMove?: (from: string, to: string, promotion?: string) => void
  hintShapes?: Shape[]
  enabled?: boolean
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)
  const settings = useSettingsStore()
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const api = Chessground(el, {
      drawable: { enabled: false },
      movable: { free: false },
    })
    apiRef.current = api
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    const movable = enabled && movableColor !== undefined
    api.set({
      fen,
      orientation: cgColor(orientation),
      turnColor: cgColor(orientation),
      coordinates: settings.showCoordinates && settings.coordPlacement === 'inside',
      animation: { enabled: settings.animateMoves, duration: 200 },
      highlight: { lastMove: settings.highlightLastMove, check: true },
      movable: {
        free: false,
        color: movable ? cgColor(movableColor) : undefined,
        dests: (movable && dests ? dests : undefined) as Dests | undefined,
        showDests: settings.showDests,
        events: {
          after: (orig: Key, dest: Key) =>
            onMoveRef.current?.(orig, dest, promotionFor(fen, orig, dest)),
        },
      },
    })
  }, [fen, orientation, movableColor, dests, enabled, settings])

  return (
    <div className="board-shell board-theme-plain" style={{ width: 'min(92vw, 480px)' }}>
      <BoardArrows getRole={() => null} coachShapes={hintShapes}>
        <div ref={elRef} className="board" aria-label="Board" />
      </BoardArrows>
    </div>
  )
}
