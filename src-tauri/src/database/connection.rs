//! SQLite connection lifecycle: open/create the database file and apply
//! per-connection pragmas. The connection is a single writer owned by Rust
//! (ADR-0001); WAL journal mode keeps readers concurrent with that writer.

use std::path::Path;

use rusqlite::Connection;

use crate::utils::errors::AppError;

/// Opens (creating if needed) the SQLite database at `path`.
///
/// Applies `journal_mode = WAL` and `foreign_keys = ON` on every open so
/// all connections behave identically regardless of how or when the file
/// was created.
pub fn open(path: &Path) -> Result<Connection, AppError> {
    let connection = Connection::open(path)?;
    connection.pragma_update(None, "journal_mode", "WAL")?;
    connection.pragma_update(None, "foreign_keys", "ON")?;
    Ok(connection)
}
