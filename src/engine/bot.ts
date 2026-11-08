import type { Rng } from './types'
import type { GameState } from './state'
import type { Move } from './legal'
import { legalMoves } from './legal'
import { nextPlayer } from './moves'

export type Level = 'easy' | 'medium'

export function scoreMove(state: GameState, move: Move): number {
  if (move.type === 'draw') {
    return -5
  }

  const hand = state.players[state.current]
  const card = hand.find(c => c.id === move.cardId)!
  const rest = hand.filter(c => c.id !== move.cardId)
  let score = 0

  if (rest.length === 0) {
    return 1000
  }

  const target = card.kind === 'reverse'
    ? nextPlayer({ ...state, direction: state.direction === 1 ? -1 : 1 }, 1)
    : nextPlayer(state, 1)
  const threat = state.players[target].length <= 2

  switch (card.kind) {
    case 'number':
      score += card.value
      break
    case 'skip':
    case 'reverse':
      score += threat ? 30 : 5
      break
    case 'draw2':
      score += (threat ? 30 : 5) + 3
      break
    case 'wild':
      score += threat ? 10 : -10
      break
    case 'wild4':
      score += threat ? 35 : -15
      break
  }

  const resultColor = move.color ?? ('color' in card ? card.color : state.currentColor)
  score += rest.filter(c => 'color' in c && c.color === resultColor).length * 2

  if (rest.length === 1) {
    score += 20
  }

  if (move.target !== undefined) {
    score += 3 * (rest.length - state.players[move.target].length)
  }

  return score
}

export function chooseMove(state: GameState, level: Level, rng: Rng): Move {
  const moves = legalMoves(state)
  if (moves.length === 0) {
    throw new Error('No legal moves')
  }

  if (level === 'easy') {
    return moves[Math.floor(rng() * moves.length)]
  }

  let bestMove = moves[0]
  let bestScore = scoreMove(state, bestMove)

  for (let i = 1; i < moves.length; i++) {
    const score = scoreMove(state, moves[i])
    if (score > bestScore) {
      bestMove = moves[i]
      bestScore = score
    }
  }

  return bestMove
}
