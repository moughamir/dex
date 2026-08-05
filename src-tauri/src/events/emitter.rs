//! The single Rust-side event emitter.
//!
//! Wraps a Tauri `AppHandle` and exposes `emit` for serializable payloads.
//! Emit failures are logged, never panicked on: the sampling loop keeps
//! running even if the frontend has no listener for an event.

use serde::Serialize;

use crate::utils::logger;

/// Emits Rust → UI events over the Tauri event bus.
#[derive(Clone)]
pub struct Emitter {
    app: tauri::AppHandle,
}

impl Emitter {
    /// Creates an emitter bound to the given app handle.
    #[must_use]
    pub fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }

    /// Emits `name` with the serialized `payload` to all listeners.
    ///
    /// Failures (e.g. an invalid event name) are logged and swallowed so the
    /// caller never panics or aborts the sampling loop.
    pub fn emit<S: serde::Serialize + Clone>(&self, name: &str, payload: &S) {
        if let Err(error) = self.app.emit(name, payload.clone()) {
            logger::log_warn(&format!("failed to emit event '{name}': {error}"));
        }
    }

    /// Returns the underlying app handle.
    #[must_use]
    pub fn app(&self) -> &tauri::AppHandle {
        &self.app
    }
}

/// Payload for the `dex.system.resources` event.
#[derive(Debug, Clone, Serialize)]
pub struct SystemResourcesEvent {
    pub cpu_percent: f32,
    pub memory: SystemMemoryEvent,
    pub uptime_secs: u64,
    pub generated_at: i64,
}

/// Memory portion of a system resources event.
#[derive(Debug, Clone, Serialize)]
pub struct SystemMemoryEvent {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
}

/// Payload for the `dex.system.battery` event.
#[derive(Debug, Clone, Serialize)]
pub struct BatteryEvent {
    pub percent: u8,
    pub charging: bool,
    pub remaining_secs: Option<u64>,
}