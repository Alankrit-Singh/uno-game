import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState, Rules } from './state'
import { CLASSIC_RULES } from './state'
import { playCard, drawCard } from './moves'
import { legalMoves } from './legal'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const draw2 = (id: number, color: Color): Card => ({ id, kind: 'draw2', color })
const rng = () => 0.5
const top = num(50, 'red', 5)
const hand = (start: number): Card[] => [num(start, 'blue', 8), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]
const mk = (players: Card[][], rules: Partial<Rules>, over: Partial<GameState> = {}): GameState => ({
  players,
  drawPile: Array.from({ length: 10 }, (_, i) => num(100 + i, 'green', 9)),
  discardPile: [top],
  current: 0,
  direction: 1,
  currentColor: 'red',
  winner: null,
  pendingDraw: 0,
  rules: { ...CLASSIC_RULES, ...rules },
  ...over,
})

// player 1 faces a +2 and holds a +2, a red 1 and a blue 2
const facing = (rules: Partial<Rules>) =>
  mk([hand(2), [draw2(11, 'blue'), num(12, 'red', 1), num(13, 'blue', 2)], hand(20)], rules, {
    discardPile: [top, draw2(60, 'red')],
    pendingDraw: 2,
    current: 1,
  })

describe('stacking', () => {
  it('playing a +2 adds to the stack and passes it on without skipping', () => {
    const next = playCard(mk([[draw2(1, 'red'), ...hand(2)], hand(10), hand(20)], { stacking: true }), 1, undefined, true, rng)
    expect(next.pendingDraw).toBe(2)
    expect(next.current).toBe(1)
    expect(next.players[1]).toHaveLength(3)
  })

  it('under a stack only a +2 or a draw is legal', () => {
    const moves = legalMoves(facing({ stacking: true }))
    expect(moves).toContainEqual({ type: 'play', cardId: 11 })
    expect(moves).toContainEqual({ type: 'draw' })
    expect(moves.some(m => m.type === 'play' && m.cardId === 12)).toBe(false)
    expect(() => playCard(facing({ stacking: true }), 12, undefined, true, rng)).toThrow()
  })

  it('stacking a +2 raises the stack to 4', () => {
    const next = playCard(facing({ stacking: true }), 11, undefined, true, rng)
    expect(next.pendingDraw).toBe(4)
    expect(next.current).toBe(2)
  })

  it('drawing takes the whole stack and passes the turn', () => {
    const next = drawCard(facing({ stacking: true }), rng)
    expect(next.players[1]).toHaveLength(5)
    expect(next.pendingDraw).toBe(0)
    expect(next.current).toBe(2)
  })

  it('without stacking a +2 makes the next player draw and skips them', () => {
    const next = playCard(mk([[draw2(1, 'red'), ...hand(2)], hand(10), hand(20)], {}), 1, undefined, true, rng)
    expect(next.pendingDraw).toBe(0)
    expect(next.players[1]).toHaveLength(5)
    expect(next.current).toBe(2)
  })
})

describe('seven-O', () => {
  const seven = () => mk([[num(1, 'red', 7), num(2, 'blue', 8)], [num(10, 'blue', 1)], hand(20)], { sevenO: true })

  it('a 7 swaps hands with the chosen player', () => {
    const next = playCard(seven(), 1, undefined, true, rng, 1)
    expect(next.players[0].map(c => c.id)).toEqual([10])
    expect(next.players[1].map(c => c.id)).toEqual([2])
  })

  it('a 7 without a target throws', () => {
    expect(() => playCard(seven(), 1, undefined, true, rng)).toThrow()
  })

  it('a 7 has one legal move per other player', () => {
    const moves = legalMoves(seven()).filter(m => m.type === 'play' && m.cardId === 1)
    expect(moves).toEqual([
      { type: 'play', cardId: 1, target: 1 },
      { type: 'play', cardId: 1, target: 2 },
    ])
  })

  it('a 0 passes every hand to the next player', () => {
    const state = mk([[num(1, 'red', 0), num(2, 'blue', 8)], [num(10, 'blue', 1), num(11, 'blue', 2)], [num(20, 'yellow', 3), num(21, 'yellow', 4), num(22, 'yellow', 5)]], { sevenO: true })
    const next = playCard(state, 1, undefined, true, rng)
    expect(next.players.map(h => h.length)).toEqual([3, 1, 2])
    expect(next.players[1][0].id).toBe(2)
  })
})

describe('draw until playable', () => {
  const pile = [num(100, 'red', 2), num(101, 'blue', 1), num(102, 'blue', 2)]

  it('keeps drawing until a card can be played, then keeps the turn', () => {
    const next = drawCard(mk([[num(1, 'blue', 8)], hand(10), hand(20)], { drawUntilPlay: true }, { drawPile: pile }), rng)
    expect(next.players[0]).toHaveLength(4)
    expect(next.current).toBe(0)
    expect(next.drawPile).toHaveLength(0)
  })

  it('classic rules draw one card and pass', () => {
    const next = drawCard(mk([[num(1, 'blue', 8)], hand(10), hand(20)], {}, { drawPile: pile }), rng)
    expect(next.players[0]).toHaveLength(2)
    expect(next.current).toBe(1)
  })
})

describe('UNO penalty rule', () => {
  const two = (rules: Partial<Rules>) => mk([[num(1, 'red', 1), num(2, 'red', 2)], hand(10), hand(20)], rules)

  it('is skipped when switched off', () => {
    expect(playCard(two({ unoPenalty: false }), 1, undefined, false, rng).players[0]).toHaveLength(1)
  })

  it('draws 2 when switched on', () => {
    expect(playCard(two({ unoPenalty: true }), 1, undefined, false, rng).players[0]).toHaveLength(3)
  })
})
