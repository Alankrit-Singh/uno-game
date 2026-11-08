import { useState } from 'react'
import type { Level } from './engine/ai'
import type { Rules } from './engine/state'
import { StartScreen } from './components/StartScreen'
import { Table } from './components/Table'

export default function App() {
  const [config, setConfig] = useState<{ bots: number; level: Level; rules: Rules } | null>(null)

  return config === null
    ? <StartScreen onStart={(bots, level, rules) => setConfig({ bots, level, rules })} />
    : <Table bots={config.bots} level={config.level} rules={config.rules} onQuit={() => setConfig(null)} />
}
