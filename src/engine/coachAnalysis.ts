import { Chess } from 'chess.js'
import { positionAtPly } from '../game/chessGame'
import {
  ROLE_NAME,
  attackedSquares,
  findFork,
  gridFromFen,
  hangingPieces,
  kingZonePressure,
  pinnedPieces,
  squareName,
  type Color,
} from '../game/coach'
import type { UciEngine } from './uciEngine'
import { classifyMove, winPercent, type MoveLabel } from './review'

// Phase 6 — rule-based coach: analyse the live position, detect tactical features with
// the precise rules in game/coach.ts, and phrase everything from real engine data.

const COACH_DEPTH = 10

export interface ThreatReport {
  inCheck: boolean
  /** We get mated in N moves (from the engine's current search). */
  mateIn: number | null
  /** Our pieces the enemy can win, worst first. */
  ourHanging: { square: string; piece: string; reason: string }[]
  /** Their pieces we can win, worst first. */
  theirHanging: { square: string; piece: string; reason: string }[]
  /** Our pieces pinned to our king. */
  ourPins: { square: string; piece: string; bySquare: string; byPiece: string }[]
  /** Forks the opponent's last move created against us. */
  forksAgainstUs: { square: string; piece: string; targets: string[] }[]
  /** Distinct enemy pieces attacking the zone around each king. */
  kingPressure: { ours: number; theirs: number }
}

export interface LastMoveStory {
  mover: Color
  san: string
  label: MoveLabel
  phrase: string
  /** UCI of the stronger move the mover missed (for mistakes and blunders). */
  better?: string
}

export interface CoachReport {
  /** White-perspective centipawns from the engine's current search. */
  cpWhite: number
  evalPhrase: string
  best: { san: string; uci: string; phrase: string } | null
  /** The engine's expected line, UCI (first moves of the PV). */
  continuation: string[]
  threats: ThreatReport
  /** Story of the last played move (opponent's or ours, depending on who moved). */
  lastMove: LastMoveStory | null
  /** Warning about OUR previous move, when it lost win probability. */
  ourLastWarning: { san: string; label: MoveLabel; phrase: string } | null
}

export function evalPhrase(cpWhite: number): string {
  const abs = Math.abs(cpWhite)
  if (abs < 30) return 'The position is roughly equal.'
  const side = cpWhite > 0 ? 'White' : 'Black'
  if (abs < 100) return `${side} has a small edge.`
  if (abs < 300) return `${side} has a clear advantage.`
  if (abs < 800) return `${side} is winning.`
  return `${side} has a decisive advantage.`
}

const HOME_SQUARES: Record<Color, Record<string, string[]>> = {
  w: { n: ['b1', 'g1'], b: ['c1', 'f1'] },
  b: { n: ['b8', 'g8'], b: ['c8', 'f8'] },
}

function isDeveloping(move: { piece: string; from: string; color: Color }): boolean {
  const homes = HOME_SQUARES[move.color]?.[move.piece]
  return !!homes && homes.includes(move.from)
}

function describeMove(fen: string, uci: string): { san: string; phrase: string } {
  const chess = new Chess(fen)
  const move = chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
  })
  const capturedName = move.captured ? ROLE_NAME[move.captured as keyof typeof ROLE_NAME] : null
  let phrase: string
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    phrase = 'Castle to get your king out of the centre.'
  } else if (move.flags.includes('p')) {
    phrase = 'Promote the pawn — a new piece decides the endgame.'
  } else if (move.captured && capturedName) {
    // Was the captured piece hanging (undefended) before the move?
    const wasHanging = hangingPieces(gridFromFen(fen), move.color === 'w' ? 'b' : 'w').some(
      (h) => h.square === move.to,
    )
    phrase = wasHanging
      ? `Win the ${capturedName} on ${move.to} — it was undefended.`
      : `Capture the ${capturedName} on ${move.to}.`
  } else if (move.san.includes('+') || move.san.includes('#')) {
    phrase = `Give check with ${move.san}.`
  } else if (isDeveloping({ piece: move.piece, from: move.from, color: move.color })) {
    phrase = `Develop the ${ROLE_NAME[move.piece as keyof typeof ROLE_NAME]}.`
  } else if (move.piece === 'p' && ['e4', 'd4', 'e5', 'd5', 'c4', 'c5'].includes(move.to)) {
    phrase = 'Claim space in the centre.'
  } else {
    phrase = `Improve the ${ROLE_NAME[move.piece as keyof typeof ROLE_NAME]}'s position.`
  }
  return { san: move.san, phrase }
}

function lastMoveStory(
  fenBefore: string,
  playedSan: string,
  fenAfter: string,
  candidatesForMover: { uci: string; cp: number | null }[],
): LastMoveStory {
  const chess = new Chess(fenBefore)
  const move = chess.move(playedSan)
  const mover: Color = move.color
  const gridAfter = gridFromFen(fenAfter)
  const opponent: Color = mover === 'w' ? 'b' : 'w'

  // Quality: how much win% the mover left on the table.
  const bestLine = candidatesForMover[0]
  const playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
  const playedEntry = candidatesForMover.find((c) => c.uci === playedUci)
  const winBefore = winPercent(bestLine?.cp ?? 0)
  const winPlayed = winPercent(playedEntry?.cp ?? 0)
  const loss = Math.max(0, winBefore - winPlayed)
  const second = candidatesForMover[1]
  const secondGap = second ? Math.abs(winBefore - winPercent(second.cp ?? 0)) : 0
  const label = classifyMove({
    loss,
    playedBest: playedUci === (bestLine?.uci ?? ''),
    winBefore,
    isSacrifice: !!move.captured && move.piece === 'q' && (move.captured === 'p' || move.captured === 'n'),
    secondBestWinGap: secondGap,
  })

  const bits: string[] = []
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    bits.push('Castling gets the king to safety')
  } else if (move.captured) {
    bits.push(`Capturing your ${ROLE_NAME[move.captured as keyof typeof ROLE_NAME]} on ${move.to}`)
  } else if (isDeveloping({ piece: move.piece, from: move.from, color: mover })) {
    bits.push(`Developing the ${ROLE_NAME[move.piece as keyof typeof ROLE_NAME]}`)
  } else {
    bits.push(`Moving the ${ROLE_NAME[move.piece as keyof typeof ROLE_NAME]} to ${move.to}`)
  }

  // What does the moved piece attack now? (forks first — the sharpest story)
  const [tf, tr] = [move.to.charCodeAt(0) - 97, 8 - Number(move.to[1])]
  const fork = findFork(gridAfter, tf, tr)
  if (fork) {
    bits.push(`it forks your ${fork.targets.map((t) => `${ROLE_NAME[t.role]} on ${t.square}`).join(' and ')}`)
  } else {
    const attacked = attackedSquares(gridAfter, tf, tr)
      .map(([f, r]) => ({ f, r, cell: gridAfter[r][f] }))
      .filter(({ cell }) => !!cell && cell.color === opponent && cell.role !== 'p' && cell.role !== 'k')
      .slice(0, 2)
      .map(({ f, r, cell }) => `${ROLE_NAME[cell!.role]} on ${squareName(f, r)}`)
    if (attacked.length) bits.push(`it attacks your ${attacked.join(' and ')}`)
  }

  const hanging = hangingPieces(gridAfter, opponent)
  if (hanging.length) {
    const worst = hanging[0]
    bits.push(`your ${ROLE_NAME[worst.role]} on ${worst.square} is now ${worst.reason}`)
  }

  const better = label === 'best' || label === 'excellent' || label === 'great' ? undefined : bestLine?.uci
  if (better) {
    const betterSan = new Chess(fenBefore).move({
      from: better.slice(0, 2),
      to: better.slice(2, 4),
      promotion: (better[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    }).san
    bits.push(
      label === 'blunder'
        ? `but it was a blunder — ${betterSan} was much stronger`
        : `though ${betterSan} was stronger`,
    )
  } else {
    bits.push('and it was their best option')
  }

  const who = mover === opponent ? 'They' : 'You'
  const phrase = `${who} ${bits[0][0].toLowerCase()}${bits[0].slice(1)}` +
    bits.slice(1).map((b) => ` — ${b[0].toLowerCase()}${b.slice(1)}`).join(', ') + '.'
  return { mover, san: move.san, label, phrase, better }
}

export interface CoachInput {
  /** History of the game so far (SAN). */
  history: string[]
  /** Which ply the coach should look at (usually the live position). */
  ply: number
  /** White-perspective cp at our previous turn, for the "your last move" warning. */
  prevOurTurnCpWhite: number | null
}

export async function analyseForCoach(engine: UciEngine, input: CoachInput): Promise<CoachReport> {
  const { history, ply } = input
  const current = positionAtPly(history, ply).fen
  const currentChess = new Chess(current)
  const turn: Color = currentChess.turn()

  engine.newGame()
  const cur = await engine.go({ fen: current, depth: COACH_DEPTH, multiPV: 2 })
  const best = cur.infos.find((x) => x.multipv === 1) ?? cur.infos[0]
  const cpStm = best ? best.scoreCp ?? (best.scoreMate !== null ? (best.scoreMate > 0 ? 10000 : -10000) : 0) : 0
  const cpWhite = turn === 'w' ? cpStm : -cpStm

  const grid = gridFromFen(current)
  const playerColor: Color = ply % 2 === 0 ? 'w' : 'b' // ply half-moves from start: even = White to move

  const threats: ThreatReport = {
    inCheck: currentChess.isCheck(),
    mateIn: best?.scoreMate !== null && best?.scoreMate !== undefined ? best.scoreMate : null,
    ourHanging: hangingPieces(grid, playerColor).map((h) => ({
      square: h.square, piece: ROLE_NAME[h.role], reason: h.reason,
    })),
    theirHanging: hangingPieces(grid, turn).map((h) => ({
      square: h.square, piece: ROLE_NAME[h.role], reason: h.reason,
    })),
    ourPins: pinnedPieces(grid, playerColor).map((p) => ({
      square: p.square, piece: ROLE_NAME[p.role], bySquare: p.bySquare, byPiece: ROLE_NAME[p.byRole],
    })),
    forksAgainstUs: [],
    kingPressure: {
      ours: kingZonePressure(grid, playerColor).attackers,
      theirs: kingZonePressure(grid, turn).attackers,
    },
  }

  // Best move for the side to move, phrased from the position's features.
  const bestUci = best?.pv[0] ?? null
  const bestMove = bestUci
    ? { ...describeMove(current, bestUci), uci: bestUci }
    : null

  // Story of the last played move.
  let lastMove: LastMoveStory | null = null
  if (ply >= 1) {
    const before = positionAtPly(history, ply - 1).fen
    const bef = await engine.go({ fen: before, depth: COACH_DEPTH, multiPV: 3 })
    const candidates = bef.infos
      .filter((x) => x.multipv >= 1)
      .map((x) => ({
        uci: x.pv[0],
        cp: x.scoreCp ?? (x.scoreMate !== null ? (x.scoreMate > 0 ? 10000 : -10000) : 0),
      }))
      .sort((a, b) => (b.cp ?? 0) - (a.cp ?? 0))
    const playedSan = history[ply - 1]
    lastMove = lastMoveStory(before, playedSan, current, candidates)
  }

  // Warning about our own previous move: cp at our last turn vs now.
  let ourLastWarning: CoachReport['ourLastWarning'] = null
  if (input.prevOurTurnCpWhite !== null && input.prevOurTurnCpWhite !== undefined) {
    const our: Color = playerColor
    const winPrev = our === 'w' ? winPercent(input.prevOurTurnCpWhite) : 100 - winPercent(input.prevOurTurnCpWhite)
    const winNow = our === 'w' ? winPercent(cpWhite) : 100 - winPercent(cpWhite)
    const loss = Math.max(0, winPrev - winNow)
    if (loss >= 5) {
      const label: MoveLabel = loss >= 20 ? 'blunder' : loss >= 10 ? 'mistake' : 'inaccuracy'
      const san = history[ply - 2] ?? ''
      ourLastWarning = {
        san,
        label,
        phrase:
          label === 'blunder'
            ? `Your ${san} was a blunder — it dropped your winning chances by ${loss.toFixed(0)}%.`
            : `Your ${san} cost you ${loss.toFixed(0)}% winning chances (${label}).`,
      }
    }
  }

  return {
    cpWhite,
    evalPhrase: evalPhrase(cpWhite),
    best: bestMove,
    continuation: best?.pv.slice(0, 6) ?? [],
    threats,
    lastMove,
    ourLastWarning,
  }
}
