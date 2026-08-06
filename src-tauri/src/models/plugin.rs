//! Plugin wire models: installed plugin info and status.

use serde::{Deserialize, Serialize};

/// A plugin as reported to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: Option<String>,
    pub description: Option<String>,
    pub enabled: bool,
    pub status: PluginStatus,
    pub error: Option<String>,
}

/// Lifecycle status of a plugin (wire snake_case).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PluginStatus {
    Installed,
    Enabled,
    Disabled,
    Error,
}