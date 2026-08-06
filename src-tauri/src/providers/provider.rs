use crate::providers::{
    capability::Capability, error::ProviderError, health::ProviderHealth, state::ProviderState,
};

/// Every system integration inside DEX implements this trait.
///
/// Providers expose operating-system capabilities (Network, Git, Hyprland, DBus, Terminal, etc.)
/// through a common lifecycle.
///
/// Providers never contain business logic.
/// They only expose capabilities to the Kernel.
///
/// `refresh` and `drain_events` are optional hooks driven by the background
/// sampling loop: `refresh` lets a provider update its internal state each
/// tick, and `drain_events` returns any wire events the provider produced
/// since the last drain (each tuple is `(wire event name, JSON payload)`).
pub trait Provider: Send + Sync {
    fn id(&self) -> &'static str;
    fn name(&self) -> &'static str;
    fn version(&self) -> &'static str;
    fn capabilities(&self) -> &'static [Capability];
    fn initialize(&mut self) -> Result<(), ProviderError>;
    fn shutdown(&mut self) -> Result<(), ProviderError>;
    fn state(&self) -> ProviderState;
    fn health(&self) -> ProviderHealth;
    fn is_ready(&self) -> bool {
        self.state() == ProviderState::Running && self.health() == ProviderHealth::Ready
    }

    /// Refreshes the provider's internal state. Called once per sampling tick.
    ///
    /// The default implementation is a no-op; providers that need to poll an
    /// external source override this.
    fn refresh(&mut self) -> Result<(), ProviderError> {
        Ok(())
    }

    /// Returns wire events produced since the last call and clears them.
    ///
    /// Each tuple is `(wire event name, JSON payload)`, e.g.
    /// `("dex.process.spawned", {"pid": 123, "name": "kitty"})`. The default
    /// implementation returns no events.
    fn drain_events(&mut self) -> Vec<(String, serde_json::Value)> {
        Vec::new()
    }
}
