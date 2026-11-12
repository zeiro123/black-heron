import { Chess } from 'chess.js'
import { BOT_LEVELS, chooseMove, getBotLevel } from './levels'
import { UciEngine } from './uciEngine'

// Phase 2: Stockfish (WASM, single-threaded lite build) running in a Web Worker,
// behind the same `getComputerMove(fen)` interface the UI has always used.

export const ENGINE_WORKER_URL = '/engine/stockfish-19-lite-single.js'

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

export async function getComputerMove(fen: string, level = 4): Promise<string> {
  const started = Date.now()
  const bot = getBotLevel(level)
  let uci: string | null = null
  try {
    const uciEngine = await ensureEngine()
    const { infos, bestmove } = await uciEngine.go({
      fen,
      depth: bot.depth,
      multiPV: bot.multiPV,
    })
    uci = chooseMove(infos, bot.pickFrom) ?? bestmove
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

export const botLevelCount = BOT_LEVELS.length
