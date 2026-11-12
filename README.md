# Black Heron — Chess Coach

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Engine](https://img.shields.io/badge/Engine-Stockfish%2019%20WASM-b58863)](https://stockfishchess.org)
[![Tests](https://img.shields.io/badge/tests-Vitest%2038%20passing-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev)

A chess teaching web app built from scratch in phases. **Human vs computer only** — there is
no two-player mode, and the board never lets one person move both sides.

This README is the comprehensive project document: the final vision, the architecture, what
is built so far, and how to run it.

---

## 1. The vision

A personal chess coach in the browser:

1. **Playground** — play against Stockfish at selectable difficulty levels, choose your
   color, and play with a clock.
2. **Playing styles** — aggressive like Tal vs principled like Fischer, created with
   MultiPV move selection and per-style opening books.
3. **Coach** — explains the best move and *why*, why the opponent played their move, and
   what to expect in the line (rule-based templates first, LLM phrasing last).
4. **Game review** — move ratings (Brilliant, Great, Best, Excellent, Good, Inaccuracy,
   Mistake, Blunder), accuracy percentages, and an evaluation graph.
5. **Puzzles** — unlimited puzzles from the Lichess puzzle database (CC0), filterable by
   theme and difficulty, with an adaptive rating.
6. **Opening trainer** — repertoires (Caro-Kann, London, English, ...) from the Lichess
   openings data, drilled with spaced repetition.
7. **Board & interface** — drag & drop, right-click arrows and circles, custom themes.
8. **Accounts & progress** (optional, later) — saved games and stats in PostgreSQL.

**The LLM explainer is the LAST phase.** No AI/LLM/API keys before then. The engine
supplies the facts; the LLM only phrases them — it never picks the move.

---

## 2. Status

| Phase | Status |
| --- | --- |
| 0 Setup (Vite + React + TS, Tailwind, Zustand, Vitest, chess.js, chessground, PostgreSQL) | done |
| 1 Board and rules (human vs computer, promotion, check/mate/draw, undo, resign) | done |
| 2 Stockfish evaluation (WASM, single-threaded lite build, Web Worker, UCI wrapper) | done |
| 3 Play vs bot at levels (8 Lichess-style levels) | done |
| 4 Game review and move ratings (win% -> labels, accuracy, eval graph) | done |
| 5 Playing styles (MultiPV Tal/Fischer/Karpov selector) | done |
| 6 Rule-based coach (precise feature detection + templated phrasing) | done |
| 7 Puzzles — live from the Lichess API, streaks, hints, theme/difficulty filters | done |
| 8 Opening trainer — 60+ ECO lines, drill mode with feedback and progress | done |
| 9 LLM explanations (needs an API key, server-side only) | next |
| 10 Polish and deploy (piece sets, sounds, light/dark, PWA) | |

---

## 3. What the app does today

- **Play against Stockfish** (WASM, single-threaded lite build) running in a **Web
  Worker**, behind a clean `getComputerMove(fen)` interface. If the engine fails to boot,
  the bot falls back to random legal moves so the game never stalls.
- **8 difficulty levels** (Lichess-style ladder) named after casual opponents and famous
  players — Mark (~600) up to Magnus Carlsen (~2882). Lower levels think shallowly and
  pick randomly among their best few moves; each bot has an avatar and an Elo rating.
- **Player bars**: editable name, bot avatar + Elo, captured pieces and material
  advantage (+N), thinking indicator.
- **Abort** (X icon, before both players moved), **Resign** (flag icon), **Undo** (takes
  back your move *and* the computer's reply, and revives a lost game), New game as
  White/Black.
- **Move navigation**: first/prev/next/last buttons and Left/Right/Home/End keys; the
  board locks while viewing history and unlocks at the live position.
- **Settings** (gear icon, chess.com-style): board theme grid with a checkmark,
  coordinates with **Inside/Outside placement**, highlight last move, legal-move dots,
  move animation, always-queen promotion. Persisted to localStorage.
- **Right-click arrows and circles** in a custom SVG layer — **piece-aware**: knight
  arrows bend along the jump, rook/bishop/queen arrows snap onto their legal move lines
  (rank/file/diagonal), king/pawn/empty squares draw freely; left-click clears.
- Custom scrollbar on the move list; **five tabs**: **Play** (board + controls),
  **Coach** (board + the live coach), **Puzzles**, **Openings**, **Opponents**.
- **Puzzles (Phase 7)** — unlimited puzzles fetched live from the Lichess puzzle API
  (public, CC0 data): pick a difficulty target and a tactical theme (mate, fork, pin,
  skewer, hanging piece, sacrifice, endgame, trapped piece…), solve on a dedicated board,
  **streak + best streak + solved counters** (persisted), and live hints (using a hint
  keeps the streak honest).
- **Opening trainer (Phase 8)** — a **60+ entry ECO library** (Nimzo-Larsen to King's
  Indian, mainstream theory) with search and spaced-repetition-lite prioritisation:
  drill a line, the app plays the other side, wrong moves get feedback, and progress
  (drilled/correct/wrong/streak) is tracked per opening.
- **Opponents tab (Phase 5)** — **100+ opponents**: real players with accurate ratings
  (Carlsen 2882, Kasparov 2851, Caruana 2842, Hikaru, Polgár, Capablanca, Tal, Morphy…)
  plus fictional club personas across every rating band, each with a playing trait
  (attacking / solid / principled / creative / universal) that drives the move-selection
  rule, and UCI Skill Level + depth derived from the rating.
- **Piece sets** — choose Classic (cburnett SVG), Text (Unicode glyphs) or Contrast
  (high-contrast filter) in the settings.
- **Elaborate settings** — board themes, coordinates with Inside/Outside placement, piece
  sets, legal-move dots, animation, live coach, auto-queen — all persisted.
- **Game review (Phase 4)**: one button analyses every position with Stockfish, converts
  evaluations to win% (Lichess model) and labels each move — Brilliant (near-best
  sacrifice), Great (near-best only-move), Best, Excellent, Good, Inaccuracy, Mistake,
  Blunder — with **per-player accuracy** and a clickable **evaluation graph**; click any
  move or point on the graph to jump to that position.
- **Playing styles (Phase 5)**: a style selector next to the level picker — **Balanced**
  (level behaviour), **Fischer (principled)** — always the engine's top move, **Tal
  (attacking)** — accepts up to ~0.6 pawns of eval for checks, captures and sacrifices,
  **Karpov (solid)** — stays within ~0.15 pawns of best and prefers quiet play. The level
  still controls strength; the style shapes *which* candidate move is chosen.
- **Rule-based coach (Phase 6)** — live, precise, no AI. A self-contained attack scanner
  computes every piece's attacks from the board (pinned pieces included), powering exact
  detections: **hanging pieces** (undefended, or attacked by a cheaper piece), **absolute
  pins** to your king, **forks** that actually win material, **mate threats** from the
  engine, and **king-zone pressure**. The coach phrases the best move ("Try Nf3 — Develop
  the knight", "Win the queen on d4 — it was undefended"), tells the story of the last
  move (quality from the win% model + new threats + the stronger alternative), warns when
  *your* move dropped winning chances, and draws the engine's expected line as **blue
  arrows** on the board. Every rule is unit-tested with crafted positions.

---

## 4. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build tool | Vite + React + TypeScript | fast dev loop, typed UI |
| Rules & PGN | chess.js | legal moves, SAN, FEN, game-end detection |
| Board | chessground (Lichess) | drag & drop, animations, GPL-3 like the app |
| Engine | stockfish npm package — WASM single-threaded lite build (stockfish-19-lite-single) in a Web Worker | no server needed, UI never freezes |
| State | Zustand | game store + persisted settings store |
| Styling | Tailwind CSS | themes, custom arrows layer, scrollbar |
| Tests | Vitest | 66+ unit tests on rules, engine ladder, review math, styles, coach detections |
| Storage | local PostgreSQL (own cluster, port 5433) | saved games, puzzles, review data (later phases) |
| Lichess API | personal token, **server-side only** (.env -> server/lichess.mjs) | puzzles/explorer data for later phases |

**Free data used (planned):** Lichess puzzle database (CC0), Lichess game database, the
lichess-org/chess-openings repo (ECO codes/names), the opening explorer API, Syzygy
tablebases for endgames. Stockfish, chess.js and chessground need no API key.

---

## 5. Run it

```bash
npm install
npm run db:start     # once per reboot — starts the local PostgreSQL cluster
npm run db:migrate   # idempotent; applies server/schema.sql
npm run dev          # -> http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in dev mode |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run build` | Type-check + production build |
| `npm run db:start` / `db:stop` / `db:status` | Control the project's PostgreSQL cluster |
| `npm run db:migrate` | Apply `server/schema.sql` |
| `npm run db:check` | Connection + schema smoke check |
| `npm run lichess:check` | Verify the Lichess token (server-side) |

**How to check it works:** type your name in the bottom bar, pick a bot level, and play a
game — drag pieces (only your color moves; the board locks while the bot thinks), watch
the captured pieces and material score, try Undo/Abort/Resign, step back and forward
through the game, right-click a knight and a bishop to see the piece-aware arrows, and
open the settings gear to change themes and coordinate placement. `npm test` and
`npm run build` should stay green.

---

## 6. Folder structure

```
src/engine/      UCI wrapper (uciEngine), difficulty ladder (levels), opponent behind
                 getComputerMove(fen, level) with a random-legal fallback
src/game/        pure chess.js helpers: destinations, status, promotion, undo,
                 captured-material, position-at-ply for navigation
src/components/  React UI: board, arrows layer, player bars, controls, move nav/list,
                 settings panel, promotion dialog, nav rail
src/store/       Zustand: gameStore (rules + UI state), settingsStore (persisted prefs)
server/          PostgreSQL (schema, migrate, check, start/stop) + Lichess helper
public/engine/   Stockfish WASM build served to the Web Worker
```

---

## 7. Storage (PostgreSQL)

The project runs its **own local PostgreSQL cluster**, created from the PostgreSQL 18
binaries already installed on this machine, so the service already listening on port 5432
is never touched.

- Data directory: `.pgdata/` (gitignored) - Port: **5433** - Database: `chess_coach`
- Trust authentication — local development only, no password needed
- Connection string lives in `.env` as `DATABASE_URL` (gitignored; see `.env.example`)
- Start it: `npm run db:start`, then `npm run db:migrate`, then verify with `npm run db:check`

The UI does not use the database yet — later phases store finished games (and, in the
review phase, per-move ratings) through it.

---

## 8. Lichess API (for later phases)

A personal access token lives in `.env` as `LICHESS_API_TOKEN` and is used **only by
`server/lichess.mjs`** — never in frontend code (project rule: no secrets in the browser).
Verify it with `npm run lichess:check`. The puzzle database and openings repo need no
token; the explorer/game APIs may rate-limit anonymous requests.

---

## 9. How the hard parts will work (design notes)

- **Move classification (Phase 4):** engine evaluations -> win probability with
  `win% = 50 + 50 * (2 / (1 + e^(-0.00368208 * cp)) - 1)` -> loss vs the best move maps to
  Best / Excellent / Good / Inaccuracy / Mistake / Blunder. "Brilliant" = a sacrifice that
  stays near-best; "Great" = the only good move. Accuracy per game follows from the
  average win% retention.
- **Playing styles (Phase 5):** request MultiPV 3-5 and pick among the candidates with a
  style rule (Tal: accept small eval loss for checks/sacrifices near the enemy king;
  Fischer: near-always the top move), plus per-style opening books.
- **Coach (Phase 6):** detect features from the best line (captures, forks, pins, hanging
  pieces, mate threats, king safety) and phrase them with templates. The LLM (Phase 9)
  only rephrases the same grounded data, server-side, with a cache.
- **Licenses:** Stockfish and chessground are GPL-3.0 — fine for learning and an
  open-source release; check before selling. chess.com's design, pieces and sounds are
  proprietary — never used here.
