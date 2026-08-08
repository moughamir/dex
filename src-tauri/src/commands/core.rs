//! Core command domain — canonical `greet` per ADR-0002.
//!
//! Commands take exactly one serde struct arg; no `#[serde(rename_all)]` —
//! serde defaults (snake_case field names) are the wire authority.

use serde::{Deserialize, Serialize};

use crate::utils::errors::AppError;

#[derive(Debug, Deserialize)]
pub struct GreetArgs {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct GreetOutput {
    pub message: String,
}

#[tauri::command]
pub fn greet(args: GreetArgs) -> Result<GreetOutput, AppError> {
    Ok(GreetOutput {
        message: format!("Hello, {}! You've been greeted from Rust!", args.name),
    })
}

#[cfg(test)]
mod tests {
    use super::{greet, GreetArgs, GreetOutput};

    #[test]
    fn greet_welcomes_a_named_user() {
        let output = greet(GreetArgs {
            name: "Dexter".into(),
        })
        .expect("greet should succeed");
        assert_eq!(
            output.message,
            "Hello, Dexter! You've been greeted from Rust!"
        );
    }

    #[test]
    fn greet_handles_empty_names_without_panicking() {
        let output = greet(GreetArgs {
            name: String::new(),
        })
        .expect("greet should succeed");
        assert!(output.message.starts_with("Hello, !"));
    }

    #[test]
    fn greet_returns_typed_output() {
        let output: GreetOutput =
            greet(GreetArgs { name: "Ada".into() }).expect("greet should succeed");
        assert!(!output.message.is_empty());
    }
}
