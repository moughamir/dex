//! Best-effort readers for `/proc/<pid>/` data that `sysinfo` does not expose
//! through its public API (or only populates with a richer refresh kind than
//! the process provider uses).
//!
//! Every reader is best-effort: on any error it returns a neutral default
//! (`0`, `None`, or an empty collection) rather than failing the refresh. The
//! pure parsing helpers are kept separate so they can be unit-tested offline.

use std::path::PathBuf;

/// Build the path to a `/proc/<pid>/<entry>` file.
fn proc_path(pid: u32, entry: &str) -> PathBuf {
    PathBuf::from(format!("/proc/{pid}/{entry}"))
}

/// Parse the `read_bytes` and `write_bytes` counters from a `/proc/<pid>/io`
/// file.
///
/// Returns `(read_bytes, write_bytes)`. A missing or malformed line yields `0`
/// for that counter.
fn parse_proc_io(content: &str) -> (u64, u64) {
    let mut read_bytes = 0u64;
    let mut write_bytes = 0u64;
    for line in content.lines() {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        match key.trim() {
            "read_bytes" => read_bytes = value.trim().parse().unwrap_or(0),
            "write_bytes" => write_bytes = value.trim().parse().unwrap_or(0),
            _ => {}
        }
    }
    (read_bytes, write_bytes)
}

/// Best-effort disk I/O counters for `pid`. Returns `(0, 0)` on any error.
pub fn read_proc_io(pid: u32) -> (u64, u64) {
    std::fs::read_to_string(proc_path(pid, "io"))
        .map(|content| parse_proc_io(&content))
        .unwrap_or((0, 0))
}

/// Parse the nice value (field 19) from a `/proc/<pid>/stat` file.
///
/// The command name (field 2) may contain spaces and parentheses, so all
/// fields after the closing `)` of the command name are re-indexed from field
/// 3; the nice value is the 17th of those fields.
fn parse_proc_stat_nice(content: &str) -> Option<i32> {
    let rest = content.rsplit_once(')')?.1;
    let field = rest.split_whitespace().nth(16)?;
    field.parse().ok()
}

/// Best-effort nice value for `pid`.
pub fn read_proc_nice(pid: u32) -> Option<i32> {
    std::fs::read_to_string(proc_path(pid, "stat"))
        .ok()
        .and_then(|content| parse_proc_stat_nice(&content))
}

/// Best-effort command line (NUL-separated argv entries) for `pid`.
pub fn read_proc_cmdline(pid: u32) -> Vec<String> {
    std::fs::read(proc_path(pid, "cmdline"))
        .map(|bytes| {
            bytes
                .split(|byte| *byte == 0)
                .filter(|arg| !arg.is_empty())
                .map(|arg| String::from_utf8_lossy(arg).into_owned())
                .collect()
        })
        .unwrap_or_default()
}

/// Best-effort current working directory for `pid`.
pub fn read_proc_cwd(pid: u32) -> Option<String> {
    std::fs::read_link(proc_path(pid, "cwd"))
        .ok()
        .map(|path| path.to_string_lossy().into_owned())
}

/// Best-effort real user id for `pid`, parsed from `/proc/<pid>/status`.
pub fn read_proc_uid(pid: u32) -> Option<u32> {
    let content = std::fs::read_to_string(proc_path(pid, "status")).ok()?;
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix("Uid:") {
            return rest.split_whitespace().next()?.parse().ok();
        }
    }
    None
}

/// Best-effort username for a real user id via `nix::unistd::User::from_uid`.
pub fn username_for_uid(uid: u32) -> Option<String> {
    nix::unistd::User::from_uid(nix::unistd::Uid::from_raw(uid))
        .ok()
        .flatten()
        .map(|user| user.name)
}

/// Best-effort count of open file descriptors for `pid`. Returns `0` on any
/// error. This is only filled by [`crate::providers::process::ProcessProvider::process_details`]
/// — it is too expensive to gather for the full list refresh.
pub fn count_open_files(pid: u32) -> u32 {
    std::fs::read_dir(proc_path(pid, "fd"))
        .map(|entries| entries.flatten().count() as u32)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::{parse_proc_io, parse_proc_stat_nice};

    #[test]
    fn parses_proc_io_counters() {
        let content = "rchar: 1234\nwchar: 5678\nsyscr: 10\nsyscw: 20\n\
                       read_bytes: 4096\nwrite_bytes: 8192\ncancelled_write_bytes: 0\n";
        assert_eq!(parse_proc_io(content), (4096, 8192));
    }

    #[test]
    fn proc_io_missing_counters_default_to_zero() {
        assert_eq!(parse_proc_io("rchar: 1\n"), (0, 0));
        assert_eq!(parse_proc_io(""), (0, 0));
        assert_eq!(parse_proc_io("read_bytes: not-a-number\n"), (0, 0));
    }

    #[test]
    fn parses_nice_from_stat_with_spaces_in_comm() {
        // The command name (field 2) may contain spaces and parens. Fields
        // after its closing `)` restart at field 3: `S` (state), `1` (ppid),
        // ... down to `20 5 1` = priority 20, nice 5, num_threads 1.
        let content = "1234 (some process (with) parens) S 1 1 1 0 -1 4194560 \
                       100 0 0 0 0 0 0 0 20 5 1";
        assert_eq!(parse_proc_stat_nice(content), Some(5));
    }

    #[test]
    fn stat_without_enough_fields_yields_none() {
        assert_eq!(parse_proc_stat_nice("1234 (x) S 1"), None);
        assert_eq!(parse_proc_stat_nice("not a stat file"), None);
    }
}
