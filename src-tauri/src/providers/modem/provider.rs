use std::collections::HashMap;

use crate::providers::{
    Capability,
    Provider,
    ProviderError,
    ProviderHealth,
    ProviderState,
};

use super::{
    events::ModemEvent,
    modem::Modem,
    sim::SimCard,
};

/// Cellular modem provider.
///
/// Owns the collection of detected modems and SIM cards.
///
/// The implementation is transport-independent; communication with
/// ModemManager over D-Bus will be added in the integration layer.
pub struct ModemProvider {
    modems: HashMap<String, Modem>,
    sims: HashMap<String, SimCard>,
    events: Vec<ModemEvent>,
    state: ProviderState,
    health: ProviderHealth,
}

impl ModemProvider {
    #[must_use]
    pub fn new() -> Self {
        Self {
            modems: HashMap::new(),
            sims: HashMap::new(),
            events: Vec::new(),
            state: ProviderState::Created,
            health: ProviderHealth::Unknown,
        }
    }

    #[must_use]
    pub fn modems(&self) -> &HashMap<String, Modem> {
        &self.modems
    }

    #[must_use]
    pub fn sims(&self) -> &HashMap<String, SimCard> {
        &self.sims
    }

    #[must_use]
    pub fn modem(
        &self,
        id: &str,
    ) -> Option<&Modem> {
        self.modems.get(id)
    }

    #[must_use]
    pub fn sim(
        &self,
        id: &str,
    ) -> Option<&SimCard> {
        self.sims.get(id)
    }

    pub fn add_modem(
        &mut self,
        modem: Modem,
    ) {
        self.modems
            .insert(modem.id.clone(), modem);
    }

    pub fn remove_modem(
        &mut self,
        id: &str,
    ) -> Option<Modem> {
        self.modems.remove(id)
    }

    pub fn add_sim(
        &mut self,
        sim: SimCard,
    ) {
        self.sims
            .insert(sim.id.clone(), sim);
    }

    pub fn remove_sim(
        &mut self,
        id: &str,
    ) -> Option<SimCard> {
        self.sims.remove(id)
    }

    pub fn emit(
        &mut self,
        event: ModemEvent,
    ) {
        self.events.push(event);
    }

    #[must_use]
    pub fn events(&self) -> &[ModemEvent] {
        &self.events
    }

    pub fn clear_events(&mut self) {
        self.events.clear();
    }
}

impl Default for ModemProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for ModemProvider {
    fn id(&self) -> &'static str {
        "modem"
    }

    fn name(&self) -> &'static str {
        "Modem Provider"
    }

    fn version(&self) -> &'static str {
        env!("CARGO_PKG_VERSION")
    }

    fn capabilities(&self) -> &'static [Capability] {
        &[Capability::Modem]
    }

    fn initialize(
        &mut self,
    ) -> Result<(), ProviderError> {
        self.state = ProviderState::Initializing;
        self.health = ProviderHealth::Initializing;

        self.state = ProviderState::Running;
        self.health = ProviderHealth::Ready;

        Ok(())
    }

    fn shutdown(
        &mut self,
    ) -> Result<(), ProviderError> {
        self.state = ProviderState::Stopping;

        self.modems.clear();
        self.sims.clear();
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
