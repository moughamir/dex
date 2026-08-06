#![allow(clippy::module_inception)]
pub mod error;
pub mod events;
mod proc_reader;
pub mod process;
pub mod provider;
pub mod resource;
pub mod task;

pub use error::ProcessError;
pub use events::ProcessEvent;
pub use process::{Process, ProcessPriority, ProcessState};
pub use provider::{ProcessProvider, TerminateSignal};
pub use resource::ProcessResourceUsage;
pub use task::{Task, TaskState};
