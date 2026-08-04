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
