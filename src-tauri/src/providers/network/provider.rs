use std::collections::HashMap;

use crate::providers::{Capability, Provider, ProviderError, ProviderHealth, ProviderState};

use super::{adapter::NetworkAdapter, connection::NetworkConnection, events::NetworkEvent};

/// Network provider.
///
/// Responsible for managing network adapters and active
/// connections. Platform-specific communication (NetworkManager)
/// will be added later.
pub struct NetworkProvider {
    adapters: HashMap<String, NetworkAdapter>,
    connections: HashMap<String, NetworkConnection>,
    events: Vec<NetworkEvent>,
    state: ProviderState,
    health: ProviderHealth,
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

        self.state = ProviderState::Running;
        self.health = ProviderHealth::Ready;

        Ok(())
    }

    fn shutdown(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Stopping;

        self.adapters.clear();
        self.connections.clear();
        self.events.clear();

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
