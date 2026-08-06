//! Modem wire models: modem, SIM and bearer information.

use serde::{Deserialize, Serialize};

/// A cellular modem as reported to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModemInfo {
    pub id: String,
    pub manufacturer: String,
    pub model: String,
    pub device: String,
    pub imei: Option<String>,
    pub operator: Option<String>,
    pub technology: String,
    pub state: String,
    pub signal: ModemSignal,
    pub sim: Option<SimInfo>,
    pub bearer: Option<ModemBearer>,
    pub registered: bool,
}

/// Radio signal quality of a modem.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModemSignal {
    pub quality: u8,
    pub rssi: Option<i32>,
    pub rsrp: Option<i32>,
    pub rsrq: Option<i32>,
    pub sinr: Option<i32>,
}

/// A SIM card inserted in a modem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimInfo {
    pub iccid: Option<String>,
    pub imsi: Option<String>,
    pub operator: Option<String>,
    pub mcc: Option<String>,
    pub mnc: Option<String>,
    pub number: Option<String>,
    pub state: String,
}

/// An active data bearer (PDP context) on a modem.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModemBearer {
    pub apn: Option<String>,
    pub ipv4: Option<String>,
    pub ipv6: Option<String>,
}