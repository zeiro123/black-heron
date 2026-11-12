import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Dests, Key } from 'chessground/types'
import { useEffect, useRef } from 'react'
import type { Color } from '../game/types'
import { useGameStore } from '../store/gameStore'

const cgColor = (color: Color): 'white' | 'black' => (color === 'w' ? 'white' : 'black')

export function Board() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)

  const fen = useGameStore((s) => s.fen)
  const turn = useGameStore((s) => s.turn)
  const playerColor = useGameStore((s) => s.playerColor)
  const lastMove = useGameStore((s) => s.lastMove)
  const status = useGameStore((s) => s.status)
  const dests = useGameStore((s) => s.dests)
  const thinking = useGameStore((s) => s.thinking)
  const pendingPromotion = useGameStore((s) => s.pendingPromotion)
  const tryPlayerMove = useGameStore((s) => s.tryPlayerMove)

  // Create the chessground API once.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const api = Chessground(el, {
      coordinates: true,
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      drawable: { enabled: true },
      movable: { free: false, showDests: true },
    })
    apiRef.current = api
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [])

  // Mirror the store into the board on every state change.
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    const blocked =
      status.over || thinking || pendingPromotion !== null || turn !== playerColor
    api.set({
      fen,
      turnColor: cgColor(turn),
      orientation: cgColor(playerColor),
      // chessground uses a strict square-name type (Key); our squares are plain strings
      // validated by chess.js, so this is the one place the two type worlds meet.
      lastMove: (lastMove ?? []) as Key[],
      // `check: true` makes chessground find and highlight the king of the side to move.
      check: status.check,
      movable: {
        free: false,
        color: blocked ? undefined : cgColor(playerColor),
        dests: (blocked ? undefined : dests) as Dests | undefined,
        showDests: true,
        events: { after: (orig, dest) => tryPlayerMove(orig, dest) },
      },
    })
  }, [fen, turn, playerColor, lastMove, status, dests, thinking, pendingPromotion, tryPlayerMove])

  return (
    <div className="board-shell">
      <div ref={elRef} className="board" aria-label="Chess board" />
    </div>
  )
}
