use std::fmt;

/// Errors returned by the D-Bus provider.
///
/// These errors represent communication and protocol failures between
/// DEX and the system D-Bus.
#[derive(Debug)]
pub enum DbusError {
    /// Failed to establish a connection to the bus.
    ConnectionFailed { reason: String },

    /// The connection has been closed.
    ConnectionClosed,

    /// Failed to send a message.
    SendFailed { reason: String },

    /// Failed to receive a message.
    ReceiveFailed { reason: String },

    /// Failed to create a proxy.
    ProxyCreationFailed {
        service: String,
        path: String,
        interface: String,
    },

    /// Method invocation failed.
    MethodCallFailed { method: String, reason: String },

    /// Failed to subscribe to a signal.
    SignalSubscriptionFailed { signal: String },

    /// Requested service is unavailable.
    ServiceUnavailable { service: String },

    /// Invalid D-Bus object path.
    InvalidObjectPath { path: String },

    /// Invalid interface name.
    InvalidInterface { interface: String },

    /// Invalid member.
    InvalidMember { member: String },

    /// Operation timed out.
    Timeout,

    /// Internal D-Bus error.
    Internal { reason: String },
}

impl fmt::Display for DbusError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ConnectionFailed { reason } => {
                write!(f, "failed to connect to D-Bus: {reason}")
            }

            Self::ConnectionClosed => {
                write!(f, "D-Bus connection is closed")
            }

            Self::SendFailed { reason } => {
                write!(f, "failed to send D-Bus message: {reason}")
            }

            Self::ReceiveFailed { reason } => {
                write!(f, "failed to receive D-Bus message: {reason}")
            }

            Self::ProxyCreationFailed {
                service,
                path,
                interface,
            } => {
                write!(f, "failed to create proxy ({service}, {path}, {interface})")
            }

            Self::MethodCallFailed { method, reason } => {
                write!(f, "D-Bus method '{method}' failed: {reason}")
            }

            Self::SignalSubscriptionFailed { signal } => {
                write!(f, "failed to subscribe to signal '{signal}'")
            }

            Self::ServiceUnavailable { service } => {
                write!(f, "service '{service}' is unavailable")
            }

            Self::InvalidObjectPath { path } => {
                write!(f, "invalid object path '{path}'")
            }

            Self::InvalidInterface { interface } => {
                write!(f, "invalid interface '{interface}'")
            }

            Self::InvalidMember { member } => {
                write!(f, "invalid member '{member}'")
            }

            Self::Timeout => {
                write!(f, "D-Bus operation timed out")
            }

            Self::Internal { reason } => {
                write!(f, "internal D-Bus error: {reason}")
            }
        }
    }
}

impl std::error::Error for DbusError {}
