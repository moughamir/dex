//! System monitor: samples the machine and produces `SystemSnapshot`s.
//!
//! The monitor owns a `sysinfo::System` instance plus the last battery sample
//! and the most recent snapshot. All sampling is guarded so a failed read
//! yields empty/default values instead of panicking.

use std::sync::Mutex;

use sysinfo::System;

use crate::events::BatteryEvent;
use crate::models::system::{BatteryInfo, CpuInfo, DiskInfo, MemoryInfo, SystemSnapshot};

use super::battery::{sample_battery, BatterySample};
use super::disk::sample_disks;

/// Internal, lock-guarded monitor state.
struct MonitorInner {
    sys: System,
    last_battery: Option<BatterySample>,
    last_snapshot: SystemSnapshot,
}

/// Samples system resources and tracks battery changes.
pub struct SystemMonitor {
    inner: Mutex<MonitorInner>,
}

impl SystemMonitor {
    /// Creates a monitor with an empty initial snapshot.
    #[must_use]
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(MonitorInner {
                sys: System::new(),
                last_battery: None,
                last_snapshot: SystemSnapshot::default(),
            }),
        }
    }

    /// Refreshes all sampled resources and returns a fresh snapshot.
    ///
    /// The snapshot's `providers` field is left empty; the caller (the
    /// background task) fills it from the provider registry.
    pub fn refresh(&self) -> SystemSnapshot {
        let mut inner = self.inner.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        let sys = &mut inner.sys;

        sys.refresh_cpu_usage();
        sys.refresh_memory();

        let cpu = CpuInfo {
            model: sys
                .cpus()
                .first()
                .map(|cpu| cpu.brand().to_string())
                .unwrap_or_default(),
            cores: sys.cpus().len(),
            usage_percent: sys.global_cpu_usage(),
            frequency_mhz: sys.cpus().first().map(|cpu| cpu.frequency()).unwrap_or(0),
        };

        let total = sys.total_memory();
        let used = sys.used_memory();
        let available = sys.available_memory();
        let usage_percent = if total > 0 {
            (used as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        let memory = MemoryInfo {
            total_bytes: total,
            used_bytes: used,
            available_bytes: available,
            usage_percent,
            swap_total_bytes: sys.total_swap(),
            swap_used_bytes: sys.used_swap(),
        };

        let disks: Vec<DiskInfo> = sample_disks()
            .into_iter()
            .map(|disk| DiskInfo {
                name: disk.name,
                mount_point: disk.mount_point,
                total_bytes: disk.total_bytes,
                available_bytes: disk.available_bytes,
                usage_percent: disk.usage_percent,
            })
            .collect();

        let battery = match sample_battery() {
            Some(sample) => BatteryInfo {
                present: true,
                percent: sample.percent,
                charging: sample.charging,
                remaining_secs: sample.remaining_secs,
            },
            None => BatteryInfo::default(),
        };

        let snapshot = SystemSnapshot {
            hostname: System::host_name().unwrap_or_default(),
            os_name: System::name().unwrap_or_default(),
            os_version: System::long_os_version()
                .or_else(System::os_version)
                .unwrap_or_default(),
            kernel: System::kernel_version().unwrap_or_default(),
            uptime_secs: System::uptime(),
            cpu,
            memory,
            disks,
            battery,
            providers: Vec::new(),
        };

        inner.last_snapshot = snapshot.clone();
        snapshot
    }

    /// Returns the most recently produced snapshot.
    #[must_use]
    pub fn latest(&self) -> SystemSnapshot {
        self.inner
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .last_snapshot
            .clone()
    }

    /// Returns the current CPU usage and memory info from the last snapshot.
    #[must_use]
    pub fn resources(&self) -> (f32, MemoryInfo) {
        let snapshot = self.latest();
        (snapshot.cpu.usage_percent, snapshot.memory)
    }

    /// Returns a battery event when the battery state changed since the last
    /// call, updating the tracked baseline. Returns `None` when unchanged.
    #[must_use]
    pub fn battery_changed(&self) -> Option<BatteryEvent> {
        let mut inner = self.inner.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

        let current = if inner.last_snapshot.battery.present {
            Some(BatterySample {
                percent: inner.last_snapshot.battery.percent,
                charging: inner.last_snapshot.battery.charging,
                remaining_secs: inner.last_snapshot.battery.remaining_secs,
            })
        } else {
            None
        };

        if current == inner.last_battery {
            return None;
        }

        inner.last_battery = current.clone();
        current.map(|battery| BatteryEvent {
            percent: battery.percent,
            charging: battery.charging,
            remaining_secs: battery.remaining_secs,
        })
    }
}

impl Default for SystemMonitor {
    fn default() -> Self {
        Self::new()
    }
}