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

#[cfg(test)]
mod tests {
    use super::ProviderError;

    #[test]
    fn display_for_registration_conflicts() {
        let error = ProviderError::AlreadyRegistered {
            id: "network".into(),
        };
        assert_eq!(
            error.to_string(),
            "provider 'network' is already registered"
        );
    }

    #[test]
    fn display_for_not_found() {
        let error = ProviderError::NotFound { id: "modem".into() };
        assert_eq!(error.to_string(), "provider 'modem' was not found");
    }

    #[test]
    fn display_for_structural_variants() {
        assert_eq!(
            ProviderError::CapabilityUnavailable.to_string(),
            "requested capability is unavailable"
        );
        assert_eq!(
            ProviderError::PermissionDenied.to_string(),
            "permission denied"
        );
        assert_eq!(ProviderError::Timeout.to_string(), "operation timed out");
    }

    #[test]
    fn display_for_reasoned_variants() {
        assert_eq!(
            ProviderError::InitializationFailed {
                reason: "missing device".into(),
            }
            .to_string(),
            "provider initialization failed: missing device"
        );
        assert_eq!(
            ProviderError::ShutdownFailed {
                reason: "busy".into(),
            }
            .to_string(),
            "provider shutdown failed: busy"
        );
        assert_eq!(
            ProviderError::CommunicationError {
                reason: "timeout".into(),
            }
            .to_string(),
            "communication error: timeout"
        );
        assert_eq!(
            ProviderError::Internal {
                reason: "panic".into(),
            }
            .to_string(),
            "internal provider error: panic"
        );
    }
}
