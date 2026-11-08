import type { Card, Color, Rng } from './types'
import { createDeck, shuffle } from './deck'

export type Rules = {
  stacking: boolean
  sevenO: boolean
  drawUntilPlay: boolean
  unoPenalty: boolean
}

export const CLASSIC_RULES: Rules = { stacking: false, sevenO: false, drawUntilPlay: false, unoPenalty: true }
export const DEFAULT_RULES: Rules = { ...CLASSIC_RULES, stacking: true }

export type GameState = {
  players: Card[][]
  drawPile: Card[]
  discardPile: Card[]
  current: number
  direction: 1 | -1
  currentColor: Color
  winner: number | null
  pendingDraw: number
  rules: Rules
}

export function canPlay(card: Card, top: Card, currentColor: Color): boolean {
  if (card.kind === 'wild' || card.kind === 'wild4') {
    return true
  }
  if ('color' in card && card.color === currentColor) {
    return true
  }
  if (card.kind === 'number' && top.kind === 'number' && card.value === top.value) {
    return true
  }
  if (card.kind !== 'number' && top.kind !== 'number' && card.kind === top.kind) {
    return true
  }
  return false
}

export function drawCards(drawPile: Card[], discardPile: Card[], count: number, rng: Rng): { cards: Card[]; drawPile: Card[]; discardPile: Card[] } {
  const cards: Card[] = []
  let newDrawPile: Card[] = [...drawPile]
  let newDiscardPile: Card[] = [...discardPile]

  while (cards.length < count && newDrawPile.length > 0) {
    cards.push(newDrawPile.pop()!)
  }

  if (cards.length < count && newDiscardPile.length > 1) {
    const remainingDiscard = newDiscardPile.slice(0, newDiscardPile.length - 1)
    newDrawPile = shuffle(remainingDiscard, rng)
    newDiscardPile = [newDiscardPile[newDiscardPile.length - 1]]
  }

  while (cards.length < count && newDrawPile.length > 0) {
    cards.push(newDrawPile.pop()!)
  }

  return { cards, drawPile: newDrawPile, discardPile: newDiscardPile }
}

export function newGame(playerCount: number, rng: Rng, rules: Rules = DEFAULT_RULES): GameState {
  if (playerCount < 2 || playerCount > 10) {
    throw new Error('Player count must be between 2 and 10')
  }

  const deck = shuffle(createDeck(), rng)
  const players: Card[][] = Array.from({ length: playerCount }, () => [])
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < playerCount; j++) {
      players[j].push(deck.pop()!)
    }
  }

  const discardPile: Card[] = []
  let startColor: Color = 'red'
  while (discardPile.length === 0) {
    const card = deck.pop()!
    if (card.kind === 'number') {
      discardPile.push(card)
      startColor = card.color
    } else {
      deck.unshift(card)
    }
  }

  return {
    players,
    drawPile: deck,
    discardPile,
    current: 0,
    direction: 1,
    currentColor: startColor,
    winner: null,
    pendingDraw: 0,
    rules
  }
}
