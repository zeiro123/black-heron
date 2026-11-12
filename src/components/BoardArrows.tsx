import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface Shape {
  kind: 'arrow' | 'circle'
  from: string
  to: string
  color?: string
}

const ARROW_COLOR = '#15781b'
const FILES = 'abcdefgh'

/**
 * Right-click arrows and circles, drawn in our own SVG layer so that
 * knight-move arrows can BEND along the piece's path (chess.com style).
 * Left click clears the drawings, like the Lichess board.
 * `coachShapes` are the engine's expected line — drawn in blue underneath.
 */
export function BoardArrows({
  getRole,
  coachShapes,
  children,
}: {
  getRole: (square: string) => string | null
  coachShapes?: Shape[]
  children: ReactNode
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const dragFrom = useRef<string | null>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [preview, setPreview] = useState<Shape | null>(null)

  const squareAt = useCallback((clientX: number, clientY: number): string | null => {
    const el = anchorRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const size = rect.width / 8
    const file = Math.floor((clientX - rect.left) / size)
    const row = Math.floor((clientY - rect.top) / size)
    if (file < 0 || file > 7 || row < 0 || row > 7) return null
    return FILES[file] + String(8 - row)
  }, [])

  const onMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) {
      setShapes([]) // left click clears drawings
      return
    }
    if (event.button !== 2) return
    const from = squareAt(event.clientX, event.clientY)
    if (!from) return
    dragFrom.current = from
    setPreview({ kind: 'circle', from, to: from })
  }

  const onMouseMove = (event: React.MouseEvent) => {
    const from = dragFrom.current
    if (!from) return
    const to = squareAt(event.clientX, event.clientY)
    if (!to) return
    setPreview(to === from ? { kind: 'circle', from, to } : { kind: 'arrow', from, to })
  }

  const finish = (event: React.MouseEvent) => {
    const from = dragFrom.current
    dragFrom.current = null
    setPreview(null)
    if (!from) return
    const to = squareAt(event.clientX, event.clientY) ?? from
    const shape: Shape = to === from ? { kind: 'circle', from, to } : { kind: 'arrow', from, to }
    setShapes((current) => {
      const same = (s: Shape) => s.kind === shape.kind && s.from === shape.from && s.to === shape.to
      if (current.some(same)) return current.filter((s) => !same(s)) // drawing again removes it
      return [...current.filter((s) => !(s.from === shape.from && s.to === shape.to)), shape]
    })
  }

  const center = (square: string): [number, number] => [
    FILES.indexOf(square[0]) + 0.5,
    8 - Number(square[1]) + 0.5,
  ]

  /** Is the jump from→to a knight's (1,2) jump? */
  const knightShape = (from: string, to: string): boolean => {
    const [fx, fy] = squarePos(from)
    const [tx, ty] = squarePos(to)
    const dx = Math.abs(tx - fx)
    const dy = Math.abs(ty - fy)
    return (dx === 1 && dy === 2) || (dx === 2 && dy === 1)
  }

  // Piece-aware arrows: sliders (rook/bishop/queen) snap onto their legal move
  // lines, knights bend along their jump, king/pawn/empty squares draw freely.
  const squarePos = (square: string): [number, number] => [
    FILES.indexOf(square[0]),
    8 - Number(square[1]),
  ]
  const posKey = (file: number, row: number): string => `${FILES[file]}${8 - row}`

  const snapTarget = (from: string, to: string, role: string | null): string => {
    if (!role || role === 'knight' || role === 'king' || role === 'pawn') return to
    const [fx, fy] = squarePos(from)
    const [tx, ty] = squarePos(to)
    const dx = tx - fx
    const dy = ty - fy
    if (dx === 0 && dy === 0) return to
    const sx = Math.sign(dx) || 1
    const sy = Math.sign(dy) || 1
    const diagonalLen = Math.min(sx > 0 ? 7 - fx : fx, sy > 0 ? 7 - fy : fy)
    const diagonal = Math.abs(dx) === Math.abs(dy)
    const straight = dx === 0 || dy === 0
    if (role === 'bishop') {
      if (diagonal) return to
      // Snap onto the nearest diagonal through the origin square.
      return posKey(fx + diagonalLen * sx, fy + diagonalLen * sy)
    }
    if (role === 'rook') {
      if (straight) return to
      // Snap onto the dominant rank or file through the origin square.
      return Math.abs(dx) >= Math.abs(dy) ? posKey(tx, fy) : posKey(fx, ty)
    }
    // Queen: exact lines stay; otherwise snap to whichever legal line fits best.
    if (diagonal || straight) return to
    const diagness =
      1 - Math.abs(Math.abs(dx) - Math.abs(dy)) / Math.max(Math.abs(dx), Math.abs(dy))
    if (diagness >= 0.5) return posKey(fx + diagonalLen * sx, fy + diagonalLen * sy)
    return Math.abs(dx) >= Math.abs(dy) ? posKey(tx, fy) : posKey(fx, ty)
  }

  const renderShape = (shape: Shape, key: string) => {
    const color = shape.color ?? ARROW_COLOR
    const [fx, fy] = center(shape.from)
    if (shape.kind === 'circle') {
      return (
        <circle
          key={key}
          cx={fx}
          cy={fy}
          r={0.46}
          fill="none"
          stroke={color}
          strokeWidth={0.08}
          opacity={0.8}
        />
      )
    }
    // Coach arrows follow the engine's line: knight-shaped jumps always bend (the
    // PV is a legal line, so a (1,2) jump there is a knight). User arrows check the piece.
    const isCoach = shape.color !== undefined
    const role = isCoach ? null : getRole(shape.from)
    const bends = isCoach
      ? knightShape(shape.from, shape.to)
      : role === 'knight' && knightShape(shape.from, shape.to)
    const [tx, ty] = center(snapTarget(shape.from, shape.to, role))
    const dx = Math.round(tx - fx)
    const dy = Math.round(ty - fy)
    const markerId = isCoach ? 'heron-arrowhead-blue' : 'heron-arrowhead-green'
    if (!bends) {
      return (
        <line
          key={key}
          x1={fx}
          y1={fy}
          x2={tx}
          y2={ty}
          stroke={color}
          strokeWidth={0.18}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
          opacity={0.85}
        />
      )
    }
    // Bend at the corner of the knight's path: short axis first, long axis into the target.
    const corner: [number, number] = Math.abs(dx) < Math.abs(dy) ? [fx + dx, fy] : [fx, fy + dy]
    return (
      <path
        key={key}
        d={`M ${fx} ${fy} L ${corner[0]} ${corner[1]} L ${tx} ${ty}`}
        fill="none"
        stroke={color}
        strokeWidth={0.18}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        opacity={0.85}
      />
    )
  }

  const coach = (coachShapes ?? []).map((s) => ({ ...s, color: '#003088' }))
  const all = [...coach, ...(preview ? [...shapes, preview] : shapes)]

  return (
    <div
      ref={anchorRef}
      className="board-anchor"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finish}
      onMouseLeave={() => {
        dragFrom.current = null
        setPreview(null)
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
      <svg className="cg-arrows" viewBox="0 0 8 8" aria-hidden="true">
        <defs>
          <marker id="heron-arrowhead-green" markerWidth="2.2" markerHeight="2.2" refX="1.4" refY="1.1" orient="auto">
            <path d="M0,0 L2.2,1.1 L0,2.2 z" fill="#15781b" />
          </marker>
          <marker id="heron-arrowhead-blue" markerWidth="2.2" markerHeight="2.2" refX="1.4" refY="1.1" orient="auto">
            <path d="M0,0 L2.2,1.1 L0,2.2 z" fill="#003088" />
          </marker>
        </defs>
        {all.map((shape, index) => renderShape(shape, `${shape.kind}-${shape.from}-${shape.to}-${index}`))}
      </svg>
    </div>
  )
}
