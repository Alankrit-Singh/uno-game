import type { Card, Rng } from './types'
import type { GameState } from './state'
import type { Move } from './legal'
import { legalMoves } from './legal'
import { playCard, drawCard } from './moves'
import { chooseMove, scoreMove } from './bot'
import { determinize } from './sample'
import type { Voids } from './voids'

export const SIMS = 60
export const MAX_TURNS = 80
export const WEIGHT = 0.003

export function apply(state: GameState, move: Move, rng: Rng): GameState {
  if (move.type === 'draw') {
    return drawCard(state, rng)
  } else {
    return playCard(state, move.cardId, move.color, true, rng)
  }
}

export function rollout(state: GameState, me: number, rng: Rng, noise = 0.2): number {
  for (let turn = 0; turn < MAX_TURNS && state.winner === null; turn++) {
    const moves = legalMoves(state)
    const move = rng() < noise ? moves[Math.floor(rng() * moves.length)] : chooseMove(state, 'medium', rng)
    state = apply(state, move, rng)
  }
  if (state.winner === me) {
    return 1
  } else if (state.winner !== null) {
    return 0
  } else {
    const myHandSize = state.players[me].length
    const totalHandSize = state.players.reduce((sum, hand) => sum + hand.length, 0)
    return 1 - (myHandSize / totalHandSize)
  }
}

const cache = new Map<string, number>()

function label(card: Card): string {
  return `${card.kind}:${'color' in card ? card.color : '-'}:${card.kind === 'number' ? card.value : '-'}`
}

function cacheKey(state: GameState, move: Move): string {
  const handLabels = state.players[state.current].map(card => label(card)).sort().join(',')
  const topDiscardLabel = state.discardPile.length > 0 ? label(state.discardPile[state.discardPile.length - 1]) : ''
  const handSizes = state.players.map(hand => hand.length).join(',')
  const moveLabel = move.type === 'play' 
    ? `${move.type}:${label(state.players[state.current].find(c => c.id === move.cardId)!)}:${move.color ?? ''}:${move.target ?? ''}`
    : `${move.type}`
  const key = `${handLabels}|${topDiscardLabel}|${state.currentColor}|${state.direction}|${handSizes}|${state.pendingDraw}|${JSON.stringify(state.rules)}|${moveLabel}`
  return key
}

export function chooseHardMove(state: GameState, rng: Rng, voids?: Voids): Move {
  const moves = legalMoves(state)
  if (moves.length === 0) {
    throw new Error('No legal moves')
  } else if (moves.length === 1) {
    return moves[0]
  }

  const rates = moves.map(move => {
    const key = cacheKey(state, move)
    let rate = cache.get(key)
    if (rate === undefined) {
      let total = 0
      for (let i = 0; i < SIMS; i++) {
        const simState = determinize(state, rng, voids)
        const simMove = apply(simState, move, rng)
        total += rollout(simMove, state.current, rng)
      }
      rate = total / SIMS
      if (cache.size > 5000) {
        cache.clear()
      }
      cache.set(key, rate)
    }
    return rate + WEIGHT * Math.min(60, Math.max(-20, scoreMove(state, move)))
  })

  let bestMove = moves[0]
  let bestValue = rates[0]
  for (let i = 1; i < moves.length; i++) {
    if (rates[i] > bestValue) {
      bestMove = moves[i]
      bestValue = rates[i]
    }
  }

  return bestMove
}
