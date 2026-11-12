import { Chess } from 'chess.js'
import { UciEngine, type EngineInfo } from './uciEngine'

// Phase 5: playing styles. The engine reports several candidate lines (MultiPV) and the
// style rule picks among them — Tal hunts attacks, Fischer plays the top move, Karpov
// stays solid and quiet. The level still controls strength (Skill Level + depth).

export const ENGINE_WORKER_URL = '/engine/stockfish-19-lite-single.js'

export type PlayStyle = 'aggressive' | 'principled' | 'solid' | 'balanced'

export interface Candidate {
  uci: string
  /** Engine score in centipawns, side-to-move perspective. */
  cp: number | null
  isCapture?: boolean
  isCheck?: boolean
  isSacrifice?: boolean
}

const MIN_THINK_MS = 250

let engine: UciEngine | null = null
let loadPromise: Promise<UciEngine> | null = null

async function ensureEngine(): Promise<UciEngine> {
  if (engine) return engine
  if (!loadPromise) {
    const candidate = new UciEngine()
    loadPromise = candidate
      .load(ENGINE_WORKER_URL)
      .then(() => {
        engine = candidate
        return candidate
      })
      .catch((error) => {
        engine = null
        loadPromise = null
        throw error
      })
  }
  return loadPromise
}

/** Shared engine handle for features like game review. */
export function getEngine(): Promise<UciEngine> {
  return ensureEngine()
}

/** Random legal fallback so the game never stalls if the engine fails to boot. */
export function randomLegalMoveUci(fen: string): string {
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) {
    throw new Error(`No legal moves in position: ${fen}`)
  }
  const move = moves[Math.floor(Math.random() * moves.length)]
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

/** What kind of move is this candidate — capture, check, sacrifice? */
export function classifyCandidate(fen: string, uci: string): Pick<Candidate, 'isCapture' | 'isCheck' | 'isSacrifice'> {
  try {
    const chess = new Chess(fen)
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
    })
    const isCapture = !!move.captured
    const isCheck = move.san.includes('+') || move.san.includes('#')
    return {
      isCapture,
      isCheck,
      isSacrifice: isCapture && pieceValue(move.piece) > pieceValue(move.captured) + 2,
    }
  } catch {
    return { isCapture: false, isCheck: false, isSacrifice: false }
  }
}

function pieceValue(role: string | null | undefined): number {
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  return role ? values[role] ?? 0 : 0
}

/** Best move per MultiPV line, classified for the style rules. */
export function buildCandidates(fen: string, infos: EngineInfo[]): Candidate[] {
  const bestPerLine = new Map<number, EngineInfo>()
  for (const info of infos) {
    const current = bestPerLine.get(info.multipv)
    if (!current || info.depth >= current.depth) bestPerLine.set(info.multipv, info)
  }
  return [...bestPerLine.values()]
    .sort((a, b) => a.multipv - b.multipv)
    .map((line) => {
      const uci = line.pv[0]
      return { uci, cp: line.scoreCp, ...classifyCandidate(fen, uci) }
    })
}

/** Pick a move the way the chosen player would. */
export function styledPick(candidates: Candidate[], style: PlayStyle): string | null {
  if (candidates.length === 0) return null
  const best = candidates[0]
  const within = (candidate: Candidate, maxLossCp: number): boolean =>
    best.cp === null || candidate.cp === null || best.cp - candidate.cp <= maxLossCp

  if (style === 'aggressive') {
    // Accept up to ~0.6 pawns of eval for checks, captures and sacrifices.
    const pool = candidates.filter((c) => within(c, 60)).slice(0, 4)
    const scored = pool
      .map((c) => ({
        c,
        score: (c.cp ?? 0) + (c.isCapture ? 25 : 0) + (c.isCheck ? 20 : 0) + (c.isSacrifice ? 35 : 0),
      }))
      .sort((a, b) => b.score - a.score)
    return scored[0]?.c.uci ?? best.uci
  }

  if (style === 'solid') {
    // Stay within ~0.15 pawns of the best move and prefer quiet, principled play.
    const pool = candidates.filter((c) => within(c, 15)).slice(0, 4)
    const scored = pool
      .map((c) => ({
        c,
        score: (c.cp ?? 0) - (c.isCapture ? 15 : 0) - (c.isCheck ? 10 : 0),
      }))
      .sort((a, b) => b.score - a.score)
    return scored[0]?.c.uci ?? best.uci
  }

  // Balanced — a random pick among the top three lines.
  const pool = candidates.slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)]?.uci ?? best.uci
}

export interface BotParams {
  /** UCI Skill Level 0–20 — what actually weakens the bot's move choice. */
  skill: number
  /** Search depth cap. */
  depth: number
  /** Move-selection rule. */
  pick: PlayStyle
}

export async function getComputerMove(fen: string, params: BotParams): Promise<string> {
  const started = Date.now()
  let uci: string | null = null
  try {
    const uciEngine = await ensureEngine()
    const { infos, bestmove } = await uciEngine.go({
      fen,
      depth: params.depth,
      multiPV: 4,
      skill: params.skill,
    })
    const candidates = buildCandidates(fen, infos)
    switch (params.pick) {
      case 'principled':
        uci = candidates[0]?.uci ?? bestmove
        break
      case 'aggressive':
        uci = styledPick(candidates, 'aggressive') ?? bestmove
        break
      case 'solid':
        uci = styledPick(candidates, 'solid') ?? bestmove
        break
      default:
        uci = styledPick(candidates, 'balanced') ?? bestmove
    }
  } catch (error) {
    console.error('Stockfish unavailable — falling back to a random legal move.', error)
  }
  if (!uci) uci = randomLegalMoveUci(fen)
  const elapsed = Date.now() - started
  if (elapsed < MIN_THINK_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_THINK_MS - elapsed))
  }
  return uci
}

/** Interrupt a running search (Abort / New Game). The pending go() resolves early. */
export function cancelComputerMove(): void {
  engine?.stop()
}

export function engineNewGame(): void {
  engine?.newGame()
}
