import { describe, it, expect } from 'vitest'
import type { Card, Color } from './types'
import type { GameState } from './state'
import { CLASSIC_RULES } from './state'
import { newGame } from './state'
import { legalMoves } from './legal'
import { chooseCheatMove } from './cheat'

const num = (id: number, color: Color, value: number): Card => ({ id, kind: 'number', color, value })
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
const top = num(50, 'red', 5)
const filler = (start: number): Card[] => [num(start, 'blue', 7), num(start + 1, 'yellow', 3), num(start + 2, 'yellow', 4)]
const mk = (players: Card[][], over: Partial<GameState> = {}): GameState => ({ players, drawPile: Array.from({ length: 20 }, (_, i) => num(100 + i, 'green', 9)), discardPile: [top], current: 0, direction: 1, currentColor: 'red', winner: null, pendingDraw: 0, rules: CLASSIC_RULES, ...over })

describe('chooseCheatMove', () => {
  it('with one legal move', () => {
    const state = mk([[num(1, 'blue', 7)], filler(10), filler(20)])
    expect(chooseCheatMove(state, seeded(1))).toEqual({ type: 'draw' })
  })

  it('going out', () => {
    const state = mk([[num(1, 'red', 1)], filler(10), filler(20)])
    expect(chooseCheatMove(state, seeded(1))).toEqual({ type: 'play', cardId: 1 })
  })

  it('on newGame(4, seeded(7))', () => {
    const state = newGame(4, seeded(7))
    const legal = legalMoves(state)
    expect(legal).toContainEqual(chooseCheatMove(state, seeded(1)))
  })

  it('does not mutate', () => {
    const state = newGame(4, seeded(7))
    const before = JSON.stringify(state)
    chooseCheatMove(state, seeded(1))
    const after = JSON.stringify(state)
    expect(before).toEqual(after)
  })

  it('throws when state.winner is 0', () => {
    const state = mk([filler(1)], { winner: 0 })
    expect(() => chooseCheatMove(state, seeded(1))).toThrow()
  })
})
