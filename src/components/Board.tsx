/// <reference types="vite/client" />
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Dests, Key } from 'chessground/types'
import { useEffect, useMemo, useRef } from 'react'
import { positionAtPly } from '../game/chessGame'
import type { Color } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { BoardArrows } from './BoardArrows'

const cgColor = (color: Color): 'white' | 'black' => (color === 'w' ? 'white' : 'black')

export function Board() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)

  const settings = useSettingsStore()
  const history = useGameStore((s) => s.history)
  const viewPly = useGameStore((s) => s.viewPly)
  const turn = useGameStore((s) => s.turn)
  const playerColor = useGameStore((s) => s.playerColor)
  const status = useGameStore((s) => s.status)
  const dests = useGameStore((s) => s.dests)
  const thinking = useGameStore((s) => s.thinking)
  const pendingPromotion = useGameStore((s) => s.pendingPromotion)
  const tryPlayerMove = useGameStore((s) => s.tryPlayerMove)

  // The board shows the position the viewer stepped to (back/forward navigation).
  const display = useMemo(() => positionAtPly(history, viewPly), [history, viewPly])
  const atLive = viewPly === history.length
  const canMove = atLive && !status.over && !thinking && !pendingPromotion && turn === playerColor

  // Create the chessground API once.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const api = Chessground(el, {
      drawable: { enabled: false },
      movable: { free: false },
    })
    apiRef.current = api
    if (import.meta.env.DEV) {
      // Debug hook (dev only): lets us drive and inspect chessground from the console/tests.
      ;(window as unknown as { __cg?: Api }).__cg = api
    }
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [])

  // Mirror the store into the board on every state change.
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    api.set({
      fen: display.fen,
      turnColor: cgColor(turn),
      orientation: cgColor(playerColor),
      // chessground uses a strict square-name type (Key); our squares are plain strings
      // validated by chess.js, so this is the one place the two type worlds meet.
      lastMove: (settings.highlightLastMove ? display.lastMove : []) as Key[],
      // `check: true` makes chessground find and highlight the king of the side to move.
      check: status.check,
      coordinates: settings.showCoordinates,
      animation: { enabled: settings.animateMoves, duration: 200 },
      highlight: { lastMove: settings.highlightLastMove, check: true },
      movable: {
        free: false,
        color: canMove ? cgColor(playerColor) : undefined,
        dests: (canMove ? dests : undefined) as Dests | undefined,
        showDests: settings.showDests,
        events: { after: (orig, dest) => tryPlayerMove(orig, dest) },
      },
    })
  }, [display, turn, playerColor, status, dests, canMove, tryPlayerMove, settings])

  const getRole = (square: string): string | null =>
    apiRef.current?.state.pieces.get(square as Key)?.role ?? null

  return (
    <div className={`board-shell board-theme-${settings.boardTheme}`}>
      <BoardArrows getRole={getRole}>
        <div ref={elRef} className="board" aria-label="Chess board" />
      </BoardArrows>
    </div>
  )
}
