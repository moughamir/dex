//! Disk sampling.

use sysinfo::Disks;

/// A single disk sample.
#[derive(Debug, Clone, Default)]
pub struct DiskSample {
    pub name: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
}

/// Samples all mounted disks.
///
/// Returns an empty vector if the disk list cannot be read.
#[must_use]
pub fn sample_disks() -> Vec<DiskSample> {
    let disks = Disks::new_with_refreshed_list();
    disks
        .list()
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let usage_percent = if total > 0 {
                let used = total.saturating_sub(available);
                (used as f32 / total as f32) * 100.0
            } else {
                0.0
            };
            DiskSample {
                name: disk.name().to_string_lossy().into_owned(),
                mount_point: disk.mount_point().to_string_lossy().into_owned(),
                total_bytes: total,
                available_bytes: available,
                usage_percent,
            }
        })
        .collect()
}