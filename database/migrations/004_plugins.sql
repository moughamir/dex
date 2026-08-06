-- 004_plugins.sql — installed plugin registry.
CREATE TABLE IF NOT EXISTS plugins (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    version     TEXT,
    description TEXT,
    enabled     INTEGER NOT NULL DEFAULT 1,
    installed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
