//! Rust → UI event emission (ADR-0002 §5).
//!
//! Only this module emits events to the frontend. Event names follow the
//! `dex.<domain>.<event>` convention and are declared in the frontend `EVENTS`
//! registry in `core/api/events.ts`.

pub mod emitter;

pub use emitter::{BatteryEvent, Emitter, SystemMemoryEvent, SystemResourcesEvent};

/// Wire event name for the periodic system resources snapshot.
pub const SYSTEM_RESOURCES: &str = "dex.system.resources";

/// Wire event name for a battery state change.
pub const SYSTEM_BATTERY: &str = "dex.system.battery";