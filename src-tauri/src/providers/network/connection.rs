use serde::{Deserialize, Serialize};

/// Active network connection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NetworkConnection {
    /// Stable identifier.
    pub id: String,

    /// Connection name.
    pub name: String,

    /// Associated adapter identifier.
    pub adapter_id: String,

    /// Current state.
    pub state: ConnectionState,

    /// IPv4 address.
    pub ipv4: Option<String>,

    /// IPv6 address.
    pub ipv6: Option<String>,

    /// Gateway.
    pub gateway: Option<String>,

    /// DNS servers.
    pub dns: Vec<String>,

    /// SSID (Wi-Fi only).
    pub ssid: Option<String>,

    /// Signal strength (0–100).
    pub signal_strength: Option<u8>,
}

impl NetworkConnection {
    #[must_use]
    pub fn new(
        id: impl Into<String>,
        adapter_id: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            name: String::new(),
            adapter_id: adapter_id.into(),
            state: ConnectionState::Disconnected,
            ipv4: None,
            ipv6: None,
            gateway: None,
            dns: Vec::new(),
            ssid: None,
            signal_strength: None,
        }
    }

    #[must_use]
    pub fn is_connected(&self) -> bool {
        self.state == ConnectionState::Connected
    }

    #[must_use]
    pub fn is_connecting(&self) -> bool {
        self.state == ConnectionState::Connecting
    }

    #[must_use]
    pub fn has_ipv4(&self) -> bool {
        self.ipv4.is_some()
    }

    #[must_use]
    pub fn has_ipv6(&self) -> bool {
        self.ipv6.is_some()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConnectionState {
    Unknown,
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Failed,
}
