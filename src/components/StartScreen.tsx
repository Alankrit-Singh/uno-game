import { useState } from 'react'
import type { Level } from '../engine/ai'
import type { Rules } from '../engine/state'
import { DEFAULT_RULES } from '../engine/state'
import './StartScreen.css'

const BOT_OPTIONS = [1, 2, 3, 4, 5, 6]
const LEVELS: { value: Level; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' }
]

const RULE_OPTIONS: { key: keyof Rules; label: string; hint: string }[] = [
  { key: 'stacking', label: 'Stacking', hint: 'Answer a +2 with a +2 (or +4 with +4); the next player draws the whole stack' },
  { key: 'sevenO', label: 'Seven-O', hint: 'A 7 swaps hands with a player you pick; a 0 passes every hand along' },
  { key: 'drawUntilPlay', label: 'Draw until you can play', hint: 'If you cannot play, keep drawing until you get a card you can play' },
  { key: 'unoPenalty', label: 'UNO penalty', hint: 'Forget to say UNO with 2 cards left and you draw 2' }
]

export function StartScreen(props: { onStart: (bots: number, level: Level, rules: Rules) => void }) {
  const [bots, setBots] = useState<number>(3)
  const [level, setLevel] = useState<Level>('normal')
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES)

  return (
    <main className="start">
      <h1>UNO</h1>
      <p className="start__tag">How many bots do you want to play against?</p>
      <div className="chips" role="group" aria-label="Number of bots">
        {BOT_OPTIONS.map(n => (
          <button
            key={n}
            type="button"
            className={'chip' + (bots === n ? ' chip--on' : '')}
            aria-pressed={bots === n}
            onClick={() => setBots(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="start__tag">Difficulty</p>
      <div className="chips" role="group" aria-label="Difficulty">
        {LEVELS.map(l => (
          <button
            key={l.value}
            type="button"
            className={'chip' + (level === l.value ? ' chip--on' : '')}
            aria-pressed={level === l.value}
            onClick={() => setLevel(l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="start__tag">Rules</p>
      <div className="rules">
        {RULE_OPTIONS.map(option => (
          <label className="rule" key={option.key} title={option.hint}>
            <input
              type="checkbox"
              checked={rules[option.key]}
              onChange={() => setRules({ ...rules, [option.key]: !rules[option.key] })}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="start__play"
        onClick={() => props.onStart(bots, level, rules)}
      >
        Play
      </button>
    </main>
  )
}
