import { describe, it, expect } from 'vitest'
import { createDeck, shuffle, COLORS } from './deck'

describe('Deck', () => {
  it('createDeck has 108 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(108)
  })

  it('all ids are unique', () => {
    const deck = createDeck()
    const ids = new Set(deck.map(card => card.id))
    expect(ids.size).toBe(108)
  })

  it('per color: 25 cards (one 0, two of each 1-9, two skip, two reverse, two draw2)', () => {
    const deck = createDeck()
    COLORS.forEach(color => {
      const colorCards = deck.filter(card => ('color' in card && card.color === color))
      expect(colorCards.length).toBe(25)
      const number0 = colorCards.filter(card => card.kind === 'number' && card.value === 0)
      expect(number0.length).toBe(1)
    })
  })

  it('exactly 4 wild and 4 wild4', () => {
    const deck = createDeck()
    const wilds = deck.filter(card => card.kind === 'wild')
    const wild4s = deck.filter(card => card.kind === 'wild4')
    expect(wilds.length).toBe(4)
    expect(wild4s.length).toBe(4)
  })

  it('shuffle returns same card ids (sorted) as the input, and does not mutate the input array', () => {
    const deck = createDeck()
    const originalIds = deck.map(card => card.id)
    const shuffledDeck = shuffle(deck, Math.random)
    const shuffledIds = shuffledDeck.map(card => card.id)
    expect([...shuffledIds].sort((a, b) => a - b)).toEqual([...originalIds].sort((a, b) => a - b))
    expect(deck).toEqual(createDeck())
  })

  it('shuffle with a deterministic rng gives the same order twice', () => {
    const deck = createDeck()
    const seeded = (seed: number) => () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const firstShuffle = shuffle(deck, seeded(1))
    const secondShuffle = shuffle(deck, seeded(1))
    expect(firstShuffle).toEqual(secondShuffle)
  })
})
