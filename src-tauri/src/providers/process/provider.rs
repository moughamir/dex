use std::collections::HashMap;
use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::providers::{
    process::{
        events::{ProcessExitedEvent, ProcessSpawnedEvent, ProcessStateChangedEvent},
        proc_reader, Process, ProcessEvent, ProcessPriority, ProcessResourceUsage, ProcessState,
        Task, TaskState,
    },
    Capability, Provider, ProviderError, ProviderHealth, ProviderState,
};

/// Signal used by [`ProcessProvider::terminate_process`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TerminateSignal {
    /// Polite termination (SIGTERM).
    Terminate,
    /// Forced termination (SIGKILL).
    Kill,
}

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
    /// The single `sysinfo` instance kept alive between refreshes so CPU
    /// usage (a diff-based computation) and process snapshots stay coherent.
    sys: sysinfo::System,
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
            sys: sysinfo::System::new(),
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

    /// Refresh the process snapshot from the OS.
    ///
    /// This is the periodic sampling entry point used by the backend ticker.
    /// It never hard-fails: problems are surfaced through `health()` as
    /// [`ProviderHealth::Degraded`] while the last known good process list is
    /// kept, and the provider returns `Ok(())` either way.
    pub fn refresh(&mut self) -> Result<(), ProviderError> {
        match self.try_refresh() {
            Ok(()) => {
                self.health = ProviderHealth::Ready;
                Ok(())
            }
            Err(_) => {
                self.health = ProviderHealth::Degraded;
                Ok(())
            }
        }
    }

    /// Drain pending events as wire tuples `(event_name, payload)`.
    ///
    /// Only lifecycle events are emitted: `dex.process.spawned` and
    /// `dex.process.exited`. State / resource / priority changes are
    /// intentionally dropped here — the periodic `dex.process.updated` event
    /// emitted by the backend ticker carries the full process snapshot.
    pub fn drain_events(&mut self) -> Vec<(String, serde_json::Value)> {
        let events = std::mem::take(&mut self.events);
        events
            .into_iter()
            .filter_map(|event| match event {
                ProcessEvent::Spawned(payload) => serde_json::to_value(payload)
                    .ok()
                    .map(|value| ("dex.process.spawned".to_string(), value)),
                ProcessEvent::Exited(payload) => serde_json::to_value(payload)
                    .ok()
                    .map(|value| ("dex.process.exited".to_string(), value)),
                _ => None,
            })
            .collect()
    }

    /// Spawn a detached process and register it as a DEX task.
    ///
    /// The child is spawned directly without a new session or process group
    /// because `std::process::Command` does not expose `setsid`. The `Child`
    /// handle is dropped immediately, so the child is reparented to init and
    /// reaped by it — no zombie is created from the provider's side.
    ///
    /// Returns `(pid, task_id)` on success.
    pub fn spawn_process(
        &mut self,
        command: &str,
        args: &[String],
        cwd: Option<&str>,
        env: Option<&HashMap<String, String>>,
    ) -> Result<(u32, String), ProcessError> {
        let command = command.trim();
        if command.is_empty() {
            return Err(ProcessError::InvalidCommand);
        }

        let mut cmd = std::process::Command::new(command);
        cmd.args(args);
        if let Some(cwd) = cwd {
            cmd.current_dir(cwd);
        }
        if let Some(env) = env {
            cmd.envs(env);
        }

        let child = cmd.spawn().map_err(|err| ProcessError::SpawnFailed {
            reason: err.to_string(),
        })?;
        let pid = child.id();
        drop(child);

        let task_id = uuid::Uuid::new_v4().to_string();
        let task = Task {
            id: task_id.clone(),
            name: command.to_string(),
            pid: Some(pid),
            state: TaskState::Running,
            exit_code: None,
        };
        self.add_task(task);
        self.emit(ProcessEvent::Spawned(ProcessSpawnedEvent {
            pid,
            parent_pid: None,
            name: command.to_string(),
        }));
        Ok((pid, task_id))
    }

    /// Send a termination signal to the process with the given `pid`.
    pub fn terminate_process(
        &mut self,
        pid: u32,
        signal: TerminateSignal,
    ) -> Result<(), ProcessError> {
        use nix::sys::signal::Signal;

        let nix_signal = match signal {
            TerminateSignal::Terminate => Signal::SIGTERM,
            TerminateSignal::Kill => Signal::SIGKILL,
        };

        match nix::sys::signal::kill(nix::unistd::Pid::from_raw(pid as i32), nix_signal) {
            Ok(()) => {
                // Best-effort: reflect the termination in our snapshot so
                // consumers see a coherent state before the next refresh.
                if let Some(process) = self.processes.get_mut(&pid) {
                    let previous = process.state;
                    process.state = ProcessState::Stopped;
                    if previous != process.state {
                        self.emit(ProcessEvent::StateChanged(ProcessStateChangedEvent {
                            pid,
                            previous,
                            current: process.state,
                        }));
                    }
                }
                Ok(())
            }
            Err(errno) => Err(map_kill_errno(pid, errno)),
        }
    }

    /// Detailed view of a single process, filling in fields that are too
    /// expensive to gather for the full list refresh (e.g. open file count).
    pub fn process_details(&mut self, pid: u32) -> Option<Process> {
        let mut process = self.processes.get(&pid)?.clone();
        process.resources.open_files = proc_reader::count_open_files(pid);
        Some(process)
    }

    /// Sweep the task table: any running task whose pid no longer exists in
    /// the process snapshot is marked `Completed` and an `Exited` event is
    /// emitted for it (exactly once, because it is no longer `Running`).
    pub fn refresh_tasks(&mut self) {
        let exited: Vec<(String, u32)> = self
            .tasks
            .iter()
            .filter_map(|(id, task)| {
                let pid = task.pid?;
                if task.state == TaskState::Running && !self.processes.contains_key(&pid) {
                    Some((id.clone(), pid))
                } else {
                    None
                }
            })
            .collect();

        for (task_id, pid) in exited {
            if let Some(task) = self.tasks.get_mut(&task_id) {
                task.state = TaskState::Completed;
                // The exit code is not recoverable after the process has
                // disappeared; it stays `None`.
            }
            self.emit(ProcessEvent::Exited(ProcessExitedEvent {
                pid,
                exit_code: None,
            }));
        }
    }

    /// Core refresh: query `sysinfo` and `/proc`, rebuild the process map,
    /// diff it against the previous one and emit lifecycle events.
    ///
    /// Never panics; returns `Err` only for structural failures, which the
    /// caller turns into a `Degraded` health flag.
    fn try_refresh(&mut self) -> Result<(), ProviderError> {
        // `remove_dead_processes = true` also prunes processes that vanished
        // since the last refresh, which is what lets us diff for exits.
        self.sys
            .refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        self.sys.refresh_cpu_usage();
        self.sys.refresh_memory();

        let uptime = sysinfo::System::uptime();
        let boot_time = sysinfo::System::boot_time();

        let mut next: HashMap<u32, Process> = HashMap::new();
        for (sys_pid, sys_proc) in self.sys.processes() {
            let pid = sys_pid.as_u32();
            let uptime_secs =
                uptime.saturating_sub(sys_proc.start_time().saturating_sub(boot_time));
            let (disk_read_bytes, disk_write_bytes) = proc_reader::read_proc_io(pid);

            let process = Process {
                pid,
                parent_pid: sys_proc.parent().map(|parent| parent.as_u32()),
                name: sys_proc.name().to_string_lossy().into_owned(),
                executable: sys_proc
                    .exe()
                    .map(|path| path.to_string_lossy().into_owned()),
                command: proc_reader::read_proc_cmdline(pid),
                cwd: proc_reader::read_proc_cwd(pid),
                user: proc_reader::read_proc_uid(pid).and_then(proc_reader::username_for_uid),
                state: map_process_status(sys_proc.status()),
                priority: priority_from_nice(proc_reader::read_proc_nice(pid).unwrap_or(0)),
                resources: ProcessResourceUsage {
                    cpu_percent: sys_proc.cpu_usage(),
                    memory_bytes: sys_proc.memory(),
                    virtual_memory_bytes: sys_proc.virtual_memory(),
                    disk_read_bytes,
                    disk_write_bytes,
                    network_rx_bytes: 0,
                    network_tx_bytes: 0,
                    open_files: 0,
                    // `thread_kind()` only reports whether the process itself
                    // is a thread; the thread count lives in `tasks()`.
                    threads: sys_proc.tasks().map_or(0, |tasks| tasks.len() as u32),
                    uptime: Duration::from_secs(uptime_secs),
                },
            };
            next.insert(pid, process);
        }

        let (spawned, exited) = diff(&self.processes, &next);
        for (pid, parent_pid, name) in spawned {
            self.emit(ProcessEvent::Spawned(ProcessSpawnedEvent {
                pid,
                parent_pid,
                name,
            }));
        }
        for pid in exited {
            // The exit code is not recoverable once a process has
            // disappeared; this is a documented limitation.
            self.emit(ProcessEvent::Exited(ProcessExitedEvent {
                pid,
                exit_code: None,
            }));
        }

        self.processes = next;
        self.refresh_tasks();

        Ok(())
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

        self.sys = sysinfo::System::new();

        match self.try_refresh() {
            Ok(()) => {
                self.state = ProviderState::Running;
                self.health = ProviderHealth::Ready;
                Ok(())
            }
            Err(_) => {
                self.state = ProviderState::Running;
                self.health = ProviderHealth::Degraded;
                Ok(())
            }
        }
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

/// Diff two process snapshots and report which pids appeared and which
/// disappeared.
///
/// Returns `(spawned, exited)` where each spawned entry carries
/// `(pid, parent_pid, name)` and each exited entry is just the pid.
fn diff(
    prev: &HashMap<u32, Process>,
    next: &HashMap<u32, Process>,
) -> (Vec<(u32, Option<u32>, String)>, Vec<u32>) {
    let spawned = next
        .iter()
        .filter(|(pid, _)| !prev.contains_key(pid))
        .map(|(pid, process)| (*pid, process.parent_pid, process.name.clone()))
        .collect();
    let exited = prev
        .keys()
        .filter(|pid| !next.contains_key(pid))
        .copied()
        .collect();
    (spawned, exited)
}

/// Map a `sysinfo` process status onto the DEX `ProcessState` vocabulary.
fn map_process_status(status: sysinfo::ProcessStatus) -> ProcessState {
    use sysinfo::ProcessStatus;
    match status {
        ProcessStatus::Run => ProcessState::Running,
        ProcessStatus::Sleep => ProcessState::Sleeping,
        ProcessStatus::Stop => ProcessState::Stopped,
        ProcessStatus::Zombie => ProcessState::Zombie,
        ProcessStatus::Dead => ProcessState::Dead,
        ProcessStatus::Idle => ProcessState::Sleeping,
        ProcessStatus::Tracing => ProcessState::Waiting,
        ProcessStatus::Wakekill => ProcessState::Dead,
        ProcessStatus::Waking => ProcessState::Running,
        ProcessStatus::Parked => ProcessState::Stopped,
        ProcessStatus::LockBlocked => ProcessState::Waiting,
        ProcessStatus::UninterruptibleDiskSleep => ProcessState::Waiting,
        ProcessStatus::Suspended => ProcessState::Stopped,
        ProcessStatus::Unknown(_) => ProcessState::Unknown,
    }
}

/// Map a Linux nice value (range -20..=19) onto the DEX priority vocabulary.
fn priority_from_nice(nice: i32) -> ProcessPriority {
    match nice {
        i32::MIN..=-20 => ProcessPriority::Realtime,
        -19..=-11 => ProcessPriority::High,
        -10..=-1 => ProcessPriority::AboveNormal,
        0 => ProcessPriority::Normal,
        1..=18 => ProcessPriority::BelowNormal,
        _ => ProcessPriority::Idle,
    }
}

/// Map a `nix` kill error onto the DEX error vocabulary.
fn map_kill_errno(pid: u32, errno: nix::errno::Errno) -> ProcessError {
    use nix::errno::Errno;
    match errno {
        Errno::EPERM => ProcessError::PermissionDenied,
        Errno::ESRCH => ProcessError::ProcessNotFound { pid },
        other => ProcessError::KillFailed {
            pid,
            reason: other.to_string(),
        },
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::{diff, map_kill_errno, map_process_status, priority_from_nice, ProcessProvider};
    use crate::providers::process::{
        error::ProcessError, events::ProcessExitedEvent, events::ProcessSpawnedEvent,
        events::ProcessStateChangedEvent, Process, ProcessEvent, ProcessPriority, ProcessState,
        Task, TaskState,
    };

    fn process(pid: u32) -> Process {
        let mut process = Process::new(pid, format!("proc-{pid}"));
        process.parent_pid = Some(1);
        process
    }

    #[test]
    fn process_state_serde_snake_case_roundtrip() {
        for state in [
            ProcessState::Unknown,
            ProcessState::Running,
            ProcessState::Sleeping,
            ProcessState::Waiting,
            ProcessState::Stopped,
            ProcessState::Zombie,
            ProcessState::Dead,
        ] {
            let json = serde_json::to_string(&state).unwrap();
            assert_eq!(serde_json::from_str::<ProcessState>(&json).unwrap(), state);
        }
        assert_eq!(
            serde_json::to_string(&ProcessState::Running).unwrap(),
            "\"running\""
        );
        assert_eq!(
            serde_json::to_string(&ProcessState::Sleeping).unwrap(),
            "\"sleeping\""
        );
        assert_eq!(
            serde_json::to_string(&ProcessState::Zombie).unwrap(),
            "\"zombie\""
        );
        assert_eq!(
            serde_json::to_string(&ProcessState::Stopped).unwrap(),
            "\"stopped\""
        );
    }

    #[test]
    fn process_priority_serde_snake_case_roundtrip() {
        for priority in [
            ProcessPriority::Idle,
            ProcessPriority::BelowNormal,
            ProcessPriority::Normal,
            ProcessPriority::AboveNormal,
            ProcessPriority::High,
            ProcessPriority::Realtime,
        ] {
            let json = serde_json::to_string(&priority).unwrap();
            assert_eq!(
                serde_json::from_str::<ProcessPriority>(&json).unwrap(),
                priority
            );
        }
        assert_eq!(
            serde_json::to_string(&ProcessPriority::BelowNormal).unwrap(),
            "\"below_normal\""
        );
        assert_eq!(
            serde_json::to_string(&ProcessPriority::Realtime).unwrap(),
            "\"realtime\""
        );
        assert_eq!(
            serde_json::to_string(&ProcessPriority::Idle).unwrap(),
            "\"idle\""
        );
    }

    #[test]
    fn task_state_serde_snake_case_roundtrip() {
        for state in [
            TaskState::Created,
            TaskState::Queued,
            TaskState::Starting,
            TaskState::Running,
            TaskState::Completed,
            TaskState::Cancelled,
            TaskState::Failed,
        ] {
            let json = serde_json::to_string(&state).unwrap();
            assert_eq!(serde_json::from_str::<TaskState>(&json).unwrap(), state);
        }
        assert_eq!(
            serde_json::to_string(&TaskState::Completed).unwrap(),
            "\"completed\""
        );
        assert_eq!(
            serde_json::to_string(&TaskState::Running).unwrap(),
            "\"running\""
        );
    }

    #[test]
    fn diff_detects_spawned_and_exited() {
        let mut prev = HashMap::new();
        prev.insert(1, process(1));
        prev.insert(2, process(2));

        let mut next = HashMap::new();
        next.insert(2, process(2));
        next.insert(3, process(3));

        let (spawned, exited) = diff(&prev, &next);
        assert_eq!(exited, vec![1]);
        assert_eq!(spawned.len(), 1);
        let (pid, parent_pid, name) = &spawned[0];
        assert_eq!(*pid, 3);
        assert_eq!(*parent_pid, Some(1));
        assert_eq!(name, "proc-3");
    }

    #[test]
    fn diff_is_empty_when_nothing_changed() {
        let mut prev = HashMap::new();
        prev.insert(1, process(1));
        let next = prev.clone();

        let (spawned, exited) = diff(&prev, &next);
        assert!(spawned.is_empty());
        assert!(exited.is_empty());
    }

    #[test]
    fn diff_reports_spawned_name_and_parent() {
        let prev = HashMap::new();
        let mut next = HashMap::new();
        let mut spawned_process = process(42);
        spawned_process.name = "bash".to_string();
        spawned_process.parent_pid = Some(7);
        next.insert(42, spawned_process);

        let (spawned, _) = diff(&prev, &next);
        assert_eq!(spawned, vec![(42, Some(7), "bash".to_string())]);
    }

    #[test]
    fn priority_from_nice_mapping() {
        assert_eq!(priority_from_nice(-20), ProcessPriority::Realtime);
        assert_eq!(priority_from_nice(-11), ProcessPriority::High);
        assert_eq!(priority_from_nice(-1), ProcessPriority::AboveNormal);
        assert_eq!(priority_from_nice(0), ProcessPriority::Normal);
        assert_eq!(priority_from_nice(5), ProcessPriority::BelowNormal);
        assert_eq!(priority_from_nice(19), ProcessPriority::Idle);
    }

    #[test]
    fn status_mapping_covers_sysinfo_variants() {
        use sysinfo::ProcessStatus;
        assert_eq!(
            map_process_status(ProcessStatus::Run),
            ProcessState::Running
        );
        assert_eq!(
            map_process_status(ProcessStatus::Sleep),
            ProcessState::Sleeping
        );
        assert_eq!(
            map_process_status(ProcessStatus::Stop),
            ProcessState::Stopped
        );
        assert_eq!(
            map_process_status(ProcessStatus::Zombie),
            ProcessState::Zombie
        );
        assert_eq!(map_process_status(ProcessStatus::Dead), ProcessState::Dead);
        assert_eq!(
            map_process_status(ProcessStatus::UninterruptibleDiskSleep),
            ProcessState::Waiting
        );
        assert_eq!(
            map_process_status(ProcessStatus::Unknown(0)),
            ProcessState::Unknown
        );
    }

    #[test]
    fn kill_errno_mapping() {
        use nix::errno::Errno;
        assert_eq!(
            map_kill_errno(7, Errno::EPERM),
            ProcessError::PermissionDenied
        );
        assert_eq!(
            map_kill_errno(7, Errno::ESRCH),
            ProcessError::ProcessNotFound { pid: 7 }
        );
        assert!(matches!(
            map_kill_errno(7, Errno::EINVAL),
            ProcessError::KillFailed { pid: 7, .. }
        ));
    }

    #[test]
    fn refresh_tasks_marks_gone_pids_completed_once() {
        let mut provider = ProcessProvider::new();
        provider.add_task(Task {
            id: "t1".to_string(),
            name: "gone".to_string(),
            pid: Some(100),
            state: TaskState::Running,
            exit_code: None,
        });
        provider.add_task(Task {
            id: "t2".to_string(),
            name: "alive".to_string(),
            pid: Some(200),
            state: TaskState::Running,
            exit_code: None,
        });
        provider.processes.insert(200, process(200));

        provider.refresh_tasks();

        assert_eq!(provider.task("t1").unwrap().state, TaskState::Completed);
        assert_eq!(provider.task("t2").unwrap().state, TaskState::Running);
        let exited = provider
            .events()
            .iter()
            .filter(|event| matches!(event, ProcessEvent::Exited(_)))
            .count();
        assert_eq!(exited, 1);

        // A second sweep must not re-emit the exited event.
        provider.refresh_tasks();
        let exited = provider
            .events()
            .iter()
            .filter(|event| matches!(event, ProcessEvent::Exited(_)))
            .count();
        assert_eq!(exited, 1);
    }

    #[test]
    fn refresh_tasks_ignores_tasks_without_pid() {
        let mut provider = ProcessProvider::new();
        provider.add_task(Task {
            id: "t3".to_string(),
            name: "no-pid".to_string(),
            pid: None,
            state: TaskState::Running,
            exit_code: None,
        });

        provider.refresh_tasks();

        assert_eq!(provider.task("t3").unwrap().state, TaskState::Running);
        assert!(provider.events().is_empty());
    }

    #[test]
    fn drain_events_maps_only_spawn_and_exit() {
        let mut provider = ProcessProvider::new();
        provider.emit(ProcessEvent::Spawned(ProcessSpawnedEvent {
            pid: 1,
            parent_pid: None,
            name: "app".to_string(),
        }));
        provider.emit(ProcessEvent::Exited(ProcessExitedEvent {
            pid: 1,
            exit_code: None,
        }));
        provider.emit(ProcessEvent::StateChanged(ProcessStateChangedEvent {
            pid: 1,
            previous: ProcessState::Running,
            current: ProcessState::Sleeping,
        }));

        let drained = provider.drain_events();

        assert_eq!(drained.len(), 2);
        assert_eq!(drained[0].0, "dex.process.spawned");
        assert_eq!(drained[1].0, "dex.process.exited");
        assert_eq!(drained[0].1["pid"], 1);
        assert_eq!(drained[1].1["pid"], 1);
        assert!(provider.events().is_empty());
    }
}
