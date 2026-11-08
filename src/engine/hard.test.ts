import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import { newGame } from './state'
import { legalMoves } from './legal'
import { chooseHardMove } from './hard'
const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
const top = num(50, 'red', 5)
const filler = (start: number): Card[] => [num(start, 'blue', 7), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]
const mk = (players: Card[][], over: Partial<GameState> = {}): GameState => ({ players, drawPile: Array.from({ length: 20 }, (_, i) => num(100 + i, 'green', 9)), discardPile: [top], current: 0, direction: 1, currentColor: 'red', winner: null, pendingDraw: 0, rules: CLASSIC_RULES, ...over })

describe('chooseHardMove', () => {
  it('when only one move is legal it returns that move', () => {
    const state = mk([[num(2, 'blue', 7)], filler(10), filler(20)])
    const move = chooseHardMove(state, seeded(1))
    expect(move).toEqual({ type: 'draw' })
  })

  it('going out', () => {
    const state = mk([[num(1, 'red', 1), num(2, 'blue', 7)], filler(10), filler(20)])
    const move = chooseHardMove(state, seeded(1))
    expect(move).toEqual({ type: 'play', cardId: 1 })
  })

  it('on newGame(4, seeded(7)) the result is one of legalMoves(state)', () => {
    const state = newGame(4, seeded(7))
    const move = chooseHardMove(state, seeded(1))
    expect(legalMoves(state)).toContainEqual(move)
  })

  it('does not mutate the input state', () => {
    const state = newGame(4, seeded(7))
    const originalState = JSON.stringify(state)
    chooseHardMove(state, seeded(1))
    expect(JSON.stringify(state)).toBe(originalState)
  })

  it('throws when state.winner is not null', () => {
    const state = mk([[num(1, 'red', 1)], filler(10), filler(20)], { winner: 0 })
    expect(() => chooseHardMove(state, seeded(1))).toThrow()
  })
})
