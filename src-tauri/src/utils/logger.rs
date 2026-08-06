//! Tracing facade for the Rust backend.
//!
//! Initializes a `tracing_subscriber` writer once (idempotent) and exposes
//! thin `log_*` helpers that delegate to the corresponding `tracing` macros.
//! The frontend has its own logger (`core/utils/logger.ts`); this is the
//! Rust-side counterpart.

use std::sync::OnceLock;

/// Guards `tracing_subscriber` initialization so it happens exactly once,
/// even if `init` is called from multiple code paths.
static INIT: OnceLock<()> = OnceLock::new();

/// Initializes the tracing subscriber (idempotent).
///
/// Subsequent calls are no-ops. The subscriber writes formatted logs to
/// stdout at `TRACE` level and above.
pub fn init() {
    INIT.get_or_init(|| {
        tracing_subscriber::fmt()
            .with_max_level(tracing::Level::TRACE)
            .init();
    });
}

/// Logs a message at `TRACE` level.
pub fn log_trace(message: &str) {
    tracing::trace!("{message}");
}

/// Logs a message at `DEBUG` level.
pub fn log_debug(message: &str) {
    tracing::debug!("{message}");
}

/// Logs a message at `INFO` level.
pub fn log_info(message: &str) {
    tracing::info!("{message}");
}

/// Logs a message at `WARN` level.
pub fn log_warn(message: &str) {
    tracing::warn!("{message}");
}

/// Logs a message at `ERROR` level.
pub fn log_error(message: &str) {
    tracing::error!("{message}");
}
