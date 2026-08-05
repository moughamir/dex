//! CPU sampling.

/// A single CPU sample.
#[derive(Debug, Clone, Default)]
pub struct CpuSample {
    pub model: String,
    pub cores: usize,
    pub usage_percent: f32,
    pub frequency_mhz: u64,
}