use std::collections::HashMap;

use crate::providers::{
    process::{Process, ProcessEvent, Task},
    Capability, Provider, ProviderError, ProviderHealth, ProviderState,
};

/// Process provider.
///
/// Responsible for:
/// - Process discovery
/// - Process lifecycle
/// - Task lifecycle
/// - Resource monitoring
/// - Process spawning
/// - Process termination
///
/// Platform-specific implementations use:
/// - sysinfo
/// - /proc
/// - tokio::process
/// - nix
pub struct ProcessProvider {
    processes: HashMap<u32, Process>,
    tasks: HashMap<String, Task>,
    events: Vec<ProcessEvent>,
    state: ProviderState,
    health: ProviderHealth,
}

impl ProcessProvider {
    #[must_use]
    pub fn new() -> Self {
        Self {
            processes: HashMap::new(),
            tasks: HashMap::new(),
            events: Vec::new(),
            state: ProviderState::Created,
            health: ProviderHealth::Unknown,
        }
    }

    #[must_use]
    pub fn processes(&self) -> &HashMap<u32, Process> {
        &self.processes
    }

    #[must_use]
    pub fn tasks(&self) -> &HashMap<String, Task> {
        &self.tasks
    }

    #[must_use]
    pub fn process(&self, pid: u32) -> Option<&Process> {
        self.processes.get(&pid)
    }

    #[must_use]
    pub fn task(&self, id: &str) -> Option<&Task> {
        self.tasks.get(id)
    }

    pub fn add_process(&mut self, process: Process) {
        self.processes.insert(process.pid, process);
    }

    pub fn remove_process(&mut self, pid: u32) -> Option<Process> {
        self.processes.remove(&pid)
    }

    pub fn add_task(&mut self, task: Task) {
        self.tasks.insert(task.id.clone(), task);
    }

    pub fn remove_task(&mut self, id: &str) -> Option<Task> {
        self.tasks.remove(id)
    }

    pub fn emit(&mut self, event: ProcessEvent) {
        self.events.push(event);
    }

    #[must_use]
    pub fn events(&self) -> &[ProcessEvent] {
        &self.events
    }

    pub fn clear_events(&mut self) {
        self.events.clear();
    }

    #[must_use]
    pub fn process_count(&self) -> usize {
        self.processes.len()
    }

    #[must_use]
    pub fn task_count(&self) -> usize {
        self.tasks.len()
    }

    pub fn clear(&mut self) {
        self.processes.clear();
        self.tasks.clear();
        self.events.clear();
    }
}

impl Default for ProcessProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl Provider for ProcessProvider {
    fn id(&self) -> &'static str {
        "process"
    }

    fn name(&self) -> &'static str {
        "Process Provider"
    }

    fn version(&self) -> &'static str {
        env!("CARGO_PKG_VERSION")
    }

    fn capabilities(&self) -> &'static [Capability] {
        &[
            Capability::Process,
            Capability::SpawnProcess,
            Capability::KillProcess,
        ]
    }

    fn initialize(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Initializing;
        self.health = ProviderHealth::Initializing;

        self.processes.clear();
        self.tasks.clear();
        self.events.clear();

        self.state = ProviderState::Running;
        self.health = ProviderHealth::Ready;

        Ok(())
    }

    fn shutdown(&mut self) -> Result<(), ProviderError> {
        self.state = ProviderState::Stopping;

        self.processes.clear();
        self.tasks.clear();
        self.events.clear();

        self.state = ProviderState::Stopped;
        self.health = ProviderHealth::Unknown;

        Ok(())
    }

    fn state(&self) -> ProviderState {
        self.state
    }

    fn health(&self) -> ProviderHealth {
        self.health
    }
}
