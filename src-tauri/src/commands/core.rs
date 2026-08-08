//! Core command domain — canonical `greet` and startup splashscreen setup per ADR-0002.
//!
//! Commands take exactly one serde struct arg; no `#[serde(rename_all)]` —
//! serde defaults (snake_case field names) are the wire authority.

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::utils::errors::AppError;

/// Shared startup-handshake state, managed as a single `Mutex<SetupState>`.
///
/// `frontend_task` / `backend_task` are set exactly once each by
/// `set_complete`; `shown` records whether the splashscreen → main transition
/// has already run so the handshake fires exactly once.
pub struct SetupState {
    pub frontend_task: bool,
    pub backend_task: bool,
    pub shown: bool,
}

/// Which side of the startup handshake reported completion.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartupTask {
    Frontend,
    Backend,
}

impl StartupTask {
    /// Parses a wire task string into a [`StartupTask`].
    ///
    /// Only the canonical snake_case keys `frontend` and `backend` are
    /// accepted; anything else is a validation error (ADR-0002).
    pub fn try_from_str(s: &str) -> Result<StartupTask, AppError> {
        match s {
            "frontend" => Ok(StartupTask::Frontend),
            "backend" => Ok(StartupTask::Backend),
            other => Err(AppError::validation(format!(
                "invalid task completed: {other}"
            ))),
        }
    }
}

/// Pure transition predicate: the splashscreen gives way to the main window
/// exactly once, when both sides have reported in and the transition has not
/// already run.
pub fn startup_gate(frontend: bool, backend: bool, shown: bool) -> bool {
    !shown && frontend && backend
}

/// Pure fallback decision predicate for [`crate::startup_fallback`].
///
/// The failure-recovery path acts only when the handshake timeout has elapsed
/// (`elapsed_secs >= timeout_secs`) AND the splashscreen → main transition has
/// not completed (`shown` is false). A completed handshake suppresses it, and
/// it never acts before the timeout — no matter which side is still pending.
pub fn fallback_should_fire(shown: bool, elapsed_secs: u64, timeout_secs: u64) -> bool {
    !shown && elapsed_secs >= timeout_secs
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

    match StartupTask::try_from_str(&args.task)? {
        StartupTask::Frontend => state_lock.frontend_task = true,
        StartupTask::Backend => state_lock.backend_task = true,
    }

    if startup_gate(
        state_lock.frontend_task,
        state_lock.backend_task,
        state_lock.shown,
    ) {
        if let Some(splash) = app.get_webview_window("splashscreen") {
            let _ = splash.close();
        }
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
            let _ = main.set_focus();
        }
        state_lock.shown = true;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        fallback_should_fire, greet, startup_gate, GreetArgs, GreetOutput, SetupState, StartupTask,
    };
    use crate::utils::errors::AppError;

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

    #[test]
    fn startup_task_accepts_the_canonical_wire_keys() {
        assert!(matches!(
            StartupTask::try_from_str("frontend"),
            Ok(StartupTask::Frontend)
        ));
        assert!(matches!(
            StartupTask::try_from_str("backend"),
            Ok(StartupTask::Backend)
        ));
    }

    #[test]
    fn startup_task_rejects_invalid_wire_keys() {
        for bad in ["", "front", "Backend", "both", "unknown", "frontend "] {
            let err: AppError =
                StartupTask::try_from_str(bad).expect_err("invalid task should fail");
            assert_eq!(err.code(), "validation");
            assert_eq!(err.to_string(), format!("invalid task completed: {bad}"));
        }
    }

    #[test]
    fn startup_gate_fires_only_when_both_sides_are_done() {
        // Neither side, or only one side, reported in: no transition.
        assert!(!startup_gate(false, false, false));
        assert!(!startup_gate(true, false, false));
        assert!(!startup_gate(false, true, false));
        // Both sides reported in and the transition has not run yet.
        assert!(startup_gate(true, true, false));
    }

    #[test]
    fn startup_gate_fires_exactly_once() {
        // First evaluation with both flags set triggers the transition.
        assert!(startup_gate(true, true, false));
        // A second call after the window is shown is a no-op.
        assert!(!startup_gate(true, true, true));
    }

    #[test]
    fn startup_gate_covers_all_flag_combinations() {
        let cases = [
            (false, false, false, false),
            (false, false, true, false),
            (false, true, false, false),
            (false, true, true, false),
            (true, false, false, false),
            (true, false, true, false),
            (true, true, false, true),
            (true, true, true, false),
        ];

        for (frontend, backend, shown, expected) in cases {
            assert_eq!(
                startup_gate(frontend, backend, shown),
                expected,
                "frontend={frontend} backend={backend} shown={shown}"
            );
        }
    }

    #[test]
    fn fallback_fires_after_timeout_when_handshake_not_done() {
        // Timeout elapsed and the handshake has not completed: the fallback acts.
        assert!(fallback_should_fire(false, 10, 10));
        assert!(fallback_should_fire(false, 11, 10));
    }

    #[test]
    fn fallback_is_noop_before_timeout_when_handshake_not_done() {
        // Timeout not elapsed and the handshake has not completed: no-op.
        assert!(!fallback_should_fire(false, 9, 10));
        assert!(!fallback_should_fire(false, 0, 10));
    }

    #[test]
    fn fallback_is_suppressed_by_completed_handshake_after_timeout() {
        // Timeout elapsed but a completed handshake already showed the window:
        // the fallback is suppressed.
        assert!(!fallback_should_fire(true, 10, 10));
        assert!(!fallback_should_fire(true, 100, 10));
    }

    #[test]
    fn fallback_is_noop_before_timeout_after_handshake() {
        // Neither condition holds: no-op.
        assert!(!fallback_should_fire(true, 9, 10));
        assert!(!fallback_should_fire(true, 0, 10));
    }

    #[test]
    fn fallback_fires_when_elapsed_equals_timeout_boundary() {
        // Boundary: elapsed == timeout fires exactly at the boundary when shown.
        assert!(fallback_should_fire(false, 10, 10));
        assert!(!fallback_should_fire(false, 10, 11));
    }

    #[test]
    fn handshake_stateful_sequencing_fires_exactly_once() {
        // Frontend-then-backend arrival order, mirroring set_complete's steps.
        let mut state = SetupState {
            frontend_task: false,
            backend_task: false,
            shown: false,
        };
        state.frontend_task = true;
        assert!(!startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));
        state.backend_task = true;
        assert!(startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));
        state.shown = true;
        // Completed handshake: a late duplicate arrival is a no-op.
        assert!(!startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));

        // Backend-then-frontend arrival order.
        let mut state = SetupState {
            frontend_task: false,
            backend_task: false,
            shown: false,
        };
        state.backend_task = true;
        assert!(!startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));
        state.frontend_task = true;
        assert!(startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));
        state.shown = true;
        assert!(!startup_gate(
            state.frontend_task,
            state.backend_task,
            state.shown
        ));
    }
}
