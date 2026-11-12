import { Chess } from 'chess.js'

// Phase 6 — rule-based coach, detection core.
// Everything here is precise and self-contained: we compute piece attacks from the
// board ourselves instead of relying on move generation, so pinned pieces still
// "attack", pawn directions are exact, and every rule is unit-testable.

export type Role = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Color = 'w' | 'b'

export interface Cell {
  role: Role
  color: Color
}
/** Grid indexed [row][file]; row 0 = rank 8, file 0 = file a. */
export type Grid = (Cell | null)[][]

export const PIECE_VALUE: Record<Role, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
export const ROLE_NAME: Record<Role, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export function squareName(file: number, row: number): string {
  return 'abcdefgh'[file] + String(8 - row)
}

export function gridFromFen(fen: string): Grid {
  const board = new Chess(fen).board()
  return board.map((row) =>
    row.map((cell) => (cell ? { role: cell.type as Role, color: cell.color as Color } : null)),
  )
}

const KNIGHT_OFFSETS: [number, number][] = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
]
const KING_OFFSETS: [number, number][] = [
  [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1],
]

/** All squares a piece on (file,row) attacks (pawns: diagonal attacks only). */
export function attackedSquares(grid: Grid, file: number, row: number): [number, number][] {
  const piece = grid[row]?.[file]
  if (!piece) return []
  const inBoard = (f: number, r: number): boolean => f >= 0 && f <= 7 && r >= 0 && r <= 7
  const out: [number, number][] = []
  const pushRay = (stepF: number, stepR: number) => {
    let f = file + stepF
    let r = row + stepR
    while (inBoard(f, r)) {
      out.push([f, r])
      if (grid[r][f]) break // ray stops at the first blocker (which is still attacked)
      f += stepF
      r += stepR
    }
  }
  switch (piece.role) {
    case 'p': {
      const dir = piece.color === 'w' ? -1 : 1 // White attacks toward rank 8 (row-1)
      for (const df of [-1, 1]) {
        const f = file + df
        const r = row + dir
        if (inBoard(f, r)) out.push([f, r])
      }
      break
    }
    case 'n':
      for (const [df, dr] of KNIGHT_OFFSETS) {
        if (inBoard(file + df, row + dr)) out.push([file + df, row + dr])
      }
      break
    case 'k':
      for (const [df, dr] of KING_OFFSETS) {
        if (inBoard(file + df, row + dr)) out.push([file + df, row + dr])
      }
      break
    case 'b':
      for (const [sf, sr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) pushRay(sf, sr)
      break
    case 'r':
      for (const [sf, sr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) pushRay(sf, sr)
      break
    case 'q':
      for (const [sf, sr] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]] as const)
        pushRay(sf, sr)
      break
  }
  return out
}

/** Does the piece on (file,row) attack (tf,tr) on this grid? */
export function attacksSquare(grid: Grid, file: number, row: number, tf: number, tr: number): boolean {
  if (file === tf && row === tr) return false
  return attackedSquares(grid, file, row).some(([f, r]) => f === tf && r === tr)
}

/** Squares of `byColor` pieces that attack (tf,tr). */
export function attackersOf(grid: Grid, tf: number, tr: number, byColor: Color): [number, number][] {
  const out: [number, number][] = []
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      const piece = grid[row][file]
      if (piece && piece.color === byColor && attacksSquare(grid, file, row, tf, tr)) {
        out.push([file, row])
      }
    }
  }
  return out
}

function findKing(grid: Grid, color: Color): [number, number] | null {
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      const piece = grid[row][file]
      if (piece && piece.role === 'k' && piece.color === color) return [file, row]
    }
  }
  return null
}

export interface HangingPiece {
  square: string
  role: Role
  color: Color
  reason: string
}

/**
 * Pieces of `color` that the enemy wins material from:
 * attacked, and either undefended or attacked by a strictly cheaper piece.
 */
export function hangingPieces(grid: Grid, color: Color): HangingPiece[] {
  const enemy: Color = color === 'w' ? 'b' : 'w'
  const out: HangingPiece[] = []
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      const piece = grid[row][file]
      if (!piece || piece.color !== color || piece.role === 'k') continue
      const attackers = attackersOf(grid, file, row, enemy)
      if (attackers.length === 0) continue
      const defenders = attackersOf(grid, file, row, color)
      const cheapestAttacker = Math.min(
        ...attackers.map(([f, r]) => PIECE_VALUE[grid[r][f]!.role]),
      )
      const value = PIECE_VALUE[piece.role]
      if (defenders.length === 0) {
        out.push({ square: squareName(file, row), role: piece.role, color, reason: 'undefended' })
      } else if (cheapestAttacker < value) {
        const cheapestSquare = attackers.find(([f, r]) => PIECE_VALUE[grid[r][f]!.role] === cheapestAttacker)!
        out.push({
          square: squareName(file, row),
          role: piece.role,
          color,
          reason: `attacked by a ${ROLE_NAME[grid[cheapestSquare[1]][cheapestSquare[0]]!.role]}`,
        })
      }
    }
  }
  return out.sort((a, b) => PIECE_VALUE[b.role] - PIECE_VALUE[a.role])
}

export interface Pin {
  square: string
  role: Role
  color: Color
  bySquare: string
  byRole: Role
}

function strictlyBetween(
  af: number, ar: number, bf: number, br: number, mf: number, mr: number,
): boolean {
  const df = bf - af
  const dr = br - ar
  if (!(df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr))) return false
  const sf = Math.sign(df)
  const sr = Math.sign(dr)
  let f = af + sf
  let r = ar + sr
  while (f !== bf || r !== br) {
    if (f === mf && r === mr) return true
    f += sf
    r += sr
  }
  return false
}

/**
 * Absolute pins: a piece of `color` whose removal exposes its own king to an enemy
 * slider along the line through the piece.
 */
export function pinnedPieces(grid: Grid, color: Color): Pin[] {
  const enemy: Color = color === 'w' ? 'b' : 'w'
  const king = findKing(grid, color)
  if (!king) return []
  const [kf, kr] = king
  const out: Pin[] = []
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      const piece = grid[row][file]
      if (!piece || piece.color !== color || piece.role === 'k') continue
      const without = grid.map((r, ri) => r.map((c, ci) => (ri === row && ci === file ? null : c)))
      const sliders = attackersOf(without, kf, kr, enemy).filter(([f, r]) => {
        const attacker = without[r][f]!
        return attacker.role === 'r' || attacker.role === 'b' || attacker.role === 'q'
      })
      for (const [f, r] of sliders) {
        if (strictlyBetween(f, r, kf, kr, file, row)) {
          out.push({
            square: squareName(file, row),
            role: piece.role,
            color,
            bySquare: squareName(f, r),
            byRole: without[r][f]!.role,
          })
          break
        }
      }
    }
  }
  return out
}

export interface Fork {
  square: string
  role: Role
  color: Color
  targets: { square: string; role: Role }[]
}

/**
 * A fork: the piece attacks 2+ enemy pieces of value >= knight or the king,
 * each of which is undefended or worth more than the attacker (i.e. it wins something).
 */
export function findFork(grid: Grid, file: number, row: number): Fork | null {
  const piece = grid[row]?.[file]
  if (!piece || piece.role === 'p' || piece.role === 'k') return null
  const enemy: Color = piece.color === 'w' ? 'b' : 'w'
  const targets: { square: string; role: Role }[] = []
  for (let tr = 0; tr < 8; tr++) {
    for (let tf = 0; tf < 8; tf++) {
      const target = grid[tr][tf]
      if (!target || target.color !== enemy) continue
      if (target.role !== 'k' && PIECE_VALUE[target.role] < 3) continue
      if (!attacksSquare(grid, file, row, tf, tr)) continue
      const defenders = attackersOf(grid, tf, tr, target.color)
      const winsSomething =
        target.role === 'k' || defenders.length === 0 || PIECE_VALUE[piece.role] < PIECE_VALUE[target.role]
      if (winsSomething) targets.push({ square: squareName(tf, tr), role: target.role })
    }
  }
  if (targets.length >= 2) return { square: squareName(file, row), role: piece.role, color: piece.color, targets }
  return null
}

/**
 * King pressure: how many DISTINCT enemy pieces attack the 3x3 zone around `color`'s king.
 */
export function kingZonePressure(grid: Grid, color: Color): { attackers: number; inCheck: boolean } {
  const enemy: Color = color === 'w' ? 'b' : 'w'
  const king = findKing(grid, color)
  if (!king) return { attackers: 0, inCheck: false }
  const [kf, kr] = king
  const zone: [number, number][] = []
  for (const [df, dr] of KING_OFFSETS) {
    const f = kf + df
    const r = kr + dr
    if (f >= 0 && f <= 7 && r >= 0 && r <= 7) zone.push([f, r])
  }
  zone.push([kf, kr])
  const attackers = new Set<string>()
  for (const [f, r] of zone) {
    for (const [af, ar] of attackersOf(grid, f, r, enemy)) {
      attackers.add(`${af},${ar}`)
    }
  }
  return { attackers: attackers.size, inCheck: attackersOf(grid, kf, kr, enemy).length > 0 }
}
