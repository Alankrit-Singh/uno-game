import type { Card } from '../engine/types'
import './CardView.css'

export function CardView(props: { card?: Card; faceDown?: boolean; playable?: boolean; onClick?: () => void }) {
  const { card, faceDown, playable, onClick } = props

  const label = () => {
    if (!card) return ''
    if (card.kind === 'number') return card.value.toString()
    if (card.kind === 'skip') return '⊘'
    if (card.kind === 'reverse') return '⇄'
    if (card.kind === 'draw2') return '+2'
    if (card.kind === 'wild') return '★'
    if (card.kind === 'wild4') return '+4'
    return ''
  }

  const colorClass = () => {
    if (!card) return 'card--back'
    if ('color' in card) return `card--${card.color}`
    return 'card--wild'
  }

  const ariaLabel = () => {
    if (!card) return ''
    if (card.kind === 'number') return `${card.color} ${card.value}`
    if (!('color' in card)) return card.kind
    return `${card.color} ${card.kind}`
  }

  return (
    <button
      type="button"
      className={`card ${faceDown ? 'card--back' : colorClass()} ${playable === true ? 'card--playable' : ''} ${playable === false ? 'card--dim' : ''}`}
      onClick={onClick}
      disabled={playable === false || !onClick}
      data-card-id={card?.id}
      aria-label={ariaLabel()}
    >
      {faceDown || !card ? (
        <span className="card__back-mark">UNO</span>
      ) : (
        <>
          <span className="card__corner">{label()}</span>
          <span className="card__center">{label()}</span>
          <span className="card__corner card__corner--end">{label()}</span>
        </>
      )}
    </button>
  )
}
