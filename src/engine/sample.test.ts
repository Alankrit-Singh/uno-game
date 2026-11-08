import { describe, it, expect } from 'vitest'
import { newGame } from './state'
import { determinize } from './sample'
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

describe('determinize', () => {
  const state = newGame(4, seeded(1))
  const originalState = JSON.stringify(state)
  const rng = seeded(1)
  const newState = determinize(state, rng)

  it('every player keeps the same hand size, and the hand of state.current is identical', () => {
    expect(newState.players[state.current]).toEqual(state.players[state.current])
    expect(newState.players.every((hand, i) => hand.length === state.players[i].length)).toBe(true)
  })

  it('all card ids across all hands + drawPile + discardPile are 108 unique ids', () => {
    const allCards = newState.players.flat().concat(newState.drawPile, newState.discardPile)
    const uniqueIds = new Set(allCards.map(card => card.id))
    expect(uniqueIds.size).toBe(108)
  })

  it('discardPile, current, direction, currentColor and winner are unchanged', () => {
    expect(newState.discardPile).toEqual(state.discardPile)
    expect(newState.current).toBe(state.current)
    expect(newState.direction).toBe(state.direction)
    expect(newState.currentColor).toBe(state.currentColor)
    expect(newState.winner).toBe(state.winner)
  })

  it('the input state is not mutated', () => {
    expect(JSON.stringify(state)).toBe(originalState)
  })

  it('with seeded(2) vs seeded(3) at least one opponent hand differs', () => {
    const newState2 = determinize(state, seeded(2))
    const newState3 = determinize(state, seeded(3))
    expect(JSON.stringify(newState2.players[1])).not.toBe(JSON.stringify(newState3.players[1]))
  })
})
