import { useCallback, useEffect, useRef, useState } from 'react'
import type { Color } from '../engine/types'
import type { GameState, Rules } from '../engine/state'
import { newGame } from '../engine/state'
import { playCard, drawCard } from '../engine/moves'
import { pickMove } from '../engine/ai'
import type { Level } from '../engine/ai'
import { emptyVoids, updateVoids } from '../engine/voids'

export const HUMAN = 0
export const BOT_DELAY_MS = 900
export const FORGET_CHANCE = 0.2

export function useGame(playerCount: number, level: Level, rules: Rules) {
  const [state, setState] = useState<GameState>(() => newGame(playerCount, Math.random, rules))
  const voids = useRef(emptyVoids(playerCount))
  const [unoCalled, setUnoCalled] = useState(false)
  const [notice, setNotice] = useState('')

  const callUno = useCallback(() => setUnoCalled(true), [])

  const play = useCallback((cardId: number, color?: Color, target?: number) => {
    if (state.winner === null && state.current === HUMAN) {
      try {
        const mine = state.players[HUMAN].length
        const next = playCard(state, cardId, color, unoCalled, Math.random, target)
        voids.current = updateVoids(voids.current, state, { type: 'play', cardId, color, target })
        setState(next)
        setUnoCalled(false)
        if (state.rules.unoPenalty && mine === 2 && !unoCalled) {
          setNotice('You forgot to say UNO! +2 cards')
        }
      } catch {
        // illegal move: not made
      }
    }
  }, [state, unoCalled])

  const draw = useCallback(() => {
    if (state.winner === null && state.current === HUMAN) {
      voids.current = updateVoids(voids.current, state, { type: 'draw' })
      setState(drawCard(state, Math.random))
      setUnoCalled(false)
    }
  }, [state])

  const restart = useCallback(() => {
    voids.current = emptyVoids(playerCount)
    setState(newGame(playerCount, Math.random, rules))
    setNotice('')
    setUnoCalled(false)
  }, [playerCount, rules])

  useEffect(() => {
    let timeoutId: number | null = null

    if (state.winner === null && state.current !== HUMAN) {
      timeoutId = setTimeout(() => {
        const move = pickMove(state, level, Math.random, voids.current)
        voids.current = updateVoids(voids.current, state, move)
        if (move.type === 'draw') {
          setState(drawCard(state, Math.random))
        } else {
          const forgot = state.players[state.current].length === 2 && Math.random() < FORGET_CHANCE
          const next = playCard(state, move.cardId, move.color, !forgot, Math.random, move.target)
          setState(next)
          if (forgot && state.rules.unoPenalty) {
            setNotice('Bot ' + state.current + ' forgot to say UNO! +2 cards')
          }
        }
      }, BOT_DELAY_MS)
    }

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [state, level])

  useEffect(() => {
    if (notice !== '') {
      const id = setTimeout(() => setNotice(''), 3000)
      return () => clearTimeout(id)
    }
  }, [notice])

  return { state, play, draw, restart, unoCalled, callUno, notice }
}
