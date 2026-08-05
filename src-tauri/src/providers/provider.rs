use crate::providers::{
    capability::Capability,
    error::ProviderError,
    health::ProviderHealth,
    state::ProviderState,
};

/// Every system integration inside DEX implements this trair.
///
/// Providers expose operating-system capabilities (Network, Git, Hyprland, DBus, Terminal, etc.)
/// through a common lifecycle.
///
/// Providers never contain buiness logic.
/// They only expose capabilities to the Kernel.
pub trait Provider: Send+Sync{
    fn id(&self) -> &'static str;
    fn name(&self) -> &'static str;
    fn version(&self) -> &'static str;
    fn capabilities(&self) -> &'static [Capability];
    fn initialize(&mut self) -> Result<(), ProviderError>;
    fn shutdown(&mut self) -> Result<(), ProviderError>;
    fn state(&self) -> ProviderState;
    fn health(&self) -> ProviderHealth;
    fn is_ready(&self) -> bool {
        self.state() == ProviderState::Running
            && self.health() == ProviderHealth::Ready
    }

}
