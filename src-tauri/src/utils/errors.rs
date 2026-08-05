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
/// `#[allow(dead_code)]`: the closed set is a wire contract, and the variants
/// that no command constructs yet (`NotFound`, `PermissionDenied`, `Conflict`,
/// `Unsupported`) stay unconstructed until their owning commands land
/// (Phase 1+). `Validation` is exercised by the unit tests; `Internal` is
/// produced by the `From<tauri::Error>` / `From<rusqlite::Error>` impls used
/// by the command and database layers.
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

#[cfg(test)]
mod tests {
    use super::AppError;
    use serde_json::json;

    /// The wire envelope is exactly `{ "type": <code>, "message": <text> }`
    /// with no extra fields (ADR-0002, docs/22_Backend.md).
    #[test]
    fn serializes_to_type_and_message_envelope() {
        let value = serde_json::to_value(AppError::NotFound).expect("serialize");

        assert_eq!(
            value,
            json!({ "type": "not_found", "message": "Resource not found" })
        );
    }

    /// Every variant maps to its documented, lowercase snake_case wire code.
    #[test]
    fn wire_codes_match_the_closed_set() {
        let cases = [
            (AppError::Validation, "validation"),
            (AppError::NotFound, "not_found"),
            (AppError::PermissionDenied, "permission_denied"),
            (AppError::Conflict, "conflict"),
            (AppError::Unsupported, "unsupported"),
            (AppError::Internal, "internal"),
        ];

        for (variant, expected) in cases {
            assert_eq!(variant.code(), expected);
        }
    }

    /// The serialized `type` field is exactly the variant's wire code.
    #[test]
    fn serialized_type_matches_wire_code() {
        for variant in [
            AppError::Validation,
            AppError::NotFound,
            AppError::PermissionDenied,
            AppError::Conflict,
            AppError::Unsupported,
            AppError::Internal,
        ] {
            let code = variant.code();
            let value = serde_json::to_value(variant).expect("serialize");
            assert_eq!(value["type"], json!(code));
        }
    }
}
