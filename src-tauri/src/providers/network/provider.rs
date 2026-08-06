use std::collections::HashMap;
use std::path::Path;

use zvariant::OwnedObjectPath;

use crate::providers::dbus::{DbusConnection, DbusProxy};
use crate::providers::{Capability, Provider, ProviderError, ProviderHealth, ProviderState};

use super::adapter::{NetworkAdapter, NetworkAdapterKind, NetworkAdapterState, NetworkRoute};
use super::connection::{ConnectionState, NetworkConnection};
use super::errors::NetworkError;
use super::events::{NetworkAdapterEvent, NetworkAdapterStateChangedEvent, NetworkEvent};
use super::statistics::NetworkStatistics;

/// NetworkManager D-Bus well-known names.
const NM_DESTINATION: &str = "org.freedesktop.NetworkManager";
const NM_PATH: &str = "/org/freedesktop/NetworkManager";
const NM_INTERFACE: &str = "org.freedesktop.NetworkManager";
const NM_DEVICE_INTERFACE: &str = "org.freedesktop.NetworkManager.Device";
const NM_IP4_INTERFACE: &str = "org.freedesktop.NetworkManager.IP4Config";
const NM_IP6_INTERFACE: &str = "org.freedesktop.NetworkManager.IP6Config";
const NM_ACTIVE_INTERFACE: &str = "org.freedesktop.NetworkManager.Connection.Active";

/// Adapters and connections as reported by NetworkManager.
struct NmSnapshot {
    adapters: HashMap<String, NetworkAdapter>,
    connections: HashMap<String, NetworkConnection>,
}

/// Client for the NetworkManager D-Bus service.
///
/// Proxies are created fresh per call from the stored connection because
/// `zbus::Proxy` is lifetime-bound to the connection; this keeps the type
/// self-contained and cheap (proxy creation is a lightweight operation).
struct NetworkManagerClient {
    runtime: tokio::runtime::Runtime,
    conn: DbusConnection,
}

impl NetworkManagerClient {
    /// Creates a new client, connecting to the system bus.
    fn new() -> Result<Self, NetworkError> {
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .map_err(|error| NetworkError::Internal {
                reason: error.to_string(),
            })?;
        let conn = runtime
            .block_on(DbusConnection::system())
            .map_err(|error| NetworkError::Internal {
                reason: error.to_string(),
            })?;
        Ok(Self { runtime, conn })
    }

    /// Pulls a fresh snapshot of devices and active connections.
    fn refresh(&self) -> Result<NmSnapshot, NetworkError> {
        self.runtime.block_on(async {
            let manager = DbusProxy::new(&self.conn, NM_DESTINATION, NM_PATH, NM_INTERFACE).await?;
            let devices: Vec<OwnedObjectPath> = manager.call("GetDevices", &()).await?;

            let mut adapters = HashMap::new();
            let mut connections = HashMap::new();

            for device in devices {
                let device_path = device.as_str().to_string();
                let device_proxy = DbusProxy::new(
                    &self.conn,
                    NM_DESTINATION,
                    &device_path,
                    NM_DEVICE_INTERFACE,
                )
                .await?;

                let interface: String = device_proxy.get_property("Interface").await?;
                let device_type: u32 = device_proxy.get_property("DeviceType").await?;
                let state: u32 = device_proxy.get_property("State").await?;
                let managed: bool = device_proxy.get_property("Managed").await?;

                let mut adapter = NetworkAdapter::new(
                    device_path.clone(),
                    interface.clone(),
                    device_type_to_kind(device_type),
                );
                adapter.name = interface.clone();
                adapter.state = device_state_to_state(state);
                adapter.enabled = managed;

                if let Ok(mac) = device_proxy.get_property::<String>("HwAddress").await {
                    if !mac.is_empty() {
                        adapter.mac_address = Some(mac);
                    }
                }
                if let Ok(driver) = device_proxy.get_property::<String>("Driver").await {
                    if !driver.is_empty() {
                        adapter.driver = Some(driver);
                    }
                }
                if let Ok(speed) = device_proxy.get_property::<u32>("Speed").await {
                    if speed > 0 {
                        adapter.speed_mbps = Some(speed);
                    }
                }

                if let Ok(ip4) = device_proxy
                    .get_property::<OwnedObjectPath>("Ip4Config")
                    .await
                {
                    if !ip4.as_str().is_empty() && ip4.as_str() != "/" {
                        if let Some((ipv4, gateway, dns)) = self.read_ip4_config(ip4.as_str()).await
                        {
                            adapter.ipv4 = ipv4;
                            adapter.gateway = gateway;
                            adapter.dns = dns;
                        }
                    }
                }
                if let Ok(ip6) = device_proxy
                    .get_property::<OwnedObjectPath>("Ip6Config")
                    .await
                {
                    if !ip6.as_str().is_empty() && ip6.as_str() != "/" {
                        if let Some(ipv6) = self.read_ip6_config(ip6.as_str()).await {
                            adapter.ipv6 = ipv6;
                        }
                    }
                }

                if let Ok(active) = device_proxy
                    .get_property::<OwnedObjectPath>("ActiveConnection")
                    .await
                {
                    if !active.as_str().is_empty() && active.as_str() != "/" {
                        if let Some(connection) = self
                            .read_active_connection(active.as_str(), &interface)
                            .await
                        {
                            connections.insert(connection.id.clone(), connection);
                        }
                    }
                }

                adapters.insert(interface, adapter);
            }

            Ok(NmSnapshot {
                adapters,
                connections,
            })
        })
    }

    /// Reads IPv4 addresses, gateway and DNS servers from an IP4Config object.
    async fn read_ip4_config(
        &self,
        path: &str,
    ) -> Option<(Vec<String>, Option<String>, Vec<String>)> {
        let proxy = DbusProxy::new(&self.conn, NM_DESTINATION, path, NM_IP4_INTERFACE)
            .await
            .ok()?;
        let mut ipv4 = Vec::new();
        let mut dns = Vec::new();
        let mut gateway = None;

        if let Ok(addresses) = proxy.get_property::<Vec<Vec<u32>>>("Addresses").await {
            for address in addresses {
                if let Some(&ip) = address.first() {
                    ipv4.push(u32_to_ipv4(ip));
                }
            }
        }
        if let Ok(g) = proxy.get_property::<String>("Gateway").await {
            if !g.is_empty() {
                gateway = Some(g);
            }
        }
        if let Ok(nameservers) = proxy.get_property::<Vec<u32>>("Nameservers").await {
            for nameserver in nameservers {
                dns.push(u32_to_ipv4(nameserver));
            }
        }
        Some((ipv4, gateway, dns))
    }

    /// Reads IPv6 addresses from an IP6Config object.
    async fn read_ip6_config(&self, path: &str) -> Option<Vec<String>> {
        let proxy = DbusProxy::new(&self.conn, NM_DESTINATION, path, NM_IP6_INTERFACE)
            .await
            .ok()?;
        let mut ipv6 = Vec::new();
        if let Ok(addresses) = proxy.get_property::<Vec<(Vec<u8>, u32)>>("Addresses").await {
            for (bytes, _prefix) in addresses {
                ipv6.push(bytes_to_ipv6(&bytes));
            }
        }
        Some(ipv6)
    }

    /// Reads an active connection and maps it to a [`NetworkConnection`].
    async fn read_active_connection(
        &self,
        path: &str,
        adapter_interface: &str,
    ) -> Option<NetworkConnection> {
        let proxy = DbusProxy::new(&self.conn, NM_DESTINATION, path, NM_ACTIVE_INTERFACE)
            .await
            .ok()?;
        let id: String = proxy.get_property("Id").await.ok()?;
        let connection_type: String = proxy.get_property("Type").await.unwrap_or_default();
        let state: u32 = proxy.get_property("State").await.unwrap_or(0);

        let mut connection =
            NetworkConnection::new(path.to_string(), adapter_interface.to_string());
        connection.name = id;
        connection.state = active_state_to_connection_state(state);

        if let Ok(ip4) = proxy.get_property::<OwnedObjectPath>("Ip4Config").await {
            if !ip4.as_str().is_empty() && ip4.as_str() != "/" {
                if let Some((ipv4, gateway, dns)) = self.read_ip4_config(ip4.as_str()).await {
                    connection.ipv4 = ipv4.first().cloned();
                    connection.gateway = gateway;
                    connection.dns = dns;
                }
            }
        }
        if connection_type == "802-11-wireless" {
            if let Ok(ssid) = proxy.get_property::<Vec<u8>>("Ssid").await {
                if !ssid.is_empty() {
                    connection.ssid = Some(String::from_utf8_lossy(&ssid).into_owned());
                }
            }
            // Signal strength is best-effort; reading it requires an
            // extra AccessPoint round-trip, so it is left unset for now.
        }

        Some(connection)
    }
}

/// Network provider.
///
/// Responsible for managing network adapters and active connections.
/// Adapter data is sourced from sysfs + /proc (always available), then
/// enriched with NetworkManager state over D-Bus when the service is
/// reachable. Statistics come from sysinfo.
pub struct NetworkProvider {
    adapters: HashMap<String, NetworkAdapter>,
    connections: HashMap<String, NetworkConnection>,
    events: Vec<NetworkEvent>,
    state: ProviderState,
    health: ProviderHealth,
    statistics: HashMap<String, NetworkStatistics>,
    nm: Option<NetworkManagerClient>,
    sysinfo_networks: Option<sysinfo::Networks>,
    previous_stats: HashMap<String, (u64, u64)>,
    last_refresh: Option<std::time::Instant>,
}

impl NetworkProvider {
    #[must_use]
    pub fn new() -> Self {
        Self {
            adapters: HashMap::new(),
            connections: HashMap::new(),
            events: Vec::new(),
            state: ProviderState::Created,
            health: ProviderHealth::Unknown,
            statistics: HashMap::new(),
            nm: None,
            sysinfo_networks: None,
            previous_stats: HashMap::new(),
            last_refresh: None,
        }
    }

    #[must_use]
    pub fn adapters(&self) -> &HashMap<String, NetworkAdapter> {
        &self.adapters
    }

    #[must_use]
    pub fn connections(&self) -> &HashMap<String, NetworkConnection> {
        &self.connections
    }

    #[must_use]
    pub fn statistics(&self) -> &HashMap<String, NetworkStatistics> {
        &self.statistics
    }

    #[must_use]
    pub fn adapter_statistics(&self, interface: &str) -> Option<&NetworkStatistics> {
        self.statistics.get(interface)
    }

    #[must_use]
    pub fn adapter_by_interface(&self, interface: &str) -> Option<&NetworkAdapter> {
        self.adapters.get(interface)
    }

    pub fn add_adapter(&mut self, adapter: NetworkAdapter) {
        self.adapters.insert(adapter.id.clone(), adapter);
    }

    pub fn remove_adapter(&mut self, id: &str) -> Option<NetworkAdapter> {
        self.adapters.remove(id)
    }

    pub fn add_connection(&mut self, connection: NetworkConnection) {
        self.connections.insert(connection.id.clone(), connection);
    }

    pub fn remove_connection(&mut self, id: &str) -> Option<NetworkConnection> {
        self.connections.remove(id)
    }

    pub fn emit(&mut self, event: NetworkEvent) {
        self.events.push(event);
    }

    #[must_use]
    pub fn events(&self) -> &[NetworkEvent] {
        &self.events
    }

    pub fn clear_events(&mut self) {
        self.events.clear();
    }

    /// Enables or disables an adapter through NetworkManager.
    ///
    /// Fails honestly with [`NetworkError::ManagerUnavailable`] when
    /// NetworkManager is not reachable. On success the adapter's enabled
    /// flag and state are flipped and an `AdapterStateChanged` event is
    /// emitted.
    pub fn set_enabled(&mut self, interface: &str, enabled: bool) -> Result<(), NetworkError> {
        let client = self.nm.as_ref().ok_or(NetworkError::ManagerUnavailable)?;
        client.runtime.block_on(async {
            let manager =
                DbusProxy::new(&client.conn, NM_DESTINATION, NM_PATH, NM_INTERFACE).await?;
            let devices: Vec<OwnedObjectPath> = manager.call("GetDevices", &()).await?;
            for device in devices {
                let device_path = device.as_str().to_string();
                let device_proxy = DbusProxy::new(
                    &client.conn,
                    NM_DESTINATION,
                    &device_path,
                    NM_DEVICE_INTERFACE,
                )
                .await?;
                let device_interface: String = device_proxy.get_property("Interface").await?;
                if device_interface == interface {
                    device_proxy
                        .call::<(), (bool,)>("SetManaged", &(enabled,))
                        .await?;
                    return Ok(());
                }
            }
            Err(NetworkError::AdapterNotFound {
                id: interface.to_string(),
            })
        })?;

        if let Some(adapter) = self.adapters.get_mut(interface) {
            let previous = adapter.state;
            adapter.enabled = enabled;
            let current = if enabled {
                NetworkAdapterState::Disconnected
            } else {
                NetworkAdapterState::Disabled
            };
            adapter.state = current;
            if previous != current {
                self.events.push(NetworkEvent::AdapterStateChanged(
                    NetworkAdapterStateChangedEvent {
                        interface: interface.to_string(),
                        previous: previous.as_str().to_string(),
                        current: current.as_str().to_string(),
                    },
                ));
            }
        }
        Ok(())
    }

    /// Refreshes adapter, connection and statistics data and emits diff
    /// events. Never panics; on error the health is set to Degraded/Failed
    /// and `Ok(())` is returned so the ticker keeps running.
    pub fn refresh(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Running;

        let sysfs_adapters = match self.read_sysfs() {
            Ok(adapters) => adapters,
            Err(_) => {
                self.health = ProviderHealth::Failed;
                return Ok(());
            }
        };

        // NetworkManager is optional: when unavailable (or on a transient
        // D-Bus failure) we keep serving the sysfs snapshot.
        let nm = self.nm.as_ref().and_then(|client| client.refresh().ok());

        let mut adapters: HashMap<String, NetworkAdapter> = HashMap::new();
        for mut adapter in sysfs_adapters {
            if let Some(snapshot) = &nm {
                if let Some(nm_adapter) = snapshot.adapters.get(&adapter.interface) {
                    // NetworkManager is authoritative for state/addresses.
                    adapter.state = nm_adapter.state;
                    adapter.enabled = nm_adapter.enabled;
                    adapter.ipv4 = nm_adapter.ipv4.clone();
                    adapter.ipv6 = nm_adapter.ipv6.clone();
                    adapter.gateway = nm_adapter.gateway.clone();
                    adapter.dns = nm_adapter.dns.clone();
                    if nm_adapter.speed_mbps.is_some() {
                        adapter.speed_mbps = nm_adapter.speed_mbps;
                    }
                    if nm_adapter.driver.is_some() {
                        adapter.driver = nm_adapter.driver.clone();
                    }
                    if nm_adapter.mac_address.is_some() {
                        adapter.mac_address = nm_adapter.mac_address.clone();
                    }
                }
            }
            adapters.insert(adapter.interface.clone(), adapter);
        }
        // Devices known to NetworkManager but missing from sysfs (e.g.
        // virtual devices) are still surfaced.
        if let Some(snapshot) = &nm {
            for (interface, nm_adapter) in &snapshot.adapters {
                adapters
                    .entry(interface.clone())
                    .or_insert_with(|| nm_adapter.clone());
            }
        }

        self.refresh_statistics();
        self.diff_adapters(&adapters);

        self.adapters = adapters;
        self.connections = nm.map(|snapshot| snapshot.connections).unwrap_or_default();

        self.health = if self.nm.is_some() {
            ProviderHealth::Ready
        } else {
            ProviderHealth::Degraded
        };

        Ok(())
    }

    /// Drains pending events mapped to their wire `(name, payload)` pairs.
    ///
    /// Connection and statistics events are intentionally not emitted
    /// here: `dex.network.statistics` is produced by the backend ticker
    /// from [`NetworkStatistics`] and connection changes are covered by
    /// `dex.network.adapter_state_changed`.
    pub fn drain_events(&mut self) -> Vec<(String, serde_json::Value)> {
        let events = std::mem::take(&mut self.events);
        events
            .into_iter()
            .map(|event| match event {
                NetworkEvent::AdapterAdded(payload) => (
                    "dex.network.adapter_added".to_string(),
                    serde_json::to_value(payload).unwrap_or(serde_json::Value::Null),
                ),
                NetworkEvent::AdapterRemoved { interface } => (
                    "dex.network.adapter_removed".to_string(),
                    serde_json::json!({ "interface": interface }),
                ),
                NetworkEvent::AdapterStateChanged(payload) => (
                    "dex.network.adapter_state_changed".to_string(),
                    serde_json::to_value(payload).unwrap_or(serde_json::Value::Null),
                ),
            })
            .collect()
    }

    /// Reads adapter data from sysfs and routing/DNS from /proc.
    ///
    /// This source is always available and cheap. IPv4/IPv6 addresses are
    /// intentionally left empty here and are only populated by the
    /// NetworkManager path (documented degradation when NM is absent).
    fn read_sysfs(&self) -> Result<Vec<NetworkAdapter>, ProviderError> {
        let net_dir = Path::new("/sys/class/net");
        let mut adapters = Vec::new();

        let entries =
            std::fs::read_dir(net_dir).map_err(|error| ProviderError::CommunicationError {
                reason: error.to_string(),
            })?;
        for entry in entries.flatten() {
            let interface = entry.file_name().to_string_lossy().into_owned();
            let base = entry.path();

            let mut adapter = NetworkAdapter::new(
                interface.clone(),
                interface.clone(),
                interface_kind(&interface),
            );
            adapter.name = interface.clone();
            adapter.mac_address = read_file(&base.join("address"));
            adapter.speed_mbps = read_file(&base.join("speed"))
                .and_then(|value| value.parse::<u32>().ok())
                .filter(|&speed| speed != u32::MAX);
            let operstate = read_file(&base.join("operstate"));
            adapter.state = operstate_to_state(operstate.as_deref());
            adapter.enabled = operstate.as_deref() != Some("down");
            adapter.driver = read_driver(&base);

            adapters.push(adapter);
        }

        // IPv4 routes from /proc/net/route (hex, host byte order).
        let mut routes: Vec<NetworkRoute> = Vec::new();
        if let Ok(content) = std::fs::read_to_string("/proc/net/route") {
            for line in content.lines().skip(1) {
                if let Some((destination, gateway, netmask, interface)) = parse_route_line(line) {
                    routes.push(NetworkRoute {
                        destination,
                        gateway: Some(gateway),
                        netmask: Some(netmask),
                        interface,
                    });
                }
            }
        }

        // DNS servers from /etc/resolv.conf (best-effort).
        let mut dns: Vec<String> = Vec::new();
        if let Ok(content) = std::fs::read_to_string("/etc/resolv.conf") {
            for line in content.lines() {
                let line = line.trim();
                if let Some(rest) = line.strip_prefix("nameserver") {
                    let ip = rest.trim();
                    if !ip.is_empty() {
                        dns.push(ip.to_string());
                    }
                }
            }
        }

        // Attach routes per interface and the default gateway + DNS to the
        // interface that owns the default route.
        for route in &routes {
            if let Some(adapter) = adapters.iter_mut().find(|a| a.interface == route.interface) {
                adapter.routes.push(route.clone());
            }
        }
        if let Some(default) = routes
            .iter()
            .find(|route| route.destination == "0.0.0.0")
            .cloned()
        {
            if let Some(adapter) = adapters
                .iter_mut()
                .find(|a| a.interface == default.interface)
            {
                adapter.gateway = default.gateway;
                adapter.dns = dns;
            }
        }

        Ok(adapters)
    }

    /// Refreshes per-interface byte/packet counters and rates.
    fn refresh_statistics(&mut self) {
        let now = std::time::Instant::now();
        let elapsed_ms = self
            .last_refresh
            .map(|previous| now.duration_since(previous).as_millis() as u64)
            .unwrap_or(0);
        self.last_refresh = Some(now);

        let networks = self
            .sysinfo_networks
            .get_or_insert_with(sysinfo::Networks::new);
        networks.refresh(true);

        let mut statistics: HashMap<String, NetworkStatistics> = HashMap::new();
        for (interface, data) in networks.iter() {
            let rx_bytes = data.total_received();
            let tx_bytes = data.total_transmitted();

            let (rx_rate, tx_rate) = match self.previous_stats.get(interface) {
                Some((previous_rx, previous_tx)) if elapsed_ms > 0 => (
                    compute_rate(*previous_rx, rx_bytes, elapsed_ms),
                    compute_rate(*previous_tx, tx_bytes, elapsed_ms),
                ),
                _ => (0, 0),
            };
            self.previous_stats
                .insert(interface.clone(), (rx_bytes, tx_bytes));

            statistics.insert(
                interface.clone(),
                NetworkStatistics {
                    rx_bytes,
                    tx_bytes,
                    rx_packets: data.total_packets_received(),
                    tx_packets: data.total_packets_transmitted(),
                    rx_errors: data.total_errors_on_received(),
                    tx_errors: data.total_errors_on_transmitted(),
                    rx_rate,
                    tx_rate,
                    uptime: std::time::Duration::ZERO,
                },
            );
        }
        self.statistics = statistics;
    }

    fn diff_adapters(&mut self, new: &HashMap<String, NetworkAdapter>) {
        self.events.extend(diff_adapters_pure(&self.adapters, new));
    }
}

impl Default for NetworkProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for NetworkProvider {
    fn id(&self) -> &'static str {
        "network"
    }

    fn name(&self) -> &'static str {
        "Network Provider"
    }

    fn version(&self) -> &'static str {
        env!("CARGO_PKG_VERSION")
    }

    fn capabilities(&self) -> &'static [Capability] {
        &[Capability::Network]
    }

    fn initialize(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Initializing;
        self.health = ProviderHealth::Initializing;

        // NetworkManager is optional: on failure we degrade gracefully and
        // keep serving the sysfs-based snapshot.
        self.nm = NetworkManagerClient::new().ok();

        self.state = ProviderState::Running;
        self.refresh()
    }

    fn shutdown(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Stopping;

        self.adapters.clear();
        self.connections.clear();
        self.events.clear();
        self.statistics.clear();
        self.previous_stats.clear();
        self.last_refresh = None;
        self.nm = None;

        self.state = ProviderState::Stopped;
        self.health = ProviderHealth::Unknown;

        Ok(())
    }

    fn state(&self) -> ProviderState {
        self.state
    }

    fn health(&self) -> ProviderHealth {
        self.health
    }
}

/// Computes a rate in bytes/second from a counter delta over an elapsed
/// window measured in milliseconds.
fn compute_rate(previous: u64, now: u64, elapsed_ms: u64) -> u64 {
    if elapsed_ms == 0 || now < previous {
        return 0;
    }
    (now - previous) * 1000 / elapsed_ms
}

/// Parses one `/proc/net/route` line into `(destination, gateway, netmask,
/// interface)` dotted-quad strings.
fn parse_route_line(line: &str) -> Option<(String, String, String, String)> {
    let mut fields = line.split_whitespace();
    let interface = fields.next()?;
    let destination = fields.next()?;
    let gateway = fields.next()?;
    let _ = fields.next(); // Flags
    let _ = fields.next(); // RefCnt
    let _ = fields.next(); // Use
    let _ = fields.next(); // Metric
    let netmask = fields.next()?;
    Some((
        hex_to_ipv4(destination)?,
        hex_to_ipv4(gateway)?,
        hex_to_ipv4(netmask)?,
        interface.to_string(),
    ))
}

/// Converts a little-endian hex IPv4 (as found in `/proc/net/route`) to a
/// dotted-quad string.
fn hex_to_ipv4(hex: &str) -> Option<String> {
    let value = u32::from_str_radix(hex, 16).ok()?;
    Some(format!(
        "{}.{}.{}.{}",
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff
    ))
}

/// Maps a network interface name to its adapter kind.
fn interface_kind(interface: &str) -> NetworkAdapterKind {
    if interface == "lo" {
        return NetworkAdapterKind::Loopback;
    }
    if interface.starts_with("wlan") || interface.starts_with("wlp") || interface.starts_with("wl")
    {
        return NetworkAdapterKind::Wireless;
    }
    if interface.starts_with("eth") || interface.starts_with("enp") || interface.starts_with("ens")
    {
        return NetworkAdapterKind::Ethernet;
    }
    if interface.starts_with("wwan")
        || interface.starts_with("rmnet")
        || interface.starts_with("usb")
    {
        return NetworkAdapterKind::Cellular;
    }
    NetworkAdapterKind::Virtual
}

/// Maps an `operstate` value to an adapter state.
fn operstate_to_state(operstate: Option<&str>) -> NetworkAdapterState {
    match operstate {
        Some("up") => NetworkAdapterState::Connected,
        Some("down") => NetworkAdapterState::Disconnected,
        _ => NetworkAdapterState::Unknown,
    }
}

/// Maps an NetworkManager device type to an adapter kind.
fn device_type_to_kind(device_type: u32) -> NetworkAdapterKind {
    match device_type {
        1 | 11 => NetworkAdapterKind::Ethernet,
        2 => NetworkAdapterKind::Wireless,
        5 | 6 | 10 => NetworkAdapterKind::Cellular,
        7 | 29 => NetworkAdapterKind::Bluetooth,
        18..=28 | 31 | 33 => NetworkAdapterKind::Virtual,
        _ => NetworkAdapterKind::Unknown,
    }
}

/// Maps a NetworkManager device state to an adapter state.
fn device_state_to_state(state: u32) -> NetworkAdapterState {
    match state {
        0 => NetworkAdapterState::Unknown,
        10 => NetworkAdapterState::Disabled,
        20 | 30 => NetworkAdapterState::Disconnected,
        40 | 50 | 60 | 70 | 80 | 90 => NetworkAdapterState::Connecting,
        100 => NetworkAdapterState::Connected,
        110 => NetworkAdapterState::Disconnecting,
        120 => NetworkAdapterState::Failed,
        _ => NetworkAdapterState::Unknown,
    }
}

/// Maps a NetworkManager active-connection state to a connection state.
fn active_state_to_connection_state(state: u32) -> ConnectionState {
    match state {
        0 => ConnectionState::Unknown,
        1 => ConnectionState::Connecting,
        2 => ConnectionState::Connected,
        3 => ConnectionState::Disconnecting,
        4 => ConnectionState::Disconnected,
        _ => ConnectionState::Unknown,
    }
}

/// Computes the diff between two adapter snapshots as events.
fn diff_adapters_pure(
    old: &HashMap<String, NetworkAdapter>,
    new: &HashMap<String, NetworkAdapter>,
) -> Vec<NetworkEvent> {
    let mut events = Vec::new();

    for (interface, adapter) in new {
        if !old.contains_key(interface) {
            events.push(NetworkEvent::AdapterAdded(NetworkAdapterEvent {
                interface: interface.clone(),
                name: adapter.name.clone(),
                kind: adapter.kind,
            }));
        }
    }
    for interface in old.keys() {
        if !new.contains_key(interface) {
            events.push(NetworkEvent::AdapterRemoved {
                interface: interface.clone(),
            });
        }
    }
    for (interface, adapter) in new {
        if let Some(previous) = old.get(interface) {
            if previous.state != adapter.state {
                events.push(NetworkEvent::AdapterStateChanged(
                    NetworkAdapterStateChangedEvent {
                        interface: interface.clone(),
                        previous: previous.state.as_str().to_string(),
                        current: adapter.state.as_str().to_string(),
                    },
                ));
            }
        }
    }

    events
}

/// Reads a single-value sysfs file.
fn read_file(path: &Path) -> Option<String> {
    std::fs::read_to_string(path)
        .ok()
        .map(|value| value.trim().to_string())
}

/// Resolves the driver name backing an interface (best-effort).
fn read_driver(base: &Path) -> Option<String> {
    let target = std::fs::read_link(base.join("device/driver")).ok()?;
    target
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
}

/// Converts a network-byte-order IPv4 word to a dotted-quad string.
fn u32_to_ipv4(value: u32) -> String {
    format!(
        "{}.{}.{}.{}",
        (value >> 24) & 0xff,
        (value >> 16) & 0xff,
        (value >> 8) & 0xff,
        value & 0xff
    )
}

/// Converts a 16-byte IPv6 address to a hex-colon string.
fn bytes_to_ipv6(bytes: &[u8]) -> String {
    let mut groups = Vec::with_capacity(8);
    for chunk in bytes.chunks(2) {
        let hi = chunk.first().copied().unwrap_or(0) as u16;
        let lo = chunk.get(1).copied().unwrap_or(0) as u16;
        groups.push(format!("{:x}", (hi << 8) | lo));
    }
    groups.join(":")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adapter_kind_serializes_snake_case() {
        let serialized = serde_json::to_value(NetworkAdapterKind::Wireless).expect("serialize");
        assert_eq!(serialized, serde_json::json!("wireless"));
        assert_eq!(
            serde_json::to_value(NetworkAdapterKind::Loopback).expect("serialize"),
            serde_json::json!("loopback")
        );
        assert_eq!(
            serde_json::to_value(NetworkAdapterKind::Cellular).expect("serialize"),
            serde_json::json!("cellular")
        );
    }

    #[test]
    fn adapter_state_serializes_snake_case() {
        let cases = [
            (NetworkAdapterState::Unknown, "unknown"),
            (NetworkAdapterState::Disabled, "disabled"),
            (NetworkAdapterState::Disconnected, "disconnected"),
            (NetworkAdapterState::Connecting, "connecting"),
            (NetworkAdapterState::Connected, "connected"),
            (NetworkAdapterState::Disconnecting, "disconnecting"),
            (NetworkAdapterState::Failed, "failed"),
        ];
        for (state, expected) in cases {
            assert_eq!(
                serde_json::to_value(state).expect("serialize"),
                serde_json::json!(expected)
            );
            assert_eq!(state.as_str(), expected);
        }
    }

    #[test]
    fn connection_state_serializes_snake_case() {
        let serialized = serde_json::to_value(ConnectionState::Connected).expect("serialize");
        assert_eq!(serialized, serde_json::json!("connected"));
    }

    #[test]
    fn adapter_added_event_matches_wire_contract() {
        let event = NetworkAdapterEvent {
            interface: "wlan0".to_string(),
            name: "wlan0".to_string(),
            kind: NetworkAdapterKind::Wireless,
        };
        let value = serde_json::to_value(event).expect("serialize");
        assert_eq!(
            value,
            serde_json::json!({
                "interface": "wlan0",
                "name": "wlan0",
                "kind": "wireless",
            })
        );
    }

    #[test]
    fn state_changed_event_matches_wire_contract() {
        let event = NetworkAdapterStateChangedEvent {
            interface: "eth0".to_string(),
            previous: "disconnected".to_string(),
            current: "connected".to_string(),
        };
        let value = serde_json::to_value(event).expect("serialize");
        assert_eq!(
            value,
            serde_json::json!({
                "interface": "eth0",
                "previous": "disconnected",
                "current": "connected",
            })
        );
    }

    #[test]
    fn parse_route_line_converts_hex_to_decimal_ip() {
        // "010011AC" (LE) == 172.17.0.1, "00000000" == 0.0.0.0
        let line = "eth0\t00000000\t010011AC\t0003\t0\t0\t100\t00000000\t0\t0\t0";
        let parsed = parse_route_line(line).expect("parse");
        assert_eq!(
            parsed,
            (
                "0.0.0.0".to_string(),
                "172.17.0.1".to_string(),
                "0.0.0.0".to_string(),
                "eth0".to_string()
            )
        );
    }

    #[test]
    fn parse_route_line_ignores_header_and_garbage() {
        assert!(parse_route_line("Iface Destination Gateway Flags").is_none());
        assert!(parse_route_line("eth0\tnot-hex\t00000000").is_none());
    }

    #[test]
    fn operstate_mapping() {
        assert_eq!(
            operstate_to_state(Some("up")),
            NetworkAdapterState::Connected
        );
        assert_eq!(
            operstate_to_state(Some("down")),
            NetworkAdapterState::Disconnected
        );
        assert_eq!(operstate_to_state(None), NetworkAdapterState::Unknown);
        assert_eq!(
            operstate_to_state(Some("dormant")),
            NetworkAdapterState::Unknown
        );
    }

    #[test]
    fn interface_kind_mapping() {
        assert_eq!(interface_kind("lo"), NetworkAdapterKind::Loopback);
        assert_eq!(interface_kind("eth0"), NetworkAdapterKind::Ethernet);
        assert_eq!(interface_kind("enp3s0"), NetworkAdapterKind::Ethernet);
        assert_eq!(interface_kind("wlan0"), NetworkAdapterKind::Wireless);
        assert_eq!(interface_kind("wlp2s0"), NetworkAdapterKind::Wireless);
        assert_eq!(interface_kind("wwan0"), NetworkAdapterKind::Cellular);
        assert_eq!(interface_kind("rmnet0"), NetworkAdapterKind::Cellular);
        assert_eq!(interface_kind("docker0"), NetworkAdapterKind::Virtual);
    }

    #[test]
    fn compute_rate_is_bps() {
        assert_eq!(compute_rate(0, 1_000, 1_000), 1_000);
        assert_eq!(compute_rate(100, 1_100, 1_000), 1_000);
        assert_eq!(compute_rate(0, 500, 250), 2_000);
        assert_eq!(compute_rate(1_000, 1_000, 1_000), 0);
        // Counter reset / wrap must not underflow or panic.
        assert_eq!(compute_rate(5_000, 1_000, 1_000), 0);
        // Zero elapsed window yields zero rate.
        assert_eq!(compute_rate(0, 1_000, 0), 0);
    }

    #[test]
    fn diff_detects_added_removed_changed() {
        fn adapter(interface: &str, state: NetworkAdapterState) -> NetworkAdapter {
            let mut a = NetworkAdapter::new(interface, interface, NetworkAdapterKind::Ethernet);
            a.state = state;
            a
        }

        let old: HashMap<String, NetworkAdapter> = [
            (
                "eth0".to_string(),
                adapter("eth0", NetworkAdapterState::Disconnected),
            ),
            (
                "wlan0".to_string(),
                adapter("wlan0", NetworkAdapterState::Connected),
            ),
        ]
        .into_iter()
        .collect();

        let mut new: HashMap<String, NetworkAdapter> = old.clone();
        new.insert(
            "eth1".to_string(),
            adapter("eth1", NetworkAdapterState::Connected),
        );
        new.get_mut("eth0").expect("adapter").state = NetworkAdapterState::Connected;
        new.remove("wlan0");

        let events = diff_adapters_pure(&old, &new);
        assert_eq!(events.len(), 3);

        assert!(events.iter().any(|e| matches!(
            e,
            NetworkEvent::AdapterAdded(NetworkAdapterEvent { interface, kind: NetworkAdapterKind::Ethernet, .. })
            if interface == "eth1"
        )));
        assert!(events.iter().any(|e| matches!(
            e,
            NetworkEvent::AdapterRemoved { interface } if interface == "wlan0"
        )));
        assert!(events.iter().any(|e| matches!(
            e,
            NetworkEvent::AdapterStateChanged(NetworkAdapterStateChangedEvent {
                interface,
                previous,
                current,
            }) if interface == "eth0" && previous == "disconnected" && current == "connected"
        )));
    }

    #[test]
    fn diff_is_empty_when_unchanged() {
        let map: HashMap<String, NetworkAdapter> = [(
            "eth0".to_string(),
            NetworkAdapter::new("eth0", "eth0", NetworkAdapterKind::Ethernet),
        )]
        .into_iter()
        .collect();
        assert!(diff_adapters_pure(&map, &map).is_empty());
    }

    #[test]
    fn adapter_new_initializes_wire_fields() {
        let adapter = NetworkAdapter::new("id", "eth0", NetworkAdapterKind::Ethernet);
        assert!(adapter.ipv4.is_empty());
        assert!(adapter.ipv6.is_empty());
        assert!(adapter.gateway.is_none());
        assert!(adapter.dns.is_empty());
        assert!(adapter.routes.is_empty());
        assert!(!adapter.enabled);
    }

    #[test]
    fn hex_to_ipv4_handles_le_encoding() {
        assert_eq!(
            hex_to_ipv4("010011AC").expect("ip"),
            "172.17.0.1".to_string()
        );
        assert_eq!(hex_to_ipv4("00000000").expect("ip"), "0.0.0.0".to_string());
        assert!(hex_to_ipv4("zz").is_none());
    }
}
