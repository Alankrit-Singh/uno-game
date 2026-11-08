import type { Color, Rng } from './types'
import { canPlay, drawCards } from './state'
import type { GameState } from './state'

export function nextPlayer(state: GameState, steps = 1): number {
  const len = state.players.length
  const newIndex = (state.current + steps * state.direction + len) % len
  return newIndex < 0 ? newIndex + len : newIndex
}

function give(s: GameState, playerIndex: number, count: number, rng: Rng): GameState {
  const r = drawCards(s.drawPile, s.discardPile, count, rng)
  const players = s.players.map((h, i) => i === playerIndex ? [...h, ...r.cards] : h)
  return { ...s, players, drawPile: r.drawPile, discardPile: r.discardPile }
}

export function playCard(state: GameState, cardId: number, chosenColor: Color | undefined, callUno: boolean, rng: Rng, target?: number): GameState {
  if (state.winner !== null) throw new Error('Game already won')
  const hand = state.players[state.current]
  const card = hand.find(c => c.id === cardId)
  if (!card) throw new Error('Card not in hand')
  const top = state.discardPile[state.discardPile.length - 1]
  if (!canPlay(card, top, state.currentColor)) throw new Error('Illegal move')
  if (state.pendingDraw > 0 && card.kind !== top.kind) throw new Error('Illegal move')
  if ((card.kind === 'wild' || card.kind === 'wild4') && chosenColor === undefined) throw new Error('Color must be chosen for wild cards')

  let s: GameState = {
    ...state,
    players: state.players.map(h => h.filter(c => c.id !== card.id)),
    discardPile: [...state.discardPile, card],
    currentColor: 'color' in card ? card.color : chosenColor!
  }

  if (s.players[state.current].length === 0) return { ...s, winner: state.current }

  if (s.players[state.current].length === 1 && !callUno && state.rules.unoPenalty) {
    s = give(s, state.current, 2, rng)
  }

  if (card.kind === 'reverse') {
    s = { ...s, direction: s.direction === 1 ? -1 : 1 }
  }

  if (card.kind === 'draw2' && state.rules.stacking) {
    s = { ...s, pendingDraw: state.pendingDraw + 2 }
    return { ...s, current: nextPlayer(s, 1) }
  }

  if (card.kind === 'wild4' && state.rules.stacking) {
    s = { ...s, pendingDraw: state.pendingDraw + 4 }
    return { ...s, current: nextPlayer(s, 1) }
  }

  if (card.kind === 'draw2') {
    s = give(s, nextPlayer(s, 1), 2, rng)
    return { ...s, current: nextPlayer(s, 2) }
  }

  if (card.kind === 'wild4') {
    s = give(s, nextPlayer(s, 1), 4, rng)
    return { ...s, current: nextPlayer(s, 2) }
  }

  if (card.kind === 'skip') {
    return { ...s, current: nextPlayer(s, 2) }
  }

  if (card.kind === 'reverse' && s.players.length === 2) {
    return s
  }

  if (card.kind === 'number' && card.value === 7 && state.rules.sevenO) {
    if (target === undefined || target === state.current || target < 0 || target >= state.players.length) {
      throw new Error('Target required')
    }
    const currentHand = s.players[state.current]
    const targetHand = s.players[target]
    s = { ...s, players: s.players.map((h, i) => i === state.current ? targetHand : i === target ? currentHand : h) }
  }

  if (card.kind === 'number' && card.value === 0 && state.rules.sevenO) {
    const len = state.players.length
    const old = s.players
    s = { ...s, players: old.map((_, j) => old[(j - state.direction + len) % len]) }
  }

  return { ...s, current: nextPlayer(s, 1) }
}

export function drawCard(state: GameState, rng: Rng): GameState {
  if (state.winner !== null) throw new Error('Game already won')
  if (state.pendingDraw > 0) {
    const s = give(state, state.current, state.pendingDraw, rng)
    return { ...s, pendingDraw: 0, current: nextPlayer(s, 1) }
  } else if (state.rules.drawUntilPlay) {
    let s = state
    for (;;) {
      const next = give(s, s.current, 1, rng)
      const hand = next.players[next.current]
      if (hand.length === s.players[s.current].length) {
        return { ...next, current: nextPlayer(next, 1) }
      }
      const top = next.discardPile[next.discardPile.length - 1]
      if (canPlay(hand[hand.length - 1], top, next.currentColor)) {
        return next
      }
      s = next
    }
  } else {
    const s = give(state, state.current, 1, rng)
    return { ...s, current: nextPlayer(s, 1) }
  }
}
