//! Application error type shared across all Tauri commands.
//!
//! `AppError` maps to a closed set of error codes that are serialized to the
//! frontend as `{"type": "<code>", "message": "<display string>"}`. The
//! `Serialize` impl is hand-written so the wire format is stable and explicit
//! (a derived impl would key on the variant names instead).

use serde::ser::{SerializeMap, Serializer};
use serde::Serialize;

/// Closed set of error codes surfaced to the frontend (ADR-0002).
///
/// `#[allow(dead_code)]`: variants beyond `Validation`/`Internal` are part of
/// the wire contract and are constructed as their commands land (Phase 1+).
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Validation failed")]
    Validation,
    #[error("Resource not found")]
    NotFound,
    #[error("Permission denied")]
    PermissionDenied,
    #[error("Operation conflicts with the current state")]
    Conflict,
    #[error("Operation is not supported")]
    Unsupported,
    #[error("An internal error occurred")]
    Internal,
}

impl AppError {
    /// Lowercase snake_case wire code for this variant.
    pub fn code(&self) -> &'static str {
        match self {
            AppError::Validation => "validation",
            AppError::NotFound => "not_found",
            AppError::PermissionDenied => "permission_denied",
            AppError::Conflict => "conflict",
            AppError::Unsupported => "unsupported",
            AppError::Internal => "internal",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(2))?;
        map.serialize_entry("type", self.code())?;
        map.serialize_entry("message", &self.to_string())?;
        map.end()
    }
}

impl From<tauri::Error> for AppError {
    fn from(_: tauri::Error) -> Self {
        AppError::Internal
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(_: rusqlite::Error) -> Self {
        AppError::Internal
    }
}