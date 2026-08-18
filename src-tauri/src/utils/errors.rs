//! Application error type shared across all Tauri commands.
//!
//! `AppError` maps to a closed set of error codes that are serialized to the
//! frontend as `{"type": "<code>", "message": "<display string>"}`. The
//! `Serialize` impl is hand-written so the wire format is stable and explicit
//! (a derived impl would key on the variant names instead).
//!
//! Each variant carries an optional context message. When `None`, the display
//! string falls back to the variant's default message; when `Some`, the
//! carried message is used verbatim. The `type` code is unaffected by the
//! carried context (ADR-0002 closed code set).

use std::fmt;

use serde::ser::{SerializeMap, Serializer};
use serde::Serialize;

use crate::providers::error::ProviderError;

/// Closed set of error codes surfaced to the frontend (ADR-0002).
///
/// Only `Internal` is constructed today (via the `From` impls below); the
/// remaining variants are the documented wire codes that future command
/// domains will construct. They are intentional foundation, not dead code —
/// removing them would silently shrink the IPC error contract. `#[allow(dead_code)]`
/// is scoped to this enum so the closed code set stays complete until each
/// variant's owning command ships.
#[allow(dead_code)]
#[derive(Debug)]
pub enum AppError {
    Validation(Option<String>),
    NotFound(Option<String>),
    PermissionDenied(Option<String>),
    Conflict(Option<String>),
    Unsupported(Option<String>),
    Internal(Option<String>),
}

/// Constructor surface for the closed error-code set (ADR-0002).
///
/// Only `Internal` is produced today (via the `From` impls); the remaining
/// constructors are what future command domains call to return domain-specific
/// errors. Intentional foundation — the allowance mirrors the one on the enum
/// and stays narrow to this constructor block.
#[allow(dead_code)]
impl AppError {
    /// Constructs a `Validation` error carrying a context message.
    pub fn validation(msg: impl Into<String>) -> Self {
        AppError::Validation(Some(msg.into()))
    }

    /// Constructs a `NotFound` error carrying a context message.
    pub fn not_found(msg: impl Into<String>) -> Self {
        AppError::NotFound(Some(msg.into()))
    }

    /// Constructs a `PermissionDenied` error carrying a context message.
    pub fn permission_denied(msg: impl Into<String>) -> Self {
        AppError::PermissionDenied(Some(msg.into()))
    }

    /// Constructs a `Conflict` error carrying a context message.
    pub fn conflict(msg: impl Into<String>) -> Self {
        AppError::Conflict(Some(msg.into()))
    }

    /// Constructs an `Unsupported` error carrying a context message.
    pub fn unsupported(msg: impl Into<String>) -> Self {
        AppError::Unsupported(Some(msg.into()))
    }

    /// Constructs an `Internal` error carrying a context message.
    pub fn internal(msg: impl Into<String>) -> Self {
        AppError::Internal(Some(msg.into()))
    }

    /// Lowercase snake_case wire code for this variant.
    pub fn code(&self) -> &'static str {
        match self {
            AppError::Validation(_) => "validation",
            AppError::NotFound(_) => "not_found",
            AppError::PermissionDenied(_) => "permission_denied",
            AppError::Conflict(_) => "conflict",
            AppError::Unsupported(_) => "unsupported",
            AppError::Internal(_) => "internal",
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Validation(Some(message)) => write!(f, "{message}"),
            AppError::Validation(None) => write!(f, "Validation failed"),
            AppError::NotFound(Some(message)) => write!(f, "{message}"),
            AppError::NotFound(None) => write!(f, "Resource not found"),
            AppError::PermissionDenied(Some(message)) => write!(f, "{message}"),
            AppError::PermissionDenied(None) => write!(f, "Permission denied"),
            AppError::Conflict(Some(message)) => write!(f, "{message}"),
            AppError::Conflict(None) => write!(f, "Operation conflicts with the current state"),
            AppError::Unsupported(Some(message)) => write!(f, "{message}"),
            AppError::Unsupported(None) => write!(f, "Operation is not supported"),
            AppError::Internal(Some(message)) => write!(f, "{message}"),
            AppError::Internal(None) => write!(f, "An internal error occurred"),
        }
    }
}

impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(2))?;
        map.serialize_entry("type", self.code())?;
        map.serialize_entry("message", &self.to_string())?;
        map.end()
    }
}

impl From<tauri::Error> for AppError {
    fn from(error: tauri::Error) -> Self {
        AppError::Internal(Some(error.to_string()))
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        AppError::Internal(Some(error.to_string()))
    }
}

impl From<ProviderError> for AppError {
    fn from(error: ProviderError) -> Self {
        AppError::Internal(Some(error.to_string()))
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::Internal(Some(error.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::AppError;
    use crate::providers::error::ProviderError;
    use serde_json::json;

    /// The wire envelope is exactly `{ "type": <code>, "message": <text> }`
    /// with no extra fields (ADR-0002).
    #[test]
    fn serializes_to_type_and_message_envelope() {
        let value = serde_json::to_value(AppError::NotFound(None)).expect("serialize");

        assert_eq!(
            value,
            json!({ "type": "not_found", "message": "Resource not found" })
        );
    }

    /// Every variant maps to its documented, lowercase snake_case wire code.
    #[test]
    fn wire_codes_match_the_closed_set() {
        let cases = [
            (AppError::Validation(None), "validation"),
            (AppError::NotFound(None), "not_found"),
            (AppError::PermissionDenied(None), "permission_denied"),
            (AppError::Conflict(None), "conflict"),
            (AppError::Unsupported(None), "unsupported"),
            (AppError::Internal(None), "internal"),
        ];

        for (variant, expected) in cases {
            assert_eq!(variant.code(), expected);
        }
    }

    /// The serialized `type` field is exactly the variant's wire code.
    #[test]
    fn serialized_type_matches_wire_code() {
        for variant in [
            AppError::Validation(None),
            AppError::NotFound(None),
            AppError::PermissionDenied(None),
            AppError::Conflict(None),
            AppError::Unsupported(None),
            AppError::Internal(None),
        ] {
            let code = variant.code();
            let value = serde_json::to_value(variant).expect("serialize");
            assert_eq!(value["type"], json!(code));
        }
    }

    /// A carried message overrides the variant's default display string.
    #[test]
    fn carried_message_overrides_default() {
        let value = serde_json::to_value(AppError::NotFound(Some("no such widget".into())))
            .expect("serialize");

        assert_eq!(
            value,
            json!({ "type": "not_found", "message": "no such widget" })
        );
    }

    /// Constructor helpers produce the expected variant with the message set.
    #[test]
    fn constructor_helpers_carry_message() {
        let cases = [
            (AppError::validation("bad input"), "validation", "bad input"),
            (AppError::not_found("missing"), "not_found", "missing"),
            (
                AppError::permission_denied("denied"),
                "permission_denied",
                "denied",
            ),
            (AppError::conflict("clash"), "conflict", "clash"),
            (AppError::unsupported("nope"), "unsupported", "nope"),
            (AppError::internal("boom"), "internal", "boom"),
        ];

        for (variant, code, message) in cases {
            let value = serde_json::to_value(variant).expect("serialize");
            assert_eq!(value["type"], json!(code));
            assert_eq!(value["message"], json!(message));
        }
    }

    /// Variants without a carried message fall back to their documented
    /// default display string.
    #[test]
    fn display_falls_back_to_default_messages() {
        let cases = [
            (AppError::Validation(None), "Validation failed"),
            (AppError::NotFound(None), "Resource not found"),
            (AppError::PermissionDenied(None), "Permission denied"),
            (
                AppError::Conflict(None),
                "Operation conflicts with the current state",
            ),
            (AppError::Unsupported(None), "Operation is not supported"),
            (AppError::Internal(None), "An internal error occurred"),
        ];

        for (variant, expected) in cases {
            assert_eq!(variant.to_string(), expected);
        }
    }

    /// The `From` impls map foreign errors onto `Internal` while carrying
    /// the underlying message verbatim.
    #[test]
    fn from_impls_map_to_internal() {
        let from_provider = AppError::from(ProviderError::NotFound {
            id: "modem".to_string(),
        });
        assert_eq!(from_provider.code(), "internal");
        assert_eq!(from_provider.to_string(), "provider 'modem' was not found");

        let from_io = AppError::from(std::io::Error::other("disk full"));
        assert_eq!(from_io.code(), "internal");
        assert_eq!(from_io.to_string(), "disk full");
    }
}
