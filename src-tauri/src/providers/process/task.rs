use serde::{Deserialize, Serialize};

/// A task represents work initiated by DEX.
///
/// Unlike a Process, a Task is a logical unit that may spawn one or
/// more operating system processes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    /// Stable task identifier.
    pub id: String,

    /// Display name.
    pub name: String,

    /// Root process.
    pub pid: Option<u32>,

    /// Current task state.
    pub state: TaskState,

    /// Exit code once completed.
    pub exit_code: Option<i32>,
}

impl Task {
    #[must_use]
    pub fn new(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            pid: None,
            state: TaskState::Created,
            exit_code: None,
        }
    }

    #[must_use]
    pub fn is_running(&self) -> bool {
        self.state == TaskState::Running
    }

    #[must_use]
    pub fn is_finished(&self) -> bool {
        matches!(
            self.state,
            TaskState::Completed | TaskState::Cancelled | TaskState::Failed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskState {
    Created,
    Queued,
    Starting,
    Running,
    Completed,
    Cancelled,
    Failed,
}
