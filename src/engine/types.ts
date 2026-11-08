export type Color = 'red' | 'yellow' | 'green' | 'blue'
export type Card =
  | { id: number; kind: 'number'; color: Color; value: number }
  | { id: number; kind: 'skip' | 'reverse' | 'draw2'; color: Color }
  | { id: number; kind: 'wild' | 'wild4' }
export type Rng = () => number
