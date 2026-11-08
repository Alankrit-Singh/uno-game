import type { Rng } from './types'
import type { GameState } from './state'
import type { Move } from './legal'
import { legalMoves } from './legal'
import { apply, rollout } from './hard'
import { shuffle } from './deck'

export const CHEAT_SIMS = 30

export function chooseCheatMove(state: GameState, rng: Rng): Move {
  const moves = legalMoves(state)
  if (moves.length === 0) {
    throw new Error('No legal moves')
  }
  if (moves.length === 1) {
    return moves[0]
  }

  let bestMove = moves[0]
  let bestScore = -1

  for (const move of moves) {
    let totalScore = 0
    for (let i = 0; i < CHEAT_SIMS; i++) {
      // sees every hand, but the draw pile order stays hidden
      const newState = apply({ ...state, drawPile: shuffle(state.drawPile, rng) }, move, rng)
      totalScore += rollout(newState, state.current, rng, 0)
    }
    const averageScore = totalScore / CHEAT_SIMS
    if (averageScore > bestScore) {
      bestScore = averageScore
      bestMove = move
    }
  }

  return bestMove
}
