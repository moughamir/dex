use std::fmt;

/// Errors returned by the Process provider.
#[derive(Debug)]
pub enum ProcessError {
    ProcessNotFound { pid: u32 },

    SpawnFailed { reason: String },

    KillFailed { pid: u32, reason: String },

    PermissionDenied,

    InvalidCommand,

    Timeout,

    Internal { reason: String },
}

impl fmt::Display for ProcessError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ProcessNotFound { pid } => {
                write!(f, "process {} not found", pid)
            }

            Self::SpawnFailed { reason } => {
                write!(f, "failed to spawn process: {}", reason)
            }

            Self::KillFailed { pid, reason } => {
                write!(f, "failed to terminate process {}: {}", pid, reason)
            }

            Self::PermissionDenied => {
                write!(f, "permission denied")
            }

            Self::InvalidCommand => {
                write!(f, "invalid command")
            }

            Self::Timeout => {
                write!(f, "operation timed out")
            }

            Self::Internal { reason } => {
                write!(f, "internal process error: {}", reason)
            }
        }
    }
}

impl std::error::Error for ProcessError {}
