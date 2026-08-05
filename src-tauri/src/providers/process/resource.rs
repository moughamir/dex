use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Runtime resource usage for a process.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProcessResourceUsage {
    /// CPU utilization (0.0 - 100.0 * cores).
    pub cpu_percent: f32,

    /// Resident memory (bytes).
    pub memory_bytes: u64,

    /// Virtual memory (bytes).
    pub virtual_memory_bytes: u64,

    /// Disk bytes read.
    pub disk_read_bytes: u64,

    /// Disk bytes written.
    pub disk_write_bytes: u64,

    /// Network bytes received.
    pub network_rx_bytes: u64,

    /// Network bytes transmitted.
    pub network_tx_bytes: u64,

    /// Number of open file descriptors.
    pub open_files: u32,

    /// Number of active threads.
    pub threads: u32,

    /// Process uptime.
    pub uptime: Duration,
}

impl ProcessResourceUsage {
    #[must_use]
    pub fn total_disk_bytes(&self) -> u64 {
        self.disk_read_bytes + self.disk_write_bytes
    }

    #[must_use]
    pub fn total_network_bytes(&self) -> u64 {
        self.network_rx_bytes + self.network_tx_bytes
    }

    #[must_use]
    pub fn is_idle(&self) -> bool {
        self.cpu_percent < 0.1
    }

    #[must_use]
    pub fn is_memory_heavy(&self) -> bool {
        self.memory_bytes >= 512 * 1024 * 1024
    }

    #[must_use]
    pub fn is_cpu_heavy(&self) -> bool {
        self.cpu_percent >= 75.0
    }
}
