use serde::{Deserialize, Serialize};

/// Physical or virtual network interface.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NetworkAdapter {
    /// Stable identifier (NetworkManager object path, interface name, etc.)
    pub id: String,

    /// Linux interface name.
    pub interface: String,

    /// Human-readable name.
    pub name: String,

    /// Hardware MAC address.
    pub mac_address: Option<String>,

    /// Adapter type.
    pub kind: NetworkAdapterKind,

    /// Administrative state.
    pub state: NetworkAdapterState,

    /// Link speed (Mbps).
    pub speed_mbps: Option<u32>,

    /// Driver name.
    pub driver: Option<String>,
}

impl NetworkAdapter {
    #[must_use]
    pub fn new(
        id: impl Into<String>,
        interface: impl Into<String>,
        kind: NetworkAdapterKind,
    ) -> Self {
        Self {
            id: id.into(),
            interface: interface.into(),
            name: String::new(),
            mac_address: None,
            kind,
            state: NetworkAdapterState::Unknown,
            speed_mbps: None,
            driver: None,
        }
    }

    #[must_use]
    pub fn is_connected(&self) -> bool {
        matches!(self.state, NetworkAdapterState::Connected)
    }

    #[must_use]
    pub fn is_wireless(&self) -> bool {
        matches!(self.kind, NetworkAdapterKind::Wireless)
    }

    #[must_use]
    pub fn is_cellular(&self) -> bool {
        matches!(self.kind, NetworkAdapterKind::Cellular)
    }

    #[must_use]
    pub fn is_ethernet(&self) -> bool {
        matches!(self.kind, NetworkAdapterKind::Ethernet)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NetworkAdapterKind {
    Unknown,
    Ethernet,
    Wireless,
    Cellular,
    Bluetooth,
    Loopback,
    Virtual,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NetworkAdapterState {
    Unknown,
    Disabled,
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Failed,
}
