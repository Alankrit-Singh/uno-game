import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import { scoreMove, chooseMove } from './bot'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const act = (id: number, color: Color, kind: 'skip' | 'reverse' | 'draw2'): Card => ({ id, kind, color })
const wild = (id: number): Card => ({ id, kind: 'wild' })
const top = num(50, 'red', 5)
const mk = (players: Card[][], over: Partial<GameState> = {}): GameState => ({ players, drawPile: [], discardPile: [top], current: 0, direction: 1, currentColor: 'red', winner: null, pendingDraw: 0, rules: CLASSIC_RULES, ...over })
const filler = (start: number): Card[] => [num(start, 'blue', 7), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]
const p0 = [act(1,'red','skip'), num(2,'red',9), num(3,'blue',7)]
const calm = () => mk([p0, filler(10), filler(20)])
const threat = () => mk([p0, [num(10,'blue',7), num(11,'yellow',3)], filler(20)])

describe('scoreMove', () => {
  it('draw is -5', () => {
    expect(scoreMove(calm(), { type: 'draw' })).toBe(-5)
  })

  it('going out is 1000', () => {
    const state = mk([[num(1,'red',1)], filler(10), filler(20)])
    expect(scoreMove(state, { type: 'play', cardId: 1 })).toBe(1000)
  })

  it('calm: scoreMove for card 1 (skip) is 7 and for card 2 (red 9) is 11', () => {
    expect(scoreMove(calm(), { type: 'play', cardId: 1 })).toBe(7)
    expect(scoreMove(calm(), { type: 'play', cardId: 2 })).toBe(11)
  })

  it('threat: scoreMove for card 1 (skip) is 32', () => {
    expect(scoreMove(threat(), { type: 'play', cardId: 1 })).toBe(32)
  })
})

describe('chooseMove', () => {
  it('medium picks card 1 in threat() and card 2 in calm()', () => {
    const rng = () => 0.5
    expect(chooseMove(threat(), 'medium', rng)).toEqual({ type: 'play', cardId: 1 })
    expect(chooseMove(calm(), 'medium', rng)).toEqual({ type: 'play', cardId: 2 })
  })

  it('wild color choice', () => {
    const state = mk([[wild(1), num(2,'blue',7), num(3,'blue',8)], filler(10), filler(20)])
    expect(chooseMove(state, 'medium', () => 0.5)).toEqual({ type: 'play', cardId: 1, color: 'blue' })
  })

  it('easy: with rng () => 0 returns the first legal move and with () => 0.999 the last legal move', () => {
    expect(chooseMove(calm(), 'easy', () => 0)).toEqual({ type: 'play', cardId: 1 })
    expect(chooseMove(calm(), 'easy', () => 0.999)).toEqual({ type: 'play', cardId: 2 })
  })

  it('draws when no card is playable', () => {
    const state = mk([[num(2,'blue',7)], filler(10), filler(20)])
    expect(chooseMove(state, 'medium', () => 0.5)).toEqual({ type: 'draw' })
  })

  it('winner: 0 -> chooseMove throws', () => {
    const state = mk([p0, filler(10), filler(20)], { winner: 0 })
    expect(() => chooseMove(state, 'easy', () => 0.5)).toThrow()
  })
})
