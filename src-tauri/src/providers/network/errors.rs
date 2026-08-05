use std::fmt;

/// Errors returned by the Network provider.
#[derive(Debug)]
pub enum NetworkError {
    AdapterNotFound {
        id: String,
    },

    ConnectionNotFound {
        id: String,
    },

    ManagerUnavailable,

    ConnectionFailed {
        reason: String,
    },

    DisconnectionFailed {
        reason: String,
    },

    ScanFailed {
        reason: String,
    },

    InvalidConfiguration {
        reason: String,
    },

    PermissionDenied,

    Timeout,

    Internal {
        reason: String,
    },
}

impl fmt::Display for NetworkError {
    fn fmt(
        &self,
        f: &mut fmt::Formatter<'_>,
    ) -> fmt::Result {
        match self {
            Self::AdapterNotFound { id } => {
                write!(f, "network adapter '{}' not found", id)
            }

            Self::ConnectionNotFound { id } => {
                write!(f, "network connection '{}' not found", id)
            }

            Self::ManagerUnavailable => {
                write!(f, "NetworkManager is unavailable")
            }

            Self::ConnectionFailed { reason } => {
                write!(f, "connection failed: {}", reason)
            }

            Self::DisconnectionFailed { reason } => {
                write!(f, "disconnection failed: {}", reason)
            }

            Self::ScanFailed { reason } => {
                write!(f, "network scan failed: {}", reason)
            }

            Self::InvalidConfiguration { reason } => {
                write!(f, "invalid configuration: {}", reason)
            }

            Self::PermissionDenied => {
                write!(f, "permission denied")
            }

            Self::Timeout => {
                write!(f, "operation timed out")
            }

            Self::Internal { reason } => {
                write!(f, "internal network error: {}", reason)
            }
        }
    }
}

impl std::error::Error for NetworkError {}
