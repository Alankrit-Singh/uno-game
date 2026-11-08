import type { Card, Color, Rng } from './types'
import type { GameState } from './state'
import { createDeck, shuffle } from './deck'

export function determinize(state: GameState, rng: Rng, voids?: ReadonlyArray<ReadonlySet<Color>>): GameState {
  const knownCards = [...state.players[state.current], ...state.discardPile]
  const allCards = createDeck()
  const unseen = allCards.filter(card => !knownCards.some(kc => kc.id === card.id))
  const shuffledUnseen = shuffle(unseen, rng)
  let pool = shuffledUnseen

  const newPlayers = state.players.map((player, i) => {
    if (i === state.current) {
      return player
    }
    const blocked = voids?.[i]
    const newHand: Card[] = []
    for (let j = 0; j < player.length; j++) {
      const card = pool.find(c => !blocked || !('color' in c) || !blocked.has(c.color))
      if (card) {
        newHand.push(card)
        pool = pool.filter(c => c.id !== card.id)
      } else {
        newHand.push(pool[0])
        pool = pool.slice(1)
      }
    }
    return newHand
  })

  const newDrawPile = pool

  return {
    ...state,
    players: newPlayers,
    drawPile: newDrawPile,
  }
}
