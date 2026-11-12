-- Chess Coach — initial schema (Phase 0)
-- Applied by `npm run db:migrate` (server/migrate.mjs). Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS games (
  id           BIGSERIAL PRIMARY KEY,
  played_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  player_color CHAR(1)     NOT NULL CHECK (player_color IN ('w', 'b')),
  result       TEXT        NOT NULL,  -- 'player_win' | 'computer_win' | 'draw' | 'player_resigned' | 'unfinished'
  pgn          TEXT        NOT NULL,
  final_fen    TEXT        NOT NULL,
  move_count   INT         NOT NULL CHECK (move_count >= 0)
);

CREATE INDEX IF NOT EXISTS games_played_at_idx ON games (played_at DESC);
