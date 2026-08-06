//! System wire models: a full machine snapshot for the system panel.

use serde::{Deserialize, Serialize};

use super::state_str;

/// Full system snapshot emitted to / fetched by the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSnapshot {
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel: String,
    pub uptime_secs: u64,
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disks: Vec<DiskInfo>,
    pub battery: BatteryInfo,
    pub providers: Vec<ProviderStatus>,
}

impl Default for SystemSnapshot {
    fn default() -> Self {
        Self {
            hostname: String::new(),
            os_name: String::new(),
            os_version: String::new(),
            kernel: String::new(),
            uptime_secs: 0,
            cpu: CpuInfo::default(),
            memory: MemoryInfo::default(),
            disks: Vec::new(),
            battery: BatteryInfo::default(),
            providers: Vec::new(),
        }
    }
}

/// CPU summary of a system snapshot.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CpuInfo {
    pub model: String,
    pub cores: usize,
    pub usage_percent: f32,
    pub frequency_mhz: u64,
}

/// Memory summary of a system snapshot.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
    pub swap_total_bytes: u64,
    pub swap_used_bytes: u64,
}

/// A single disk in a system snapshot.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
}

/// Battery status in a system snapshot.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub present: bool,
    pub percent: u8,
    pub charging: bool,
    pub remaining_secs: Option<u64>,
}

impl Default for BatteryInfo {
    fn default() -> Self {
        Self {
            present: false,
            percent: 0,
            charging: false,
            remaining_secs: None,
        }
    }
}

/// Lifecycle/health of one registered provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub id: String,
    pub name: String,
    pub state: String,
    pub health: String,
}

impl ProviderStatus {
    /// Builds a status from a provider reference (state/health as snake_case
    /// wire strings, e.g. "running"/"ready").
    #[must_use]
    pub fn from_provider(provider: &dyn crate::providers::Provider) -> Self {
        Self {
            id: provider.id().to_string(),
            name: provider.name().to_string(),
            state: state_str(provider.state()),
            health: super::health_str(provider.health()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{BatteryInfo, SystemSnapshot};

    /// A default snapshot is fully populated with zeroed/empty values and no
    /// battery present.
    #[test]
    fn system_snapshot_default_is_sane() {
        let snapshot = SystemSnapshot::default();

        assert_eq!(snapshot.hostname, "");
        assert_eq!(snapshot.uptime_secs, 0);
        assert_eq!(snapshot.cpu.cores, 0);
        assert_eq!(snapshot.memory.total_bytes, 0);
        assert!(snapshot.disks.is_empty());
        assert!(snapshot.providers.is_empty());
        assert!(!snapshot.battery.present);
        assert_eq!(snapshot.battery.percent, 0);
        assert!(!snapshot.battery.charging);
        assert_eq!(snapshot.battery.remaining_secs, None);
    }

    /// `BatteryInfo::default` is the documented "no battery" state.
    #[test]
    fn battery_info_default_is_not_present() {
        let battery = BatteryInfo::default();
        assert_eq!(
            battery,
            BatteryInfo {
                present: false,
                percent: 0,
                charging: false,
                remaining_secs: None,
            }
        );
    }
}