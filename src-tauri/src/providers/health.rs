use serde::{Deserialize, Serialize};

/// Operational health of a provider.
///
/// Health indicates **how well** a provider is functioning.
/// It is independent from the provider lifecycle state.
///
/// Examples:
/// - Running + Ready
/// - Running + Busy
/// - Running + Degraded
/// - Running + Failed
/// - Stopped + Unknown
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ProviderHealth {
    /// Health has not yet been determined.
    Unknown,

    /// Initializing dependencies or connections.
    Initializing,

    /// Fully operational.
    Ready,

    /// Operational but actively processing work.
    Busy,

    /// Operational with reduced functionality.
    Degraded,

    /// Temporarily unavailable.
    Unavailable,

    /// Fatal error preventing operation.
    Failed,
}

impl ProviderHealth {
    /// Returns true if the provider can currently serve requests.
    #[must_use]
    pub const fn is_available(self) -> bool {
        matches!(self, Self::Ready | Self::Busy | Self::Degraded)
    }

    /// Returns true if the provider has encountered a fatal error.
    #[must_use]
    pub const fn is_failed(self) -> bool {
        matches!(self, Self::Failed)
    }
}
