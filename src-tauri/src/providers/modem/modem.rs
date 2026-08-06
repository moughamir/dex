use serde::{Deserialize, Serialize};

use super::signal::SignalQuality;

/// Physical cellular modem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Modem {
    /// Stable identifier (typically the ModemManager object path).
    pub id: String,

    /// Manufacturer.
    pub manufacturer: String,

    /// Model.
    pub model: String,

    /// Device name.
    pub device: String,

    /// IMEI.
    pub imei: Option<String>,

    /// Active operator.
    pub operator: Option<String>,

    /// Current access technology.
    pub technology: AccessTechnology,

    /// Registration state.
    pub state: ModemState,

    /// Signal quality.
    pub signal: SignalQuality,

    /// Whether a SIM is present.
    pub sim_present: bool,
}

impl Modem {
    #[must_use]
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            manufacturer: String::new(),
            model: String::new(),
            device: String::new(),
            imei: None,
            operator: None,
            technology: AccessTechnology::Unknown,
            state: ModemState::Unknown,
            signal: SignalQuality::default(),
            sim_present: false,
        }
    }

    #[must_use]
    pub fn is_connected(&self) -> bool {
        self.state == ModemState::Connected
    }

    #[must_use]
    pub fn is_registered(&self) -> bool {
        matches!(self.state, ModemState::Registered | ModemState::Connected)
    }

    #[must_use]
    pub fn has_sim(&self) -> bool {
        self.sim_present
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModemState {
    Unknown,
    Disabled,
    Initializing,
    Searching,
    Registered,
    Connecting,
    Connected,
    Disconnecting,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccessTechnology {
    Unknown,
    Gsm,
    Gprs,
    Edge,
    Umts,
    Hspa,
    HspaPlus,
    Lte,
    Nr5g,
}
