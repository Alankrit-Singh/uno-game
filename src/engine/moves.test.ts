import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import { nextPlayer, playCard, drawCard } from './moves'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const act = (id: number, color: Color, kind: 'skip' | 'reverse' | 'draw2'): Card => ({ id, kind, color })
const wild = (id: number): Card => ({ id, kind: 'wild' })
const wild4 = (id: number): Card => ({ id, kind: 'wild4' })
const rng = () => 0.5

// ids inside one state are unique: hands use 1..29, top uses 50, draw pile uses 100..109
const top = num(50, 'red', 5)
const hand = (start: number): Card[] => [num(start, 'blue', 7), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]
const mk = (players: Card[][], over: Partial<GameState> = {}): GameState => ({
  players,
  drawPile: Array.from({ length: 10 }, (_, i) => num(100 + i, 'green', 9)),
  discardPile: [top],
  current: 0,
  direction: 1,
  currentColor: 'red',
  winner: null, pendingDraw: 0, rules: CLASSIC_RULES,
  ...over,
})
// 3 players, player 0 holds `first` (card id 1) plus 3 filler cards
const three = (first: Card) => mk([[first, ...hand(2)], hand(10), hand(20)])

describe('nextPlayer', () => {
  it('wraps forward', () => {
    expect(nextPlayer(mk([[], [], []], { current: 2 }), 1)).toBe(0)
  })

  it('wraps backward', () => {
    expect(nextPlayer(mk([[], [], []], { current: 0, direction: -1 }), 1)).toBe(2)
  })

  it('moves two seats', () => {
    expect(nextPlayer(mk([[], [], []], { current: 1 }), 2)).toBe(0)
  })
})

describe('playCard', () => {
  it('plays a matching card and advances the turn', () => {
    const state = three(num(1, 'red', 1))
    const next = playCard(state, 1, undefined, false, rng)
    expect(next.discardPile).toEqual([top, num(1, 'red', 1)])
    expect(next.players[0]).toHaveLength(3)
    expect(next.players[0].some(c => c.id === 1)).toBe(false)
    expect(next.current).toBe(1)
    expect(next.currentColor).toBe('red')
  })

  it('does not mutate the input state', () => {
    const state = three(num(1, 'red', 1))
    playCard(state, 1, undefined, false, rng)
    expect(state.players[0]).toHaveLength(4)
    expect(state.discardPile).toEqual([top])
    expect(state.current).toBe(0)
  })

  it('throws on a card that does not match', () => {
    expect(() => playCard(three(num(1, 'red', 1)), 2, undefined, false, rng)).toThrow()
  })

  it('throws on a card that is not in the hand', () => {
    expect(() => playCard(three(num(1, 'red', 1)), 99, undefined, false, rng)).toThrow()
  })

  it('throws on a wild card without a chosen color', () => {
    expect(() => playCard(three(wild(1)), 1, undefined, false, rng)).toThrow()
  })
})

describe('action cards', () => {
  it('skip moves the turn two seats', () => {
    expect(playCard(three(act(1, 'red', 'skip')), 1, undefined, false, rng).current).toBe(2)
  })

  it('reverse with 3 players flips direction and goes back a seat', () => {
    const next = playCard(three(act(1, 'red', 'reverse')), 1, undefined, false, rng)
    expect(next.direction).toBe(-1)
    expect(next.current).toBe(2)
  })

  it('reverse with 2 players keeps the same player', () => {
    const state = mk([[act(1, 'red', 'reverse'), ...hand(2)], hand(10)])
    const next = playCard(state, 1, undefined, false, rng)
    expect(next.direction).toBe(-1)
    expect(next.current).toBe(0)
  })

  it('draw2 gives the next player 2 cards and skips them', () => {
    const next = playCard(three(act(1, 'red', 'draw2')), 1, undefined, false, rng)
    expect(next.players[1]).toHaveLength(5)
    expect(next.current).toBe(2)
  })

  it('wild sets the color and does not skip or draw', () => {
    const next = playCard(three(wild(1)), 1, 'blue', false, rng)
    expect(next.currentColor).toBe('blue')
    expect(next.current).toBe(1)
    expect(next.players[1]).toHaveLength(3)
  })

  it('wild4 sets the color, gives 4 cards and skips', () => {
    const next = playCard(three(wild4(1)), 1, 'blue', false, rng)
    expect(next.currentColor).toBe('blue')
    expect(next.players[1]).toHaveLength(7)
    expect(next.current).toBe(2)
  })
})

describe('UNO and winning', () => {
  const twoCards = () => mk([[num(1, 'red', 1), num(2, 'red', 2)], hand(10), hand(20)])

  it('draws 2 penalty cards when UNO is not called', () => {
    expect(playCard(twoCards(), 1, undefined, false, rng).players[0]).toHaveLength(3)
  })

  it('has no penalty when UNO is called', () => {
    expect(playCard(twoCards(), 1, undefined, true, rng).players[0]).toHaveLength(1)
  })

  it('the penalty keeps the card effect', () => {
    const state = mk([[act(1, 'red', 'skip'), num(2, 'red', 2)], hand(10), hand(20)])
    expect(playCard(state, 1, undefined, false, rng).current).toBe(2)
  })

  it('sets the winner when the hand is empty and blocks further moves', () => {
    const state = mk([[num(1, 'red', 1)], hand(10), hand(20)])
    const won = playCard(state, 1, undefined, false, rng)
    expect(won.winner).toBe(0)
    expect(() => playCard(won, 10, undefined, false, rng)).toThrow()
    expect(() => drawCard(won, rng)).toThrow()
  })
})

describe('drawCard', () => {
  it('adds one card to the hand, takes it from the draw pile and passes the turn', () => {
    const next = drawCard(three(num(1, 'red', 1)), rng)
    expect(next.players[0]).toHaveLength(5)
    expect(next.players[0][4].id).toBe(109)
    expect(next.drawPile).toHaveLength(9)
    expect(next.current).toBe(1)
  })
})
