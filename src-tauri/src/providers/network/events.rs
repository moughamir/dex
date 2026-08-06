use serde::{Deserialize, Serialize};

use super::adapter::NetworkAdapterKind;

/// Events emitted by the NetworkProvider.
///
/// These events are intended to be published on the DEX event bus
/// and consumed by widgets and application services.
///
/// The payloads match the wire contract consumed by the frontend
/// (see `dex.network.*` event schemas).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkEvent {
    AdapterAdded(NetworkAdapterEvent),

    AdapterRemoved { interface: String },

    AdapterStateChanged(NetworkAdapterStateChangedEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterEvent {
    pub interface: String,
    pub name: String,
    pub kind: NetworkAdapterKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapterStateChangedEvent {
    pub interface: String,
    pub previous: String,
    pub current: String,
}
