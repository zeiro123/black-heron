import { Chess } from 'chess.js'
import { create } from 'zustand'
import { findStyle, ratingToDepth, ratingToSkill } from '../data/styles'
import { getComputerMove, getEngine } from '../engine/opponent'
import type { Opening } from '../data/openings'
import { useSettingsStore } from './settingsStore'

export type GuidedMode = 'play' | 'walkthrough'

export interface TimeControl {
  label: string
  ms: number // 0 = untimed
}

/** Timing: rapid or blitz, across many base times — every timed game starts with one. */
export const TIME_CONTROLS: TimeControl[] = [
  { label: 'Untimed', ms: 0 },
  { label: 'Rapid · 15 min', ms: 15 * 60000 },
  { label: 'Rapid · 10 min', ms: 10 * 60000 },
  { label: 'Rapid · 5 min', ms: 5 * 60000 },
  { label: 'Blitz · 5 min', ms: 5 * 60000 + 1 },
  { label: 'Blitz · 3 min', ms: 3 * 60000 + 1 },
  { label: 'Blitz · 2 min', ms: 2 * 60000 + 1 },
  { label: 'Blitz · 1 min', ms: 60000 + 1 },
]

export interface GuidedShape {
  from: string
  to: string
}

interface GuidedState {
  opening: Opening | null
  mode: GuidedMode
  playerSide: 'w' | 'b'
  timeControl: TimeControl | null
  fen: string
  history: string[]
  lastMove: [string, string] | null
  thinking: boolean
  over: boolean
  resultPhrase: string | null
  /** Walkthrough: the suggested SAN for the player's next move. */
  suggestion: string | null
  feedback: string | null
  /** True while the played game still matches the opening's book line. */
  onLine: boolean
  /** White-perspective evaluation of the current guided position (for the eval bar). */
  cpWhite: number | null
  /** Remaining clock per side in ms — null when untimed. */
  remaining: { w: number; b: number } | null

  start: (
    opening: Opening,
    mode: GuidedMode,
    playerSide: 'w' | 'b',
    timeControl: TimeControl,
  ) => void
  tryMove: (from: string, to: string, promotion?: string) => Promise<void>
  engineMove: () => Promise<void>
  updateEval: (fen: string) => Promise<void>
  tick: () => void
  requestHint: () => void
  resign: () => void
  clear: () => void
}

export const useGuidedStore = create<GuidedState>()((set, get) => ({
  opening: null,
  mode: 'play',
  playerSide: 'w',
  timeControl: null,
  fen: '',
  history: [],
  lastMove: null,
  thinking: false,
  over: false,
  resultPhrase: null,
  suggestion: null,
  feedback: null,
  onLine: true,
  cpWhite: null,
  remaining: null,

  start: (opening, mode, playerSide, timeControl) => {
    const line = opening.moves.split(' ').filter(Boolean)
    const chess = new Chess()
    let lastMove: [string, string] | null = null
    // When the player is Black, the engine (White) plays the book's first move.
    if (playerSide === 'b' && line.length > 0) {
      const first = chess.move(line[0])
      lastMove = [first.from, first.to]
    }
    set({
      opening,
      mode,
      playerSide,
      timeControl,
      fen: chess.fen(),
      history: chess.history(),
      lastMove,
      thinking: false,
      over: false,
      resultPhrase: null,
      suggestion: null,
      feedback:
        mode === 'walkthrough'
          ? `Guided game — play the ${playerSide === 'w' ? 'White' : 'Black'} side of the ${opening.name}. Ask for a hint any time.`
          : `Game started — the computer follows the ${opening.name} book.`,
      onLine: true,
      remaining:
        timeControl.ms > 0 ? { w: timeControl.ms, b: timeControl.ms } : null,
    })
    void get().engineMove()
  },

  updateEval: async (fen: string) => {
    try {
      const engine = await getEngine()
      const { infos } = await engine.go({ fen, depth: 8, multiPV: 1 })
      const best = infos.find((x) => x.multipv === 1) ?? infos[0]
      if (!best) return
      const turn = new Chess(fen).turn()
      const cpStm =
        best.scoreCp ?? (best.scoreMate !== null ? (best.scoreMate > 0 ? 10000 : -10000) : 0)
      set({ cpWhite: turn === 'w' ? cpStm : -cpStm })
    } catch {
      // The eval bar simply stays where it is.
    }
  },

  tick: () => {
    const state = get()
    if (!state.remaining || state.over || !state.opening) return
    const active = new Chess(state.fen).turn()
    const left = state.remaining[active] - 100
    if (left <= 0) {
      set({
        remaining: { ...state.remaining, [active]: 0 },
        over: true,
        resultPhrase:
          active === state.playerSide
            ? 'You ran out of time — the computer wins.'
            : 'The computer ran out of time — you win!',
      })
      return
    }
    set({ remaining: { ...state.remaining, [active]: left } })
  },

  tryMove: async (from, to, promotion) => {
    const state = get()
    if (!state.opening || state.over || state.thinking) return
    const chess = new Chess(state.fen)
    let move
    try {
      move = chess.move({ from, to, promotion: promotion ?? undefined })
    } catch {
      return // not a legal move — the board ignores it
    }

    const playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
    let feedback: string | null = null
    let onLine = state.onLine

    if (state.mode === 'walkthrough' && state.onLine) {
      const expected = bookMoveFor(state.opening, state.history)
      const expectedUci = expected ? sanToUci(expected, state.fen) : null
      if (expectedUci && playedUci === expectedUci) {
        feedback = 'Correct — that is the main move.'
      } else if (expected) {
        feedback = `That leaves the main line — the book move here is ${expected}. Carrying on freely.`
        onLine = false
      }
    }

    set({
      fen: chess.fen(),
      history: chess.history(),
      lastMove: [move.from, move.to],
      feedback,
      onLine,
      suggestion: null,
    })
    void get().updateEval(chess.fen())

    if (chess.isGameOver()) {
      finish(set, chess, state.playerSide)
      return
    }
    if (chess.turn() !== state.playerSide) {
      await get().engineMove()
    }
  },

  engineMove: async () => {
    const state = get()
    if (!state.opening || state.over || state.thinking) return
    const chess = new Chess(state.fen)
    if (chess.turn() === state.playerSide) return

    set({ thinking: true })
    const startedAt = Date.now()
    const engineColor: 'w' | 'b' = chess.turn()
    const baseLeft = state.remaining ? state.remaining[engineColor] : null
    try {
      // Humans do not reply instantly: a random think time scaled by the rating,
      // clamped to what is left on the clock.
      const style = findStyle(useSettingsStore.getState().botId)
      const band = humanThinkMs(style.rating)
      let delay = band.min + Math.random() * (band.max - band.min)
      if (baseLeft !== null) {
        delay = Math.max(150, Math.min(delay, baseLeft - 400))
      }
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)))

      const timeoutNow = () => {
        const elapsedTotal = Date.now() - startedAt
        const left = baseLeft !== null ? baseLeft - elapsedTotal : null
        if (left !== null && left <= 0) {
          set({
            remaining: state.remaining
              ? { ...state.remaining, [engineColor]: 0 }
              : null,
            over: true,
            resultPhrase:
              engineColor === state.playerSide
                ? 'You ran out of time — the computer wins.'
                : 'The computer ran out of time — you win!',
          })
          return true
        }
        return false
      }

      // Opening book: follow the line while the game matches it.
      if (state.onLine) {
        const book = bookMoveFor(state.opening, state.history)
        if (book) {
          if (timeoutNow()) return
          const elapsedTotal = Date.now() - startedAt
          const fresh = new Chess(state.fen)
          const applied = fresh.move(book)
          set({
            fen: fresh.fen(),
            history: fresh.history(),
            lastMove: [applied.from, applied.to],
            remaining: state.remaining
              ? { ...state.remaining, [engineColor]: (baseLeft ?? 0) - elapsedTotal }
              : null,
            thinking: false,
          })
          void get().updateEval(fresh.fen())
          if (fresh.isGameOver()) finish(set, fresh, state.playerSide)
          return
        }
      }
      // Free play at the selected opponent's strength.
      const uci = await getComputerMove(state.fen, {
        skill: ratingToSkill(style.rating),
        depth: ratingToDepth(style.rating),
        pick: style.pick,
      })
      const elapsedTotal = Date.now() - startedAt
      const left = baseLeft !== null ? baseLeft - elapsedTotal : null
      if (left !== null && left <= 0) {
        set({
          remaining: state.remaining ? { ...state.remaining, [engineColor]: 0 } : null,
          over: true,
          resultPhrase:
            engineColor === state.playerSide
              ? 'You ran out of time — the computer wins.'
              : 'The computer ran out of time — you win!',
        })
        return
      }
      const fresh = new Chess(state.fen)
      const applied = fresh.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? undefined,
      })
      set({
        fen: fresh.fen(),
        history: fresh.history(),
        lastMove: [applied.from, applied.to],
        remaining: state.remaining
          ? { ...state.remaining, [engineColor]: left ?? 0 }
          : null,
        thinking: false,
      })
      void get().updateEval(fresh.fen())
      if (fresh.isGameOver()) finish(set, fresh, state.playerSide)
    } catch (error) {
      console.error('Guided engine move failed:', error)
      set({ thinking: false })
    }
  },

  requestHint: () => {
    const state = get()
    if (!state.opening || state.over) return
    if (state.onLine) {
      const book = bookMoveFor(state.opening, state.history)
      if (book) {
        set({ suggestion: book })
        return
      }
    }
    set({ suggestion: null, feedback: 'The book is exhausted — play the position on your own.' })
  },

  resign: () => {
    if (!get().over) {
      set({ over: true, resultPhrase: 'You resigned — start another game from the Games tab.' })
    }
  },

  clear: () =>
    set({
      opening: null,
      fen: '',
      history: [],
      lastMove: null,
      over: false,
      resultPhrase: null,
      suggestion: null,
      feedback: null,
      onLine: true,
    }),
}))

/** The book move for the current ply (the line starts with White's first move). */
function bookMoveFor(opening: Opening, history: string[]): string | null {
  const line = opening.moves.split(' ').filter(Boolean)
  const played = history.length
  if (played >= line.length) return null
  return line[played]
}

function sanToUci(san: string, fen: string): string {
  try {
    const chess = new Chess(fen)
    const move = chess.move(san)
    return `${move.from}${move.to}${move.promotion ?? ''}`
  } catch {
    return ''
  }
}

/** How long a human of this rating thinks before replying. */
function humanThinkMs(rating: number): { min: number; max: number } {
  if (rating < 800) return { min: 300, max: 1800 }
  if (rating < 1200) return { min: 400, max: 2500 }
  if (rating < 1600) return { min: 500, max: 3200 }
  if (rating < 2200) return { min: 700, max: 4000 }
  return { min: 900, max: 4500 }
}

function finish(
  set: (partial: Partial<GuidedState>) => void,
  chess: Chess,
  playerSide: 'w' | 'b',
): void {
  let phrase: string
  if (chess.isCheckmate()) {
    phrase = chess.turn() === playerSide ? 'Checkmate — the computer wins.' : 'Checkmate — you win!'
  } else if (chess.isStalemate()) {
    phrase = 'Draw — stalemate.'
  } else if (chess.isDraw()) {
    phrase = 'Draw.'
  } else {
    phrase = 'Game over.'
  }
  set({ over: true, resultPhrase: phrase })
}

// Debug hook (dev only)
if (typeof window !== 'undefined') {
  ;(window as unknown as { __guided?: typeof useGuidedStore }).__guided = useGuidedStore
}
