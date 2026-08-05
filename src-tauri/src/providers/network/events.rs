use serde::{Deserialize, Serialize};

/// Events emitted by the NetworkProvider.
///
/// These events are intended to be published on the DEX event bus
/// and consumed by widgets and application services.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkEvent {
    AdapterAdded(NetworkAdapterEvent),

    AdapterRemoved { adapter_id: String },

    AdapterStateChanged(NetworkAdapterStateChangedEvent),

    ConnectionEstablished(NetworkConnectionEvent),

    ConnectionLost { connection_id: String },

    ConnectionStateChanged(NetworkConnectionStateChangedEvent),

    StatisticsUpdated(NetworkStatisticsEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterEvent {
    pub adapter_id: String,
    pub interface: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterStateChangedEvent {
    pub adapter_id: String,
    pub previous: String,
    pub current: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectionEvent {
    pub connection_id: String,
    pub adapter_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnectionStateChangedEvent {
    pub connection_id: String,
    pub previous: String,
    pub current: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatisticsEvent {
    pub adapter_id: String,
    pub rx_rate: u64,
    pub tx_rate: u64,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
}
