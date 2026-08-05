//! Serde wire models shared with the frontend (ADR-0002).
//!
//! All structs are `Serialize + Deserialize + Clone + Debug` with serde
//! defaults (snake_case) as the wire authority. Provider enums are converted
//! to stable snake_case strings via the `state_str`/`health_str` helpers so
//! the wire values never depend on derived enum naming.

pub mod modem;
pub mod network;
pub mod process;
pub mod plugin;
pub mod settings;
pub mod system;
pub mod widget;

use crate::providers::{ProviderHealth, ProviderState};

/// Stable snake_case wire string for a provider lifecycle state.
pub(crate) fn state_str(state: ProviderState) -> String {
    match state {
        ProviderState::Created => "created",
        ProviderState::Registered => "registered",
        ProviderState::Initializing => "initializing",
        ProviderState::Running => "running",
        ProviderState::Stopping => "stopping",
        ProviderState::Stopped => "stopped",
    }
    .to_string()
}

/// Stable snake_case wire string for a provider health state.
pub(crate) fn health_str(health: ProviderHealth) -> String {
    match health {
        ProviderHealth::Unknown => "unknown",
        ProviderHealth::Initializing => "initializing",
        ProviderHealth::Ready => "ready",
        ProviderHealth::Busy => "busy",
        ProviderHealth::Degraded => "degraded",
        ProviderHealth::Unavailable => "unavailable",
        ProviderHealth::Failed => "failed",
    }
    .to_string()
}