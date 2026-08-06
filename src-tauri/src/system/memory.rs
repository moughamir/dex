//! Memory sampling.

/// A single memory sample (RAM + swap).
#[derive(Debug, Clone, Default)]
pub struct MemorySample {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub usage_percent: f32,
    pub swap_total: u64,
    pub swap_used: u64,
}