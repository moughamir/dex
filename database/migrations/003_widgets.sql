-- 003_widgets.sql — dashboard widget layout placements.
CREATE TABLE IF NOT EXISTS widget_layout (
    id          TEXT PRIMARY KEY,
    kind        TEXT NOT NULL,
    column_index INTEGER NOT NULL DEFAULT 0,
    row_index   INTEGER NOT NULL DEFAULT 0,
    width       INTEGER NOT NULL DEFAULT 1,
    height      INTEGER NOT NULL DEFAULT 1,
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
