import { describe, it, expect } from 'vitest'
import { emptyVoids, updateVoids } from './voids'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import type { Move } from './legal'

describe('voids', () => {
  it('emptyVoids(3) has 3 empty sets', () => {
    const voids = emptyVoids(3)
    expect(voids).toHaveLength(3)
    expect(voids[0]).toBeInstanceOf(Set)
    expect(voids[0].size).toBe(0)
    expect(voids[1].size).toBe(0)
    expect(voids[2].size).toBe(0)
  })

  it('a draw by player 0 adds \'green\' to voids[0] only', () => {
    const gameState: GameState = {
      players: [
        [{ id: 1, kind: 'number', color: 'red', value: 3 }, { id: 2, kind: 'wild' }],
        [{ id: 3, kind: 'number', color: 'blue', value: 4 }]
      ],
      current: 0,
      currentColor: 'green',
      direction: 1,
      drawPile: [],
      discardPile: [{ id: 4, kind: 'number', color: 'green', value: 1 }],
      winner: null, pendingDraw: 0, rules: CLASSIC_RULES
    }

    const move: Move = { type: 'draw' }
    const newVoids = updateVoids(emptyVoids(2), gameState, move)

    expect(newVoids[0].has('green')).toBe(true)
    expect(newVoids[1].has('green')).toBe(false)
  })

  it('playing card 1 (red) removes \'red\' from voids[0] when it was there', () => {
    const gameState: GameState = {
      players: [
        [{ id: 1, kind: 'number', color: 'red', value: 3 }, { id: 2, kind: 'wild' }],
        [{ id: 3, kind: 'number', color: 'blue', value: 4 }]
      ],
      current: 0,
      currentColor: 'green',
      direction: 1,
      drawPile: [],
      discardPile: [{ id: 4, kind: 'number', color: 'green', value: 1 }],
      winner: null, pendingDraw: 0, rules: CLASSIC_RULES
    }

    const move: Move = { type: 'play', cardId: 1 }
    const initialVoids = emptyVoids(2)
    initialVoids[0].add('red')
    const newVoids = updateVoids(initialVoids, gameState, move)

    expect(newVoids[0].has('red')).toBe(false)
  })

  it('playing the wild card 2 changes nothing', () => {
    const gameState: GameState = {
      players: [
        [{ id: 1, kind: 'number', color: 'red', value: 3 }, { id: 2, kind: 'wild' }],
        [{ id: 3, kind: 'number', color: 'blue', value: 4 }]
      ],
      current: 0,
      currentColor: 'green',
      direction: 1,
      drawPile: [],
      discardPile: [{ id: 4, kind: 'number', color: 'green', value: 1 }],
      winner: null, pendingDraw: 0, rules: CLASSIC_RULES
    }

    const move: Move = { type: 'play', cardId: 2 }
    const initialVoids = emptyVoids(2)
    initialVoids[0].add('red')
    const newVoids = updateVoids(initialVoids, gameState, move)

    expect(newVoids[0].has('red')).toBe(true)
  })

  it('the input voids array and its sets are not mutated', () => {
    const gameState: GameState = {
      players: [
        [{ id: 1, kind: 'number', color: 'red', value: 3 }, { id: 2, kind: 'wild' }],
        [{ id: 3, kind: 'number', color: 'blue', value: 4 }]
      ],
      current: 0,
      currentColor: 'green',
      direction: 1,
      drawPile: [],
      discardPile: [{ id: 4, kind: 'number', color: 'green', value: 1 }],
      winner: null, pendingDraw: 0, rules: CLASSIC_RULES
    }

    const move: Move = { type: 'draw' }
    const initialVoids = emptyVoids(2)
    const newVoids = updateVoids(initialVoids, gameState, move)

    expect(initialVoids[0].size).toBe(0)
    expect(newVoids[0].has('green')).toBe(true)
  })
})
