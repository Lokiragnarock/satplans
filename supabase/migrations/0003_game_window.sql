-- 0003_game_window.sql
-- Adds the game window to a group.
--   starts_at       when the game opens (null means the admin has not set it yet, so the game is locked)
--   duration_hours  how long the game runs after starts_at (default 24, 1 to 168)
--   target_hours    the single pooled hours goal for the window (null means use duration_hours)
-- Before starts_at and after starts_at + duration_hours the app is view only. The lock is enforced
-- in the server actions (lib/game.ts requireLive), not in SQL. Safe to run more than once.

alter table groups
  add column if not exists starts_at timestamptz,
  add column if not exists duration_hours int not null default 24 check (duration_hours between 1 and 168),
  add column if not exists target_hours int check (target_hours is null or target_hours between 1 and 10000);
