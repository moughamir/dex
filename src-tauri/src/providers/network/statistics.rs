use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Runtime network statistics.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct NetworkStatistics {
    /// Bytes received.
    pub rx_bytes: u64,

    /// Bytes transmitted.
    pub tx_bytes: u64,

    /// Packets received.
    pub rx_packets: u64,

    /// Packets transmitted.
    pub tx_packets: u64,

    /// Receive errors.
    pub rx_errors: u64,

    /// Transmit errors.
    pub tx_errors: u64,

    /// Receive throughput (bytes/sec).
    pub rx_rate: u64,

    /// Transmit throughput (bytes/sec).
    pub tx_rate: u64,

    /// Connection uptime.
    pub uptime: Duration,
}

impl NetworkStatistics {
    #[must_use]
    pub fn total_bytes(&self) -> u64 {
        self.rx_bytes + self.tx_bytes
    }

    #[must_use]
    pub fn total_packets(&self) -> u64 {
        self.rx_packets + self.tx_packets
    }

    #[must_use]
    pub fn total_errors(&self) -> u64 {
        self.rx_errors + self.tx_errors
    }

    #[must_use]
    pub fn is_idle(&self) -> bool {
        self.rx_rate == 0 && self.tx_rate == 0
    }

    #[must_use]
    pub fn total_rate(&self) -> u64 {
        self.rx_rate + self.tx_rate
    }
}
