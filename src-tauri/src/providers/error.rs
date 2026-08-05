use std::fmt;

/// Common error type returned by all DEX providers.
#[derive(Debug)]
pub enum ProviderError {
    /// A provider with the given identifier already exists.
    AlreadyRegistered { id: String },

    /// Requested provider could not be found.
    NotFound { id: String },

    /// Provider does not expose the requested capability.
    CapabilityUnavailable,

    /// Provider failed to initialize.
    InitializationFailed { reason: String },

    /// Provider failed to shut down.
    ShutdownFailed { reason: String },

    /// Provider lacks the required permissions.
    PermissionDenied,

    /// Communication with the underlying system failed.
    CommunicationError { reason: String },

    /// Operation timed out.
    Timeout,

    /// Internal provider error.
    Internal { reason: String },
}

impl fmt::Display for ProviderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AlreadyRegistered { id } => {
                write!(f, "provider '{}' is already registered", id)
            }

            Self::NotFound { id } => {
                write!(f, "provider '{}' was not found", id)
            }

            Self::CapabilityUnavailable => {
                write!(f, "requested capability is unavailable")
            }

            Self::InitializationFailed { reason } => {
                write!(f, "provider initialization failed: {}", reason)
            }

            Self::ShutdownFailed { reason } => {
                write!(f, "provider shutdown failed: {}", reason)
            }

            Self::PermissionDenied => {
                write!(f, "permission denied")
            }

            Self::CommunicationError { reason } => {
                write!(f, "communication error: {}", reason)
            }

            Self::Timeout => {
                write!(f, "operation timed out")
            }

            Self::Internal { reason } => {
                write!(f, "internal provider error: {}", reason)
            }
        }
    }
}

impl std::error::Error for ProviderError {}
