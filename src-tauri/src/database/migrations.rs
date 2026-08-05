//! Idempotent migration runner.
//!
//! Migrations live in `database/migrations/NNN_<domain>.sql` and are
//! embedded at compile time, so the binary never depends on a runtime
//! filesystem layout (the app can run from any working directory, including
//! packaged installs). Applying a migration is transactional: the schema
//! change and its `schema_version` record commit together, and a failure
//! leaves the database untouched so the next start retries cleanly.

use rusqlite::Connection;

use crate::utils::errors::AppError;

/// Ordered, immutable migration list: `(name, sql)`.
///
/// Index + 1 is the version recorded in `schema_version`. Appending a
/// migration means adding a new `NNN_<domain>.sql` file and one tuple here —
/// committed migrations are never edited (ADR-0001).
const MIGRATIONS: &[(&str, &str)] = &[(
    "001_init",
    include_str!("../../../database/migrations/001_init.sql"),
)];

/// Applies all pending migrations to `connection`.
///
/// Skips versions already recorded in `schema_version`, so repeated calls
/// are no-ops.
pub fn apply(connection: &mut Connection) -> Result<(), AppError> {
    ensure_schema_version_table(connection)?;

    for (index, (name, sql)) in MIGRATIONS.iter().enumerate() {
        let version = index as i64 + 1;
        if is_applied(connection, version)? {
            continue;
        }
        apply_migration(connection, version, name, sql)?;
    }

    Ok(())
}

/// Creates the `schema_version` bookkeeping table if it does not exist.
///
/// Mirrors the definition in `001_init.sql`; `IF NOT EXISTS` keeps both
/// paths idempotent (fresh database via this runner, or via the migration
/// itself).
fn ensure_schema_version_table(connection: &Connection) -> Result<(), AppError> {
    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version    INTEGER PRIMARY KEY,
            name       TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );",
    )?;
    Ok(())
}

fn is_applied(connection: &Connection, version: i64) -> Result<bool, AppError> {
    let applied: i64 = connection.query_row(
        "SELECT COUNT(*) FROM schema_version WHERE version = ?1",
        [version],
        |row| row.get(0),
    )?;
    Ok(applied > 0)
}

fn apply_migration(
    connection: &mut Connection,
    version: i64,
    name: &str,
    sql: &str,
) -> Result<(), AppError> {
    let transaction = connection.transaction()?;
    transaction.execute_batch(sql)?;
    transaction.execute(
        "INSERT INTO schema_version (version, name) VALUES (?1, ?2)",
        rusqlite::params![version, name],
    )?;
    transaction.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use crate::database::init;

    /// A throwaway database path under the system temp dir. Never touches
    /// the repository's `database/dex.db`.
    fn temp_db_path() -> PathBuf {
        std::env::temp_dir().join(format!("dex_test_{}.db", uuid::Uuid::new_v4()))
    }

    fn schema_version_count(path: &std::path::Path) -> i64 {
        let connection = crate::database::connection::open(path).expect("reopen");
        connection
            .query_row("SELECT COUNT(*) FROM schema_version", [], |row| row.get(0))
            .expect("query schema_version")
    }

    /// Running init twice on the same file must be a no-op on the second
    /// call, and exactly one migration may ever be recorded.
    #[test]
    fn init_is_idempotent() {
        let path = temp_db_path();

        init(&path).expect("first init should succeed");
        init(&path).expect("second init should be a no-op");

        assert_eq!(schema_version_count(&path), 1);
        let _ = std::fs::remove_file(&path);
    }

    /// init against an already-initialized database (pre-existing
    /// `schema_version` row) must not re-apply or error.
    #[test]
    fn init_on_existing_database_is_a_noop() {
        let path = temp_db_path();

        init(&path).expect("first init should succeed");
        init(&path).expect("second init should be a no-op");

        let connection = crate::database::connection::open(&path).expect("reopen");
        let version: i64 = connection
            .query_row("SELECT version FROM schema_version", [], |row| row.get(0))
            .expect("read version");
        assert_eq!(version, 1);

        let _ = std::fs::remove_file(&path);
    }

    /// The migration creates the `schema_version` table with the WAL journal
    /// mode active on the file.
    #[test]
    fn init_creates_schema_version_and_wal_mode() {
        let path = temp_db_path();

        init(&path).expect("init should succeed");

        let connection = crate::database::connection::open(&path).expect("reopen");
        let journal_mode: String = connection
            .query_row("PRAGMA journal_mode", [], |row| row.get(0))
            .expect("read journal_mode");
        assert_eq!(journal_mode, "wal");

        let _ = std::fs::remove_file(&path);
    }
}
