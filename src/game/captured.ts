const FULL_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
export const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export interface CapturedSummary {
  /** Pieces White has captured (missing Black pieces), most valuable first. */
  byWhite: string[]
  /** Pieces Black has captured (missing White pieces), most valuable first. */
  byBlack: string[]
  /** White material minus Black material, in pawn points. */
  materialDiff: number
}

/** What each side has captured, read straight out of the FEN's piece placement. */
export function capturedFromFen(fen: string): CapturedSummary {
  const placement = fen.split(' ')[0] ?? ''
  const counts: Record<'w' | 'b', Record<string, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  }
  for (const ch of placement) {
    if (ch >= 'A' && ch <= 'Z') counts.w[ch.toLowerCase()] += 1
    else if (ch >= 'a' && ch <= 'z') counts.b[ch] += 1
  }
  const missing = (side: 'w' | 'b'): string[] => {
    const out: string[] = []
    for (const [piece, full] of Object.entries(FULL_COUNT)) {
      for (let i = 0; i < full - counts[side][piece]; i++) out.push(piece)
    }
    return out.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a])
  }
  const material = (side: 'w' | 'b'): number =>
    Object.entries(counts[side]).reduce((sum, [piece, n]) => sum + PIECE_VALUES[piece] * n, 0)
  return {
    byWhite: missing('b'),
    byBlack: missing('w'),
    materialDiff: material('w') - material('b'),
  }
}
