//! OS sampling backed by `sysinfo` (and `/sys` for battery, which sysinfo
//! 0.39.x no longer exposes). All sampling is guarded: any failure yields
//! empty/default values rather than panicking.

pub mod battery;
pub mod cpu;
pub mod disk;
pub mod memory;
pub mod monitor;

pub use battery::{BatterySample, sample_battery};
pub use cpu::CpuSample;
pub use disk::{sample_disks, DiskSample};
pub use memory::MemorySample;
pub use monitor::SystemMonitor;