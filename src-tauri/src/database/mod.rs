//! SQLite access layer (rusqlite, bundled).
//!
//! Only Rust touches the database (ADR-0001): the frontend reaches data
//! exclusively through the typed IPC seam. The schema is defined by
//! `database/migrations/*.sql`; this module owns the connection and the
//! idempotent migration runner. `queries`, `repository` and `schema` join
//! as their owning roadmap milestone lands (M4.3 per docs/23_Database.md).

mod connection;
mod migrations;

use std::path::Path;

use crate::utils::errors::AppError;

/// Opens (creating if needed) the database at `db_path` and applies all
/// pending migrations in order.
///
/// Idempotent: migrations already recorded in `schema_version` are skipped,
/// so calling this more than once — or on an already-initialized database —
/// is a no-op. Invoked from the Tauri `.setup()` hook at startup.
pub fn init(db_path: &Path) -> Result<(), AppError> {
    let mut connection = connection::open(db_path)?;
    migrations::apply(&mut connection)
}
