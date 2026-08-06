use serde::{Deserialize, Serialize};

/// A single IPv4/IPv6 route attached to an adapter.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NetworkRoute {
    /// Destination network (e.g. "0.0.0.0" for the default route).
    pub destination: String,

    /// Next-hop gateway, if any.
    pub gateway: Option<String>,

    /// Network mask (IPv4 only).
    pub netmask: Option<String>,

    /// Interface the route is bound to.
    pub interface: String,
}

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

    /// Assigned IPv4 addresses.
    pub ipv4: Vec<String>,

    /// Assigned IPv6 addresses.
    pub ipv6: Vec<String>,

    /// Default gateway.
    pub gateway: Option<String>,

    /// DNS servers.
    pub dns: Vec<String>,

    /// Routing table entries.
    pub routes: Vec<NetworkRoute>,

    /// Whether the interface is administratively enabled.
    pub enabled: bool,
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
            ipv4: Vec::new(),
            ipv6: Vec::new(),
            gateway: None,
            dns: Vec::new(),
            routes: Vec::new(),
            enabled: false,
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
#[serde(rename_all = "snake_case")]
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
#[serde(rename_all = "snake_case")]
pub enum NetworkAdapterState {
    Unknown,
    Disabled,
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Failed,
}

impl NetworkAdapterState {
    /// Returns the lowercase snake_case wire representation.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Unknown => "unknown",
            Self::Disabled => "disabled",
            Self::Disconnected => "disconnected",
            Self::Connecting => "connecting",
            Self::Connected => "connected",
            Self::Disconnecting => "disconnecting",
            Self::Failed => "failed",
        }
    }
}
