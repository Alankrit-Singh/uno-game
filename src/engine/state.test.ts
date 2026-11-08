import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import { canPlay, drawCards, newGame } from './state'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const act = (id: number, color: Color, kind: 'skip' | 'reverse' | 'draw2'): Card => ({ id, kind, color })
const wild = (id: number): Card => ({ id, kind: 'wild' })

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('canPlay', () => {
  it('same color true', () => {
    const card = num(1, 'red', 5)
    const top = num(2, 'red', 3)
    expect(canPlay(card, top, 'red')).toBe(true)
  })

  it('same number different color true', () => {
    const card = num(1, 'blue', 5)
    const top = num(2, 'red', 5)
    expect(canPlay(card, top, 'red')).toBe(true)
  })

  it('different color and number false', () => {
    const card = num(1, 'blue', 4)
    const top = num(2, 'red', 5)
    expect(canPlay(card, top, 'red')).toBe(false)
  })

  it('skip on skip of different color true', () => {
    const card = act(1, 'blue', 'skip')
    const top = act(2, 'red', 'skip')
    expect(canPlay(card, top, 'red')).toBe(true)
  })

  it('skip on draw2 different color false', () => {
    const card = act(1, 'blue', 'skip')
    const top = act(2, 'red', 'draw2')
    expect(canPlay(card, top, 'red')).toBe(false)
  })

  it('wild true', () => {
    const card = wild(1)
    const top = num(2, 'red', 5)
    expect(canPlay(card, top, 'red')).toBe(true)
  })

  it('currentColor overrides top color', () => {
    const card = num(1, 'blue', 3)
    const top = num(2, 'red', 5)
    expect(canPlay(card, top, 'blue')).toBe(true)
    expect(canPlay(card, top, 'red')).toBe(false)
  })
})

describe('drawCards', () => {
  it('takes from the end', () => {
    const drawPile = [num(1, 'red', 1), num(2, 'blue', 2)]
    const discardPile = [num(3, 'green', 3)]
    const { cards, drawPile: newDrawPile, discardPile: newDiscardPile } = drawCards(drawPile, discardPile, 1, seeded(1))
    expect(cards).toEqual([num(2, 'blue', 2)])
    expect(newDrawPile).toEqual([num(1, 'red', 1)])
    expect(newDiscardPile).toEqual([num(3, 'green', 3)])
  })

  it('does not mutate inputs', () => {
    const drawPile = [num(1, 'red', 1), num(2, 'blue', 2)]
    const discardPile = [num(3, 'green', 3)]
    drawCards(drawPile, discardPile, 1, seeded(1))
    expect(drawPile).toEqual([num(1, 'red', 1), num(2, 'blue', 2)])
    expect(discardPile).toEqual([num(3, 'green', 3)])
  })

  it('reshuffles when empty', () => {
    const drawPile: Card[] = []
    const discardPile = [num(1, 'red', 1), num(2, 'blue', 2), num(3, 'green', 3)]
    const { cards, drawPile: newDrawPile, discardPile: newDiscardPile } = drawCards(drawPile, discardPile, 2, seeded(1))
    expect(cards.length).toBe(2)
    expect(cards.every(card => card.id !== 3)).toBe(true)
    expect(cards.every(card => [1, 2].includes(card.id))).toBe(true)
    expect(newDiscardPile).toEqual([num(3, 'green', 3)])
    expect(newDrawPile.length).toBe(0)
  })

  it('returns fewer when nothing left', () => {
    const drawPile: Card[] = []
    const discardPile = [num(1, 'red', 1)]
    const { cards, drawPile: newDrawPile, discardPile: newDiscardPile } = drawCards(drawPile, discardPile, 3, seeded(1))
    expect(cards).toEqual([])
    expect(newDrawPile).toEqual([])
    expect(newDiscardPile).toEqual([num(1, 'red', 1)])
  })
})

describe('newGame', () => {
  it('7 cards per player for 2 and 4 players', () => {
    const game2 = newGame(2, seeded(1))
    const game4 = newGame(4, seeded(1))
    expect(game2.players[0].length).toBe(7)
    expect(game2.players[1].length).toBe(7)
    expect(game4.players[0].length).toBe(7)
    expect(game4.players[1].length).toBe(7)
    expect(game4.players[2].length).toBe(7)
    expect(game4.players[3].length).toBe(7)
  })

  it('total cards (hands + drawPile + discardPile) is 108 with unique ids', () => {
    const game = newGame(4, seeded(1))
    const allCards = game.players.flat().concat(game.drawPile, game.discardPile)
    expect(allCards.length).toBe(108)
    const uniqueIds = new Set(allCards.map(card => card.id))
    expect(uniqueIds.size).toBe(108)
  })

  it('discardPile has exactly 1 card and it is kind "number", and currentColor equals its color', () => {
    const game = newGame(4, seeded(1))
    const top = game.discardPile[0]
    expect(top.kind).toBe('number')
    if (top.kind === 'number') expect(game.currentColor).toBe(top.color)
  })

  it('current 0, direction 1, winner null', () => {
    const game = newGame(4, seeded(1))
    expect(game.current).toBe(0)
    expect(game.direction).toBe(1)
    expect(game.winner).toBe(null)
  })

  it('throws for 1 and 11 players', () => {
    expect(() => newGame(1, seeded(1))).toThrow()
    expect(() => newGame(11, seeded(1))).toThrow()
  })
})
