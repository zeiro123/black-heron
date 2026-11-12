# Chess Coach

A chess teaching web app built from scratch in phases. **Human vs computer only** — there is
no two-player mode, and the board never lets one person move both sides.

## Stack

- **Build tool:** Vite + React + TypeScript
- **Rules and PGN:** chess.js
- **Board:** chessground (the Lichess board: drag & drop, arrows, circles, animations)
- **Engine:** the stockfish npm package — WASM, single-threaded lite build (`stockfish-19-lite-single`) in a Web Worker ✅
- **State:** Zustand (game state + persisted settings)
- **Styling:** Tailwind CSS (board themes, custom scrollbar, arrows layer)
- **Tests:** Vitest
- **Storage:** local PostgreSQL (its own cluster on port 5433)
- **Lichess API:** personal token, server-side only (`.env` → `server/lichess.mjs`)
- **Requires:** Node.js 20+ and Git

## Run it

```bash
npm install
npm run dev          # → http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in dev mode |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run build` | Type-check + production build |
| `npm run db:start` / `db:stop` / `db:status` | Control the project's PostgreSQL cluster |
| `npm run db:migrate` | Apply `server/schema.sql` to the database |
| `npm run db:check` | Connection + schema smoke check |

## Phases

0 Setup ✅ · 1 Board and rules (human vs computer) ✅ · 2 Stockfish evaluation ✅ ·
**3 Play vs bot at levels ✅** · 4 Game review and move ratings · 5 Playing styles ·
6 Rule-based coach · 7 Puzzles · 8 Opening trainer · 9 LLM explanations (last — no
AI/LLM/API keys before then) · 10 Polish and deploy

## What the app does today

- Play against **Stockfish** (WASM, in a Web Worker) at **8 Lichess-style difficulty
  levels**, each with its own bot name and rating — lower levels think shallowly and pick
  randomly among their best few moves.
- Player bars with **editable name**, bot name/icon, **captured pieces and material
  advantage (+N)**, thinking indicator.
- **Abort** (before both players have moved), **Resign**, **Undo** (your move + the
  computer's reply), New game as White/Black.
- **Move navigation** (⏮ ◀ ▶ ⏭ buttons and ←/→/Home/End keys) that steps the board
  through the game; the board locks while viewing history.
- **Settings** (gear icon): legal-move dots, coordinates, last-move highlight, move
  animation, auto-queen, and 4 board themes (persisted to localStorage).
- **Right-click arrows and circles** drawn in a custom SVG layer — **knight arrows bend
  along the piece's path**; left-click clears.
- Custom scrollbar on the move list; placeholder tabs for future phases.

## Folder structure

```
src/engine/      computer opponent behind getComputerMove(fen) — Stockfish plugs in here (Phase 2)
src/game/        pure chess.js helpers (destinations, status, promotion, undo logic)
src/components/  React UI (board, move list, controls, status bar, promotion dialog)
src/store/       Zustand game state
server/          PostgreSQL scripts (schema, migrate, check, start/stop)
```

## Storage (PostgreSQL)

The project runs its **own local PostgreSQL cluster**, created from the PostgreSQL 18
binaries already installed on this machine, so the service already listening on port 5432
is never touched.

- Data directory: `.pgdata/` (gitignored) · Port: **5433** · Database: `chess_coach`
- Trust authentication — local development only, no password needed
- Connection string lives in `.env` as `DATABASE_URL` (gitignored; see `.env.example`)
- Start it: `npm run db:start`, then `npm run db:migrate`, then verify with `npm run db:check`

The UI does not use the database yet — later phases store finished games (and, in the
review phase, per-move data) through it.

## License note

chessground and Stockfish are GPL-3.0 licensed — fine for learning and for an open-source
release, but check before selling the app.
