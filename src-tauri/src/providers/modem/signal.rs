use serde::{Deserialize, Serialize};

/// Cellular signal quality.
///
/// Values are normalized regardless of modem vendor.
/// Raw values (RSSI, RSRP, RSRQ, SINR) are preserved when available.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SignalQuality {
    /// Percentage (0-100).
    pub quality: u8,

    /// RSSI (dBm).
    pub rssi: Option<i32>,

    /// RSRP (dBm).
    pub rsrp: Option<i32>,

    /// RSRQ (dB).
    pub rsrq: Option<i32>,

    /// SINR (dB).
    pub sinr: Option<i32>,
}

impl SignalQuality {
    #[must_use]
    pub fn new(quality: u8) -> Self {
        Self {
            quality: quality.min(100),
            rssi: None,
            rsrp: None,
            rsrq: None,
            sinr: None,
        }
    }

    #[must_use]
    pub fn is_available(&self) -> bool {
        self.quality > 0
    }

    #[must_use]
    pub fn bars(&self) -> u8 {
        match self.quality {
            0..=5 => 0,
            6..=25 => 1,
            26..=50 => 2,
            51..=75 => 3,
            76..=90 => 4,
            _ => 5,
        }
    }

    #[must_use]
    pub fn strength(&self) -> SignalStrength {
        match self.quality {
            0..=5 => SignalStrength::None,
            6..=25 => SignalStrength::Poor,
            26..=50 => SignalStrength::Fair,
            51..=75 => SignalStrength::Good,
            76..=90 => SignalStrength::Excellent,
            _ => SignalStrength::Perfect,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignalStrength {
    None,
    Poor,
    Fair,
    Good,
    Excellent,
    Perfect,
}
