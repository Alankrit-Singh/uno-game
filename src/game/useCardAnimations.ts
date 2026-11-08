import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import type { RefObject } from 'react'
import type { GameState } from '../engine/state'
import { HUMAN } from './useGame'

export function useCardAnimations(state: GameState, root: RefObject<HTMLElement | null>) {
  const prev = useRef<GameState | null>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const draw = el.querySelector('[data-draw]')
    if (!draw) return

    const from = center(draw)
    const before = prev.current

    if (!before || (before.winner !== null && state.winner === null)) {
      // DEAL
      state.players.forEach((_, seat) => {
        cardsOf(el, seat).forEach((card, cardIndex) => {
          fly(card, from, (cardIndex * state.players.length + seat) * 0.06)
        })
      })
      prev.current = state
      return
    }

    if (state.discardPile.length > before.discardPile.length) {
      // PLAY
      const top = el.querySelector<HTMLElement>('[data-top]')
      const source = el.querySelector(before.current === HUMAN ? '.hand' : `.opponent[data-seat="${before.current}"]`)
      if (top && source) {
        fly(top, center(source), 0)
      }
    }

    // DRAW
    const played = state.discardPile.length > before.discardPile.length
    state.players.forEach((hand, seat) => {
      const diff = hand.length - before.players[seat].length
      if (diff > 0) {
        cardsOf(el, seat).slice(-diff).forEach((card, index) => {
          fly(card, from, 0.08 * index + (played ? 0.15 : 0))
        })
      }
    })

    prev.current = state
  }, [state, root])
}

function center(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function fly(el: HTMLElement, from: { x: number; y: number }, delay: number, duration = 0.45) {
  const c = center(el)
  gsap.from(el, {
    x: from.x - c.x,
    y: from.y - c.y,
    opacity: 0,
    duration,
    delay,
    ease: 'power2.out',
    clearProps: 'transform,opacity',
    onStart: () => {
      el.style.transition = 'none'
    },
    onComplete: () => {
      el.style.transition = ''
    }
  })
}

function cardsOf(root: HTMLElement, seat: number): HTMLElement[] {
  const selector = seat === HUMAN ? '.hand .card' : `.opponent[data-seat="${seat}"] .card`
  return Array.from(root.querySelectorAll<HTMLElement>(selector))
}
