//! Process wire model mirroring the process provider contract.

use serde::{Deserialize, Serialize};

use crate::providers::process::{Process, ProcessPriority, ProcessState};

/// A process as reported to the frontend (wire contract).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub parent_pid: Option<u32>,
    pub name: String,
    pub executable: Option<String>,
    pub command: Vec<String>,
    pub command_line: String,
    pub user: Option<String>,
    pub state: String,
    pub priority: String,
    pub cpu_percent: f32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub disk_read_bytes: u64,
    pub disk_write_bytes: u64,
    pub network_rx_bytes: u64,
    pub network_tx_bytes: u64,
    pub threads: u32,
    pub open_files: Option<u32>,
    pub uptime_secs: u64,
    pub children: Vec<u32>,
}

impl ProcessInfo {
    /// Converts a provider `Process` into the wire model.
    ///
    /// `uptime_secs` and `children` are supplied by the caller (the provider
    /// does not track children).
    #[must_use]
    pub fn from_process(p: &Process, uptime_secs: u64, children: Vec<u32>) -> Self {
        Self {
            pid: p.pid,
            parent_pid: p.parent_pid,
            name: p.name.clone(),
            executable: p.executable.clone(),
            command: p.command.clone(),
            command_line: p.command.join(" "),
            user: p.user.clone(),
            state: process_state_str(p.state),
            priority: process_priority_str(p.priority),
            cpu_percent: p.resources.cpu_percent,
            memory_bytes: p.resources.memory_bytes,
            virtual_memory_bytes: p.resources.virtual_memory_bytes,
            disk_read_bytes: p.resources.disk_read_bytes,
            disk_write_bytes: p.resources.disk_write_bytes,
            network_rx_bytes: p.resources.network_rx_bytes,
            network_tx_bytes: p.resources.network_tx_bytes,
            threads: p.resources.threads,
            open_files: Some(p.resources.open_files),
            uptime_secs,
            children,
        }
    }
}

/// Stable snake_case wire string for a process state.
fn process_state_str(state: ProcessState) -> String {
    match state {
        ProcessState::Unknown => "unknown",
        ProcessState::Running => "running",
        ProcessState::Sleeping => "sleeping",
        ProcessState::Waiting => "waiting",
        ProcessState::Stopped => "stopped",
        ProcessState::Zombie => "zombie",
        ProcessState::Dead => "dead",
    }
    .to_string()
}

/// Stable snake_case wire string for a process priority.
fn process_priority_str(priority: ProcessPriority) -> String {
    match priority {
        ProcessPriority::Idle => "idle",
        ProcessPriority::BelowNormal => "below_normal",
        ProcessPriority::Normal => "normal",
        ProcessPriority::AboveNormal => "above_normal",
        ProcessPriority::High => "high",
        ProcessPriority::Realtime => "realtime",
    }
    .to_string()
}