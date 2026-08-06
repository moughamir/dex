//! Settings wire model persisted in the `settings` table.

use serde::{Deserialize, Serialize};

/// User-adjustable application settings.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Settings {
    pub refresh_interval_ms: u64,
    pub launch_on_start: bool,
    pub reduce_motion: bool,
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            refresh_interval_ms: 2000,
            launch_on_start: false,
            reduce_motion: false,
            theme: "dark".to_string(),
        }
    }
}