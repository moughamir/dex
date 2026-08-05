use serde::{Deserialize, Serialize};

/// Lifecycle state of a provider.
///
/// State describes **where** a provider is in its lifecycle.
/// It is independent from its health.
///
/// Example:
/// - Running + Ready
/// - Running + Degraded
/// - Running + Failed
/// - Stopped + Unknown
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ProviderState {
    /// Provider has been created but not registered.
    Created,

    /// Provider is registered in the ProviderRegistry.
    Registered,

    /// Provider is allocating resources.
    Initializing,

    /// Provider is operational.
    Running,

    /// Provider is shutting down.
    Stopping,

    /// Provider has been stopped.
    Stopped,
}

impl ProviderState {
    /// Returns true if the provider is operational.
    #[must_use]
    pub const fn is_running(self) -> bool {
        matches!(self, Self::Running)
    }

    /// Returns true if the provider is transitioning.
    #[must_use]
    pub const fn is_transitioning(self) -> bool {
        matches!(self, Self::Initializing | Self::Stopping)
    }

    /// Returns true if the provider has been fully stopped.
    #[must_use]
    pub const fn is_stopped(self) -> bool {
        matches!(self, Self::Stopped)
    }
}
