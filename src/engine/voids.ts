import type { Color } from './types'
import type { GameState } from './state'
import type { Move } from './legal'

export type Voids = Set<Color>[]
export function emptyVoids(playerCount: number): Voids {
  return Array.from({ length: playerCount }, () => new Set<Color>())
}

export function updateVoids(voids: Voids, before: GameState, move: Move): Voids {
  const newVoids = voids.map(set => new Set(set))

  if (move.type === 'draw') {
    if (before.pendingDraw === 0) {
      newVoids[before.current].add(before.currentColor)
    }
  } else {
    const card = before.players[before.current].find(c => c.id === move.cardId)
    if (card && 'color' in card) {
      newVoids[before.current].delete(card.color)
    }
  }

  return newVoids
}
