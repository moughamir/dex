-- 001_init.sql — M0.6 initial schema (migration skeleton).
--
-- The schema lives in database/migrations/ (ADR-0001): this file is the
-- source of truth for the initial schema. Migrations are append-only —
-- a committed migration is never edited; every schema change is a new
-- numbered file applied in order.
--
-- `PRAGMA journal_mode = WAL;` is a persistent database property. It is
-- declared here for documentation and standalone execution; the connection
-- layer also applies it on every open so WAL is active even before any
-- migration has run.
PRAGMA journal_mode = WAL;

-- Tracks applied migrations. The Rust migrations runner inserts one row per
-- applied migration (in order) and skips versions that are already present,
-- which is what makes initialization idempotent across app restarts.
CREATE TABLE IF NOT EXISTS schema_version (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
