import type { Rng } from './types'
import type { GameState } from './state'
import type { Move } from './legal'
import type { Voids } from './voids'
import { chooseHardMove } from './hard'
import { chooseCheatMove } from './cheat'

export type Level = 'normal' | 'hard'

// normal: guesses hidden cards; hard: cheats and sees every hand
export function pickMove(state: GameState, level: Level, rng: Rng, voids?: Voids): Move {
  return level === 'hard' ? chooseCheatMove(state, rng) : chooseHardMove(state, rng, voids)
}
