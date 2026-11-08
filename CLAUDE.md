# uno-game

Web UNO game. Vite + React + TypeScript. Hosted on GitHub Pages. Single player vs bots first.

## Layout
- `src/engine/` — pure rules engine (no React, no DOM), each file has a `.test.ts`:
  - `types.ts`, `deck.ts` — cards, 108-card deck, seeded shuffle.
  - `state.ts` — `GameState`, `canPlay`, `drawCards` (reshuffles discard), `newGame`.
  - `moves.ts` — `playCard`, `drawCard`, `nextPlayer` (pure, illegal moves throw).
  - `legal.ts` — `legalMoves` (wild = 4 moves; draw only when nothing is playable).
  - `bot.ts` — `scoreMove` weights, `chooseMove` (levels `easy`, `medium`).
  - `sample.ts` — `determinize`: re-deal unseen cards to opponents (hidden-info guess).
  - `hard.ts` — `chooseHardMove`: determinization + rollouts (40 per move) + hash cache + weights + void guessing. ~3 ms per move.
  - `voids.ts` — `updateVoids`: remembers which colors a player lacked when they had to draw; `determinize` uses it to deal the unseen cards.
  - `cheat.ts` — `chooseCheatMove`: sees every real hand, draw pile order stays hidden (shuffled per simulation), 30 noise-free rollouts per move.
  - `ai.ts` — `Level` (`normal|hard`) and `pickMove`; normal = `hard.ts` sampling bot, hard = cheat bot. The app uses this, not `bot.ts` (easy/medium only serve as rollout policies).
- `src/game/useGame.ts` — React hook: holds `GameState`, runs bot turns (900 ms delay), uses `pickMove`, exposes `play`, `draw`, `restart`. Human is seat 0.
- `src/components/CardView.tsx/.css` — one card, drawn with CSS (no downloaded art). `playable` true/false/undefined = highlight/dim/neutral.
- `src/App.tsx` — shell: shows `StartScreen` until a game is configured, then `Table`.
- `src/components/StartScreen.tsx/.css` — pick 1..6 bots and level (default 3 bots, Normal, Hard).
- `src/components/Table.tsx/.css` — table: opponents, piles, hand, Wild color picker, Seven-O target picker, UNO button (human has 2 cards), notice banner, "Draw +N" stack label, win dialog, Menu button. Casino look is pure CSS (felt gradient, wood and gold rail via inset shadows).
- `src/game/useCardAnimations.ts` — GSAP deal/play/draw animations. Reads DOM markers `data-draw`, `data-top`, `data-seat`, `.hand`, `.opponent`, `.card`.
- Rules (`Rules` in `state.ts`): `stacking`, `sevenO`, `drawUntilPlay`, `unoPenalty`. `DEFAULT_RULES` = stacking + UNO penalty; `CLASSIC_RULES` = only UNO penalty. `GameState.pendingDraw` is the open +2/+4 stack. Chosen on the start screen, passed App -> Table -> `useGame`.
- UNO call: `useGame` returns `unoCalled`, `callUno`, `notice`. Bots forget with chance `FORGET_CHANCE` (0.2); forgetting draws 2.
- `.github/workflows/deploy.yml` — test, build, deploy to Pages on push to `main`.

## Patterns
- Engine is pure and takes an `Rng` (`() => number`) so tests can be seeded.
- The animation layer (PixiJS + GSAP) only reads state changes; it never holds rules.
- `vite.config.ts` sets `base: '/uno-game/'` only when `GITHUB_ACTIONS` is set.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (run once)
- `npm run build` — typecheck + build
- `npx tsc -p tsconfig.app.json --noEmit` — typecheck only

## Gotchas
- The company npm registry (JFrog) token in `~/.npmrc` can expire (E401). For this personal repo use
  `npm_config_userconfig=/dev/null npm_config_registry=https://registry.npmjs.org/ npm <cmd>`.
- Ollama output may include a stray `javascript` line from a fence; strip it before saving.
- Benchmark (4 players, 80 games vs 3 medium bots, fair share 25%): normal ~26% (no better than medium: UNO is mostly luck), hard (cheat) ~54%.
