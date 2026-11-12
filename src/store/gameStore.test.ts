import { describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'

async function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('waitFor timed out')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

describe('gameStore', () => {
  it('starts a new game as White with the player to move', () => {
    useGameStore.getState().newGame('w')
    const s = useGameStore.getState()
    expect(s.playerColor).toBe('w')
    expect(s.turn).toBe('w')
    expect(s.history).toEqual([])
    expect(s.status.over).toBe(false)
    expect(s.dests.get('e2')).toContain('e4')
    expect(s.thinking).toBe(false)
  })

  it('as Black lets the computer open', async () => {
    useGameStore.getState().newGame('b')
    await waitFor(() => !useGameStore.getState().thinking)
    const s = useGameStore.getState()
    expect(s.playerColor).toBe('b')
    expect(s.history.length).toBe(1)
    expect(s.turn).toBe('b')
    expect(s.dests.size).toBeGreaterThan(0)
  })

  it('applies a player move and the computer replies', async () => {
    useGameStore.getState().newGame('w')
    useGameStore.getState().tryPlayerMove('e2', 'e4')
    await waitFor(() => !useGameStore.getState().thinking)
    const s = useGameStore.getState()
    expect(s.history[0]).toBe('e4')
    expect(s.history.length).toBe(2)
    expect(s.turn).toBe('w')
    expect(s.lastMove).not.toBeNull()
  })

  it('undo takes back the player move and the computer reply', async () => {
    const store = useGameStore
    store.getState().newGame('w')
    store.getState().tryPlayerMove('d2', 'd4')
    await waitFor(() => !store.getState().thinking)
    expect(store.getState().history.length).toBe(2)
    store.getState().undo()
    const s = store.getState()
    expect(s.history.length).toBe(0)
    expect(s.turn).toBe('w')
    expect(s.status.over).toBe(false)
  })

  it('rejects illegal moves and moves of computer pieces', () => {
    useGameStore.getState().newGame('w')
    useGameStore.getState().tryPlayerMove('e7', 'e5') // black pawn — not the player's
    useGameStore.getState().tryPlayerMove('e2', 'e5') // illegal
    expect(useGameStore.getState().history.length).toBe(0)
  })

  it('resign ends the game and the computer wins', () => {
    useGameStore.getState().newGame('w')
    useGameStore.getState().resign()
    const s = useGameStore.getState()
    expect(s.status.over).toBe(true)
    expect(s.status.reason).toBe('resigned')
    expect(s.status.winner).toBe('b')
  })

  it('new game while the computer is thinking drops the stale reply', async () => {
    const store = useGameStore
    store.getState().newGame('b')
    store.getState().newGame('w') // restart immediately
    await waitFor(() => !store.getState().thinking)
    const s = store.getState()
    expect(s.playerColor).toBe('w')
    expect(s.history.length).toBe(0)
    expect(s.turn).toBe('w')
  })
})
