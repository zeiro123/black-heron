import { Chess } from 'chess.js'
import { create } from 'zustand'
import { findStyle, ratingToDepth, ratingToSkill } from '../data/styles'
import { getComputerMove } from '../engine/opponent'
import type { Opening } from '../data/openings'
import { useSettingsStore } from './settingsStore'

export type GuidedMode = 'play' | 'walkthrough'

export interface GuidedShape {
  from: string
  to: string
}

interface GuidedState {
  opening: Opening | null
  mode: GuidedMode
  playerSide: 'w' | 'b'
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

  start: (opening: Opening, mode: GuidedMode, playerSide: 'w' | 'b') => void
  tryMove: (from: string, to: string, promotion?: string) => Promise<void>
  engineMove: () => Promise<void>
  requestHint: () => void
  resign: () => void
  clear: () => void
}

export const useGuidedStore = create<GuidedState>()((set, get) => ({
  opening: null,
  mode: 'play',
  playerSide: 'w',
  fen: '',
  history: [],
  lastMove: null,
  thinking: false,
  over: false,
  resultPhrase: null,
  suggestion: null,
  feedback: null,
  onLine: true,

  start: (opening, mode, playerSide) => {
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
    })
    void get().engineMove()
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
    try {
      // Opening book: follow the line while the game matches it.
      if (state.onLine) {
        const book = bookMoveFor(state.opening, state.history)
        if (book) {
          const fresh = new Chess(state.fen)
          const applied = fresh.move(book)
          set({
            fen: fresh.fen(),
            history: fresh.history(),
            lastMove: [applied.from, applied.to],
            thinking: false,
          })
          if (fresh.isGameOver()) finish(set, fresh, state.playerSide)
          return
        }
      }
      // Free play at the selected opponent's strength.
      const settings = useSettingsStore.getState()
      const style = findStyle(settings.botId)
      const uci = await getComputerMove(state.fen, {
        skill: ratingToSkill(style.rating),
        depth: ratingToDepth(style.rating),
        pick: style.pick,
      })
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
        thinking: false,
      })
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
