import type { Color } from './types'
import type { GameState } from './state'
import { canPlay } from './state'
import { COLORS } from './deck'

export type Move = { type: 'play'; cardId: number; color?: Color; target?: number } | { type: 'draw' }

export function legalMoves(state: GameState): Move[] {
  if (state.winner !== null) return []

  const hand = state.players[state.current]
  const top = state.discardPile[state.discardPile.length - 1]
  const moves: Move[] = []

  for (const card of hand) {
    if (state.pendingDraw > 0) {
      if (card.kind === top.kind) {
        if (card.kind === 'wild' || card.kind === 'wild4') {
          for (const color of COLORS) {
            moves.push({ type: 'play', cardId: card.id, color })
          }
        } else {
          moves.push({ type: 'play', cardId: card.id })
        }
      }
    } else if (canPlay(card, top, state.currentColor)) {
      if (state.rules.sevenO && card.kind === 'number' && card.value === 7) {
        for (let i = 0; i < state.players.length; i++) {
          if (i !== state.current) {
            moves.push({ type: 'play', cardId: card.id, target: i })
          }
        }
      } else if (card.kind === 'wild' || card.kind === 'wild4') {
        for (const color of COLORS) {
          moves.push({ type: 'play', cardId: card.id, color })
        }
      } else {
        moves.push({ type: 'play', cardId: card.id })
      }
    }
  }

  if (moves.length === 0 || state.pendingDraw > 0) {
    moves.push({ type: 'draw' })
  }

  return moves
}
