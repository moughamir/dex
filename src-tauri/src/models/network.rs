//! Network wire models: adapters, connections and traffic statistics.

use serde::{Deserialize, Serialize};

/// A network adapter as reported to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterInfo {
    pub id: String,
    pub interface: String,
    pub name: String,
    pub mac_address: Option<String>,
    pub kind: String,
    pub state: String,
    pub speed_mbps: Option<u32>,
    pub driver: Option<String>,
    pub enabled: bool,
    pub ipv4: Vec<String>,
    pub ipv6: Vec<String>,
    pub gateway: Option<String>,
    pub dns: Vec<String>,
    pub routes: Vec<NetworkRoute>,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_rate: u64,
    pub tx_rate: u64,
}

/// A routing entry attached to an adapter.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRoute {
    pub destination: String,
    pub gateway: Option<String>,
    pub netmask: Option<String>,
    pub interface: String,
}

/// An active network connection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectionInfo {
    pub id: String,
    pub name: String,
    pub adapter_id: String,
    pub state: String,
    pub ipv4: Option<String>,
    pub ipv6: Option<String>,
    pub gateway: Option<String>,
    pub dns: Vec<String>,
    pub ssid: Option<String>,
    pub signal_strength: Option<u8>,
}

/// Aggregate network traffic totals.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct NetworkTotals {
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_rate: u64,
    pub tx_rate: u64,
}

/// Per-interface traffic statistics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerAdapterStats {
    pub interface: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_rate: u64,
    pub tx_rate: u64,
}

/// Full network statistics snapshot.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct NetworkStatistics {
    pub total: NetworkTotals,
    pub per_adapter: Vec<PerAdapterStats>,
}