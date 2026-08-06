use serde::{Deserialize, Serialize};

use super::{process::ProcessState, resource::ProcessResourceUsage};

/// Events emitted by the ProcessProvider.
///
/// These events are published on the DEX event bus and consumed
/// by the Task Manager, Terminal, Widgets and Automations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessEvent {
    Spawned(ProcessSpawnedEvent),

    Exited(ProcessExitedEvent),

    StateChanged(ProcessStateChangedEvent),

    ResourceUpdated(ProcessResourceUpdatedEvent),

    PriorityChanged(ProcessPriorityChangedEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessSpawnedEvent {
    pub pid: u32,
    pub parent_pid: Option<u32>,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessExitedEvent {
    pub pid: u32,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessStateChangedEvent {
    pub pid: u32,
    pub previous: ProcessState,
    pub current: ProcessState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessResourceUpdatedEvent {
    pub pid: u32,
    pub resources: ProcessResourceUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessPriorityChangedEvent {
    pub pid: u32,
    pub previous: i32,
    pub current: i32,
}
