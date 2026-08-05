use serde::{Deserialize, Serialize};

use super::{
    modem::ModemState,
    signal::SignalQuality,
    sim::SimState,
};

/// Events emitted by the ModemProvider.
///
/// These events are published on the DEX event bus and consumed
/// by widgets and application services.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModemEvent {
    ModemAdded(ModemAddedEvent),

    ModemRemoved {
        modem_id: String,
    },

    ModemStateChanged(ModemStateChangedEvent),

    SignalChanged(SignalChangedEvent),

    OperatorChanged(OperatorChangedEvent),

    TechnologyChanged(TechnologyChangedEvent),

    SimInserted(SimInsertedEvent),

    SimRemoved {
        modem_id: String,
    },

    SimStateChanged(SimStateChangedEvent),

    Connected {
        modem_id: String,
    },

    Disconnected {
        modem_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModemAddedEvent {
    pub modem_id: String,
    pub manufacturer: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModemStateChangedEvent {
    pub modem_id: String,
    pub previous: ModemState,
    pub current: ModemState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalChangedEvent {
    pub modem_id: String,
    pub signal: SignalQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorChangedEvent {
    pub modem_id: String,
    pub previous: Option<String>,
    pub current: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechnologyChangedEvent {
    pub modem_id: String,
    pub previous: String,
    pub current: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimInsertedEvent {
    pub modem_id: String,
    pub sim_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimStateChangedEvent {
    pub modem_id: String,
    pub previous: SimState,
    pub current: SimState,
}
