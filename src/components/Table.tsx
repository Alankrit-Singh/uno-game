import { useRef, useState } from 'react'
import type { Card } from '../engine/types'
import { COLORS } from '../engine/deck'
import { legalMoves } from '../engine/legal'
import type { Level } from '../engine/ai'
import { CardView } from './CardView'
import { useGame, HUMAN } from '../game/useGame'
import { useCardAnimations } from '../game/useCardAnimations'
import './Table.css'
import type { Rules } from '../engine/state'

export function Table(props: { bots: number; level: Level; rules: Rules; onQuit: () => void }) {
  const players = props.bots + 1
  const { state, play, draw, restart, unoCalled, callUno, notice } = useGame(players, props.level, props.rules)
  const [pendingWild, setPendingWild] = useState<number | null>(null)
  const [pendingSeven, setPendingSeven] = useState<number | null>(null)
  const tableRef = useRef<HTMLElement>(null)
  useCardAnimations(state, tableRef)

  const isMyTurn = state.current === HUMAN && state.winner === null
  const playableIds = new Set<number>()
  legalMoves(state).forEach(move => {
    if (move.type === 'play') {
      playableIds.add(move.cardId)
    }
  })
  const canDraw = isMyTurn && (playableIds.size === 0 || state.pendingDraw > 0)

  const onCardClick = (card: Card) => {
    if (card.kind === 'wild' || card.kind === 'wild4') {
      setPendingWild(card.id)
    } else if (state.rules.sevenO && card.kind === 'number' && card.value === 7) {
      setPendingSeven(card.id)
    } else {
      play(card.id)
    }
  }

  const topCard = state.discardPile[state.discardPile.length - 1]

  return (
    <main className="table" ref={tableRef}>
      <header className="table__bar">
        <h1>UNO</h1>
        <button type="button" onClick={props.onQuit}>Menu</button>
        <p className="status">
          {state.winner !== null ? (state.winner === HUMAN ? 'You win!' : `Bot ${state.winner} wins`) : isMyTurn ? 'Your turn' : `Bot ${state.current} is thinking…`}
        </p>
      </header>
      {notice !== '' && <p className="notice" role="status">{notice}</p>}
      <section className="opponents">
        {Array.from({ length: players - 1 }, (_, i) => i + 1).map(i => (
          <div className={'opponent' + (state.current === i ? ' opponent--active' : '')} data-seat={i} key={i}>
            <span>Bot {i}{state.players[i].length === 1 ? ' - UNO!' : ''}</span>
            <div className="opponent__cards">
              {state.players[i].map(card => <CardView key={card.id} faceDown />)}
            </div>
          </div>
        ))}
      </section>
      <section className="center">
        <div className="pile" data-draw>
          <CardView faceDown playable={canDraw ? true : undefined} onClick={canDraw ? draw : undefined} />
          <span>{state.pendingDraw > 0 ? 'Draw +' + state.pendingDraw : 'Draw'}</span>
        </div>
        <div className="pile" data-top>
          <CardView card={topCard} />
          <span className={'color-dot color-dot--' + state.currentColor} aria-label={'Current color ' + state.currentColor} />
        </div>
        <span className="direction">{state.direction === 1 ? '↻' : '↺'}</span>
      </section>
      <section className="hand">
        {state.players[HUMAN].map(card => (
          <CardView key={card.id} card={card} playable={isMyTurn ? playableIds.has(card.id) : undefined} onClick={() => onCardClick(card)} />
        ))}
      </section>
      {isMyTurn && state.players[HUMAN].length === 2 && (
        <button type="button" className={'uno-btn' + (unoCalled ? ' uno-btn--on' : '')} onClick={callUno} disabled={unoCalled}>UNO!</button>
      )}
      {pendingWild !== null && (
        <div className="overlay">
          <div className="dialog">
            <p>Choose a color</p>
            <div className="dialog__colors">
              {COLORS.map(color => (
                <button key={color} type="button" className={'color-btn color-btn--' + color} aria-label={color} onClick={() => { play(pendingWild, color); setPendingWild(null) }} />
              ))}
            </div>
            <button type="button" onClick={() => setPendingWild(null)}>Cancel</button>
          </div>
        </div>
      )}
      {pendingSeven !== null && (
        <div className="overlay">
          <div className="dialog">
            <p>Swap hands with who?</p>
            <div className="dialog__colors">
              {Array.from({ length: players - 1 }, (_, k) => k + 1).map(i => (
                <button key={i} type="button" onClick={() => { play(pendingSeven, undefined, i); setPendingSeven(null) }}>Bot {i} ({state.players[i].length})</button>
              ))}
            </div>
            <button type="button" onClick={() => setPendingSeven(null)}>Cancel</button>
          </div>
        </div>
      )}
      {state.winner !== null && (
        <div className="overlay">
          <div className="dialog">
            <p>{state.winner === HUMAN ? 'You win!' : `Bot ${state.winner} wins`}</p>
            <button type="button" onClick={restart}>Play again</button>
          </div>
        </div>
      )}
    </main>
  )
}
