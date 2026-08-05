use std::fmt;

/// Errors returned by the Modem provider.
#[derive(Debug)]
pub enum ModemError {
    ModemNotFound { id: String },

    SimNotFound,

    ManagerUnavailable,

    ConnectFailed { reason: String },

    DisconnectFailed { reason: String },

    InvalidPin,

    PinRequired,

    PukRequired,

    PermissionDenied,

    Timeout,

    Internal { reason: String },
}

impl fmt::Display for ModemError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ModemNotFound { id } => {
                write!(f, "modem '{}' not found", id)
            }

            Self::SimNotFound => {
                write!(f, "SIM card not found")
            }

            Self::ManagerUnavailable => {
                write!(f, "ModemManager is unavailable")
            }

            Self::ConnectFailed { reason } => {
                write!(f, "failed to connect: {}", reason)
            }

            Self::DisconnectFailed { reason } => {
                write!(f, "failed to disconnect: {}", reason)
            }

            Self::InvalidPin => {
                write!(f, "invalid PIN")
            }

            Self::PinRequired => {
                write!(f, "SIM PIN required")
            }

            Self::PukRequired => {
                write!(f, "SIM PUK required")
            }

            Self::PermissionDenied => {
                write!(f, "permission denied")
            }

            Self::Timeout => {
                write!(f, "operation timed out")
            }

            Self::Internal { reason } => {
                write!(f, "internal modem error: {}", reason)
            }
        }
    }
}

impl std::error::Error for ModemError {}
