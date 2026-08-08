//! Core command domain — canonical `greet` and startup splashscreen setup per ADR-0002.
//!
//! Commands take exactly one serde struct arg; no `#[serde(rename_all)]` —
//! serde defaults (snake_case field names) are the wire authority.

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::utils::errors::AppError;

pub struct SetupState {
    pub frontend_task: bool,
    pub backend_task: bool,
}

#[derive(Debug, Deserialize)]
pub struct GreetArgs {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct GreetOutput {
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct SetCompleteArgs {
    pub task: String,
}

#[tauri::command]
pub fn greet(args: GreetArgs) -> Result<GreetOutput, AppError> {
    Ok(GreetOutput {
        message: format!("Hello, {}! You've been greeted from Rust!", args.name),
    })
}

#[tauri::command]
pub async fn set_complete(
    app: tauri::AppHandle,
    state: tauri::State<'_, std::sync::Mutex<SetupState>>,
    args: SetCompleteArgs,
) -> Result<(), AppError> {
    let mut state_lock = state
        .lock()
        .map_err(|e| AppError::internal(format!("mutex lock failed: {e}")))?;

    match args.task.as_str() {
        "frontend" => state_lock.frontend_task = true,
        "backend" => state_lock.backend_task = true,
        other => {
            return Err(AppError::validation(format!(
                "invalid task completed: {other}"
            )))
        }
    }

    if state_lock.backend_task && state_lock.frontend_task {
        if let Some(splash) = app.get_webview_window("splashscreen") {
            let _ = splash.close();
        }
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
            let _ = main.set_focus();
        }
    }

    Ok(())
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
