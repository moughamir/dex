//! Battery sampling.
//!
//! sysinfo 0.39.x no longer exposes a battery API, so on Linux we read the
//! power-supply class directly under `/sys/class/power_supply/`. Everything
//! is guarded: `None` is returned when no battery is present or any read
//! fails.

use std::fs;
use std::path::Path;

/// A single battery sample.
#[derive(Debug, Clone, PartialEq)]
pub struct BatterySample {
    pub percent: u8,
    pub charging: bool,
    pub remaining_secs: Option<u64>,
}

/// Samples the primary battery.
///
/// Returns `None` when no battery exists or the sysfs reads fail.
#[must_use]
pub fn sample_battery() -> Option<BatterySample> {
    let battery_dir = find_battery_dir()?;
    let percent = read_u8(&battery_dir.join("capacity"))?.min(100);
    let charging = read_status(&battery_dir.join("status")) == Some(true);
    let remaining_secs = remaining_seconds(&battery_dir);

    Some(BatterySample {
        percent,
        charging,
        remaining_secs,
    })
}

/// Locates the first `power_supply` entry whose `type` is `Battery` and that
/// exposes a `capacity` file.
fn find_battery_dir() -> Option<std::path::PathBuf> {
    let entries = fs::read_dir("/sys/class/power_supply").ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        let type_file = path.join("type");
        let is_battery = fs::read_to_string(type_file)
            .map(|kind| kind.trim() == "Battery")
            .unwrap_or(false);
        if is_battery && path.join("capacity").is_file() {
            return Some(path);
        }
    }
    None
}

/// Reads `capacity` as an unsigned byte, `None` on any error.
fn read_u8(path: &Path) -> Option<u8> {
    fs::read_to_string(path).ok()?.trim().parse().ok()
}

/// Reads `status`; `true` when charging, `false` when discharging,
/// `None` when the file is missing or unreadable.
fn read_status(path: &Path) -> Option<bool> {
    let status = fs::read_to_string(path).ok()?;
    Some(status.trim() == "Charging" || status.trim() == "Full")
}

/// Estimates seconds remaining until empty/full from energy/current and
/// power/current rate when both are available.
fn remaining_seconds(battery_dir: &Path) -> Option<u64> {
    let energy_now = read_u64(&battery_dir.join("energy_now"))?;
    let power_now = read_u64(&battery_dir.join("power_now"))?;
    if power_now == 0 {
        return None;
    }
    // energy_now (µWh) / power_now (µW) → hours, converted to seconds.
    let secs = (energy_now as u128 * 3600) / power_now as u128;
    Some(secs.min(u64::MAX as u128) as u64)
}

/// Reads a u64 from a sysfs file, `None` on any error.
fn read_u64(path: &Path) -> Option<u64> {
    fs::read_to_string(path).ok()?.trim().parse().ok()
}