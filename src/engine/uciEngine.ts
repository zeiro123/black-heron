export interface EngineInfo {
  depth: number
  multipv: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}

export interface GoResult {
  infos: EngineInfo[]
  bestmove: string | null
}

type LineSub = (line: string) => void

/**
 * Thin UCI wrapper around a Stockfish Web Worker (emscripten build).
 * The engine itself runs inside the worker; this class only relays UCI commands
 * and parses the replies, so the UI thread stays responsive.
 */
export class UciEngine {
  private worker: Worker | null = null
  private subs = new Set<LineSub>()
  private booted = false

  get isReady(): boolean {
    return this.booted
  }

  async load(workerUrl: string, timeoutMs = 30000): Promise<void> {
    if (this.booted) return
    const worker = new Worker(workerUrl)
    this.worker = worker
    worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data : String(event.data ?? '')
      for (const sub of this.subs) sub(line)
    }
    worker.onerror = (event: Event) => {
      const message = (event as ErrorEvent).message ?? 'worker error'
      for (const sub of this.subs) sub(`__workererror__ ${message}`)
    }
    await this.waitForLine((line) => line === 'uciok', () => this.send('uci'), timeoutMs)
    this.send('setoption name Threads value 1')
    await this.waitForLine(
      (line) => line === 'readyok',
      () => {
        this.send('setoption name Hash value 16')
        this.send('isready')
      },
      timeoutMs,
    )
    this.booted = true
  }

  send(command: string): void {
    this.worker?.postMessage(command)
  }

  stop(): void {
    this.send('stop')
  }

  newGame(): void {
    this.send('ucinewgame')
  }

  async go(
    options: { fen: string; moves?: string[]; depth?: number; movetime?: number; multiPV?: number },
    timeoutMs = 60000,
  ): Promise<GoResult> {
    // Serialise searches: game review and the bot share this engine, and UCI
    // engines can only run one `go` at a time.
    const run = async (): Promise<GoResult> => {
      const infos: EngineInfo[] = []
      let bestmove: string | null = null
      const sub: LineSub = (line) => {
        if (line.startsWith('info ') && line.includes(' pv ')) {
          const info = parseInfo(line)
          if (info) infos.push(info)
        } else if (line.startsWith('bestmove')) {
          bestmove = line.split(/\s+/)[1] ?? null
        }
      }
      this.subs.add(sub)
      try {
        this.send(`setoption name MultiPV value ${options.multiPV ?? 1}`)
        const moves = options.moves?.length ? ` moves ${options.moves.join(' ')}` : ''
        this.send(`position fen ${options.fen}${moves}`)
        this.send(options.movetime ? `go movetime ${options.movetime}` : `go depth ${options.depth ?? 8}`)
        await this.waitForLine((line) => line.startsWith('bestmove'), () => {}, timeoutMs)
      } finally {
        this.subs.delete(sub)
      }
      return { infos, bestmove }
    }
    const result = this.chain.then(run, run)
    this.chain = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  private chain: Promise<unknown> = Promise.resolve()

  private waitForLine(match: (line: string) => boolean, kick: () => void, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const sub: LineSub = (line) => {
        if (match(line)) {
          this.subs.delete(sub)
          clearTimeout(timer)
          resolve(line)
        }
      }
      const timer = setTimeout(() => {
        this.subs.delete(sub)
        reject(new Error('UCI engine timeout'))
      }, timeoutMs)
      this.subs.add(sub)
      kick()
    })
  }
}

export function parseInfo(line: string): EngineInfo | null {
  const depth = / depth (\d+)/.exec(line)?.[1]
  const pv = / pv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line)?.[1]
  if (!depth || !pv) return null
  const cp = / score cp (-?\d+)/.exec(line)?.[1]
  const mate = / score mate (-?\d+)/.exec(line)?.[1]
  const multipv = / multipv (\d+)/.exec(line)?.[1]
  return {
    depth: Number(depth),
    multipv: multipv ? Number(multipv) : 1,
    scoreCp: cp !== undefined ? Number(cp) : null,
    scoreMate: mate !== undefined ? Number(mate) : null,
    pv: [pv],
  }
}
