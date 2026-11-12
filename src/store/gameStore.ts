import { Chess } from 'chess.js'
import { create } from 'zustand'
import { cancelComputerMove, engineNewGame, getComputerMove } from '../engine/opponent'
import {
  START_FEN,
  applyMove,
  isPromotion,
  kingSquare,
  lastMoveOf,
  legalDests,
  other,
  statusOf,
} from '../game/chessGame'
import type { Color, DestsMap, GameStatus, PromotionPiece, Square } from '../game/types'
import { useSettingsStore } from './settingsStore'

export interface GameState {
  fen: string
  turn: Color
  /** The human's color; the computer always plays the other side. */
  playerColor: Color
  /** SAN of every half-move, in order. */
  history: string[]
  lastMove: [Square, Square] | null
  status: GameStatus
  dests: DestsMap
  checkSquare: Square | null
  thinking: boolean
  pendingPromotion: { from: Square; to: Square } | null
  /** Bumped on every New Game so stale computer replies are dropped. */
  gameId: number
  /** Half-move index the board is viewing (history.length = live position). */
  viewPly: number

  newGame: (playerColor: Color) => void
  tryPlayerMove: (from: Square, to: Square) => void
  choosePromotion: (piece: PromotionPiece) => void
  cancelPromotion: () => void
  undo: () => void
  resign: () => void
  /** Chess.com-style abort: end the game before both players have moved. */
  abort: () => void
  navigateTo: (ply: number) => void
}

// The chess.js instance holds the real rules; the store mirrors the values the UI needs.
let chess = new Chess()

function viewFromChess(): Pick<
  GameState,
  'fen' | 'turn' | 'history' | 'lastMove' | 'status' | 'dests' | 'checkSquare' | 'viewPly'
> {
  const status = statusOf(chess)
  const history = chess.history()
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    history,
    lastMove: lastMoveOf(chess),
    status,
    dests: legalDests(chess),
    checkSquare: status.check ? kingSquare(chess, chess.turn()) : null,
    viewPly: history.length,
  }
}

export const useGameStore = create<GameState>()((set, get) => {
  const computerTurn = async (): Promise<void> => {
    const current = get()
    if (
      current.status.over ||
      current.thinking ||
      current.pendingPromotion ||
      current.turn === current.playerColor
    ) {
      return
    }
    const gameId = current.gameId
    set({ thinking: true })
    try {
      const level = useSettingsStore.getState().botLevel
      const style = useSettingsStore.getState().playStyle
      const uci = await getComputerMove(current.fen, level, style)
      // A new game may have started while we were "thinking" — drop the stale move.
      if (get().gameId !== gameId || get().status.over) return
      const move = applyMove(chess, uci.slice(0, 2), uci.slice(2, 4), uci[4] as PromotionPiece | undefined)
      if (!move) throw new Error(`Computer produced an illegal move: ${uci}`)
      set(viewFromChess())
    } catch (error) {
      console.error('Computer move failed:', error)
    } finally {
      if (get().gameId === gameId) set({ thinking: false })
    }
  }

  return {
    fen: START_FEN,
    turn: 'w',
    playerColor: 'w',
    history: [],
    lastMove: null,
    status: statusOf(chess),
    dests: legalDests(chess),
    checkSquare: null,
    thinking: false,
    pendingPromotion: null,
    gameId: 0,
    viewPly: 0,

    newGame: (playerColor) => {
      cancelComputerMove()
      engineNewGame()
      chess = new Chess()
      set((s) => ({
        gameId: s.gameId + 1,
        thinking: false,
        pendingPromotion: null,
        playerColor,
        ...viewFromChess(),
      }))
      // If the player chose Black, the computer (White) opens.
      void computerTurn()
    },

    tryPlayerMove: (from, to) => {
      const s = get()
      if (
        s.status.over ||
        s.thinking ||
        s.pendingPromotion ||
        s.turn !== s.playerColor ||
        from === to
      ) {
        return
      }
      if (isPromotion(chess, from, to)) {
        if (useSettingsStore.getState().autoQueen) {
          const move = applyMove(chess, from, to, 'q')
          if (!move) return
          set(viewFromChess())
          void computerTurn()
          return
        }
        set({ pendingPromotion: { from, to } })
        return
      }
      const move = applyMove(chess, from, to)
      if (!move) return
      set(viewFromChess())
      void computerTurn()
    },

    choosePromotion: (piece) => {
      const pending = get().pendingPromotion
      if (!pending) return
      set({ pendingPromotion: null })
      const move = applyMove(chess, pending.from, pending.to, piece)
      if (!move) return
      set(viewFromChess())
      void computerTurn()
    },

    cancelPromotion: () => set({ pendingPromotion: null }),

    undo: () => {
      const s = get()
      if (
        s.thinking ||
        s.pendingPromotion ||
        s.status.reason === 'resigned' ||
        chess.history().length === 0
      ) {
        return
      }
      // Take back plies until we have removed one of the player's own moves
      // (this removes the computer's reply with it, and revives a game lost by mate).
      while (chess.history().length > 0) {
        const mover = other(chess.turn())
        chess.undo()
        if (mover === s.playerColor) break
      }
      set(viewFromChess())
      const now = get()
      if (!now.status.over && now.turn !== now.playerColor) void computerTurn()
    },

    resign: () => {
      const s = get()
      if (s.status.over || s.thinking || s.pendingPromotion) return
      set({ status: { over: true, reason: 'resigned', winner: other(s.playerColor), check: false } })
    },

    abort: () => {
      const s = get()
      if (s.status.over || s.history.length >= 2) return
      cancelComputerMove()
      set((st) => ({
        gameId: st.gameId + 1,
        thinking: false,
        pendingPromotion: null,
        status: { over: true, reason: 'aborted', winner: null, check: false },
      }))
    },

    navigateTo: (ply) => {
      const s = get()
      set({ viewPly: Math.min(s.history.length, Math.max(0, Math.round(ply))) })
    },
  }
})
