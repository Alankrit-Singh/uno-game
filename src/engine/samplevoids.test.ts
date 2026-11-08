import { describe, it, expect } from 'vitest'
import type { Color } from './types'
import { newGame } from './state'
import { determinize } from './sample'

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

describe('determinize with voids', () => {
  const state = newGame(3, seeded(5))
  const voids = [new Set<Color>(), new Set<Color>(['red']), new Set<Color>()]

  it('with voids, player 1\'s hand has no card whose \'color\' in card is true and color === \'red\'', () => {
    for (let i = 1; i <= 20; i++) {
      const s = newGame(3, seeded(i))
      const detState = determinize(s, seeded(i), voids)
      const player1Hand = detState.players[1]
      expect(player1Hand.every(card => !('color' in card) || card.color !== 'red')).toBe(true)
    }
  })

  it('hand sizes are unchanged and all 108 card ids across hands + drawPile + discardPile are unique', () => {
    const detState = determinize(state, seeded(5), voids)
    const allCards = detState.players.flat().concat(detState.drawPile, detState.discardPile)
    const cardIds = allCards.map(card => card.id)
    expect(new Set(cardIds).size).toBe(108)
    expect(detState.players[0].length).toBe(7)
    expect(detState.players[1].length).toBe(7)
    expect(detState.players[2].length).toBe(7)
  })

  it('calling determinize(state, seeded(3)) with no voids still works and keeps hand sizes', () => {
    const detState = determinize(state, seeded(3))
    expect(detState.players[0].length).toBe(7)
    expect(detState.players[1].length).toBe(7)
    expect(detState.players[2].length).toBe(7)
  })
})
