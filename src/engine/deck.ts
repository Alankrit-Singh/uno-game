import type { Card, Color, Rng } from './types'

export const COLORS: readonly Color[] = ['red', 'yellow', 'green', 'blue']

export function createDeck(): Card[] {
  let id = 0;
  const deck: Card[] = [];

  for (const color of COLORS) {
    deck.push({ id: id++, kind: 'number', color, value: 0 });
    for (let value = 1; value <= 9; value++) {
      deck.push({ id: id++, kind: 'number', color, value });
      deck.push({ id: id++, kind: 'number', color, value });
    }
    deck.push({ id: id++, kind: 'skip', color });
    deck.push({ id: id++, kind: 'skip', color });
    deck.push({ id: id++, kind: 'reverse', color });
    deck.push({ id: id++, kind: 'reverse', color });
    deck.push({ id: id++, kind: 'draw2', color });
    deck.push({ id: id++, kind: 'draw2', color });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: id++, kind: 'wild' });
    deck.push({ id: id++, kind: 'wild4' });
  }

  return deck;
}

export function shuffle(cards: readonly Card[], rng: Rng): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
