use serde::{Deserialize, Serialize};

use super::resource::ProcessResourceUsage;

/// Runtime process information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Process {
    /// Operating system process identifier.
    pub pid: u32,

    /// Parent process identifier.
    pub parent_pid: Option<u32>,

    /// Process name.
    pub name: String,

    /// Executable path.
    pub executable: Option<String>,

    /// Command line.
    pub command: Vec<String>,

    /// Working directory.
    pub cwd: Option<String>,

    /// Owner username.
    pub user: Option<String>,

    /// Current state.
    pub state: ProcessState,

    /// Scheduling priority.
    pub priority: ProcessPriority,

    /// Resource usage.
    pub resources: ProcessResourceUsage,
}

impl Process {
    #[must_use]
    pub fn new(pid: u32, name: impl Into<String>) -> Self {
        Self {
            pid,
            parent_pid: None,
            name: name.into(),
            executable: None,
            command: Vec::new(),
            cwd: None,
            user: None,
            state: ProcessState::Unknown,
            priority: ProcessPriority::Normal,
            resources: ProcessResourceUsage::default(),
        }
    }

    #[must_use]
    pub fn is_running(&self) -> bool {
        self.state == ProcessState::Running
    }

    #[must_use]
    pub fn is_sleeping(&self) -> bool {
        self.state == ProcessState::Sleeping
    }

    #[must_use]
    pub fn is_zombie(&self) -> bool {
        self.state == ProcessState::Zombie
    }

    #[must_use]
    pub fn command_line(&self) -> String {
        self.command.join(" ")
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessState {
    Unknown,
    Running,
    Sleeping,
    Waiting,
    Stopped,
    Zombie,
    Dead,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessPriority {
    Idle,
    BelowNormal,
    Normal,
    AboveNormal,
    High,
    Realtime,
}
