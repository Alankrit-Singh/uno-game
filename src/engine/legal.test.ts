import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import { legalMoves } from './legal'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const act = (id: number, color: Color, kind: 'skip' | 'reverse' | 'draw2'): Card => ({ id, kind, color })
const wild = (id: number): Card => ({ id, kind: 'wild' })
const top = num(50, 'red', 5)
const mk = (players: Card[][], over: Partial<GameState> = {}): GameState => ({ players, drawPile: [], discardPile: [top], current: 0, direction: 1, currentColor: 'red', winner: null, pendingDraw: 0, rules: CLASSIC_RULES, ...over })
const filler = (start: number): Card[] => [num(start, 'blue', 7), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]

describe('legalMoves', () => {
  it('gives one move per card and four per wild', () => {
    const state = mk([
      [num(1, 'red', 1), num(2, 'blue', 7), wild(3), act(4, 'blue', 'skip')],
      filler(10),
      filler(20)
    ])
    const moves = legalMoves(state)
    expect(moves).toHaveLength(5)
    expect(moves.map(move => move.type === 'play' ? move.cardId : null)).toEqual([1, 3, 3, 3, 3])
    expect(moves.flatMap(move => move.type === 'play' && move.cardId === 3 ? [move.color] : [])).toEqual(['red', 'yellow', 'green', 'blue'])
    expect(moves.find(move => move.type === 'play' && move.cardId === 1)).toEqual({ type: 'play', cardId: 1 })
  })

  it('draws when nothing is playable', () => {
    const state = mk([
      [num(2, 'blue', 7), num(5, 'yellow', 3)],
      filler(10),
      filler(20)
    ])
    const moves = legalMoves(state)
    expect(moves).toEqual([{ type: 'draw' }])
  })

  it('winner: 0 -> toEqual([]).', () => {
    const state = mk([
      [num(1, 'red', 1), num(2, 'blue', 7), wild(3), act(4, 'blue', 'skip')],
      filler(10),
      filler(20)
    ], { winner: 0 })
    const moves = legalMoves(state)
    expect(moves).toEqual([])
  })

  it('allows the same action kind in another color', () => {
    const state = mk([
      [act(1, 'blue', 'skip'), num(2, 'blue', 7)],
      filler(10),
      filler(20)
    ], { discardPile: [act(50, 'red', 'skip')] })
    const moves = legalMoves(state)
    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ type: 'play', cardId: 1 })
  })

  it('uses currentColor over the top card color', () => {
    const state = mk([
      [num(1, 'blue', 2), num(2, 'red', 2)],
      filler(10),
      filler(20)
    ], { currentColor: 'blue' })
    const moves = legalMoves(state)
    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ type: 'play', cardId: 1 })
  })

  it('does not mutate: JSON.stringify of the state is equal before and after the call.', () => {
    const state = mk([
      [num(1, 'red', 1), num(2, 'blue', 7), wild(3), act(4, 'blue', 'skip')],
      filler(10),
      filler(20)
    ])
    const stateCopy = JSON.stringify(state)
    legalMoves(state)
    expect(JSON.stringify(state)).toEqual(stateCopy)
  })
})
