# DEX CLI — Command Line Reference

## Purpose

This document is the user-facing reference for the `dex` command line
interface: the command tree, options, arguments, exit codes, and `--json`
output. It is the *companion* to the contract — the formal grammar, argument
schemas, and output schemas are owned by
[`../30-specs/CLI.md`](../30-specs/CLI.md). Where this document and the
contract disagree, the contract wins.

The CLI is the stable, complete surface of the Workspace Runtime. Per the
CLI First principle (principle 3), every capability is reachable and
scriptable from the command line; the graphical shell is a second client of
the same command surface, never a separate one. What works in the shell
works in the CLI, and nothing is GUI-only.

## Current status

The `dex` binary is **planned**. Phase 0 ships the layer model and
infrastructure only; no CLI binary exists yet. The command tree below is the
intended surface, mapped to the roadmap milestones that deliver each
subcommand. Until a subcommand's milestone lands, that subcommand is not
available. The first command domains arrive with Phase 4 M4.1 (Rust Core —
commands, IPC, services), which is when the CLI companion of the command
surface is expected to ship.

## Global usage

```
dex [global options] <command> [command options] [arguments]
```

### Global options

| Option | Description |
|---|---|
| `--json` | Emit machine-readable JSON on stdout (see [JSON output](#json-output)) |
| `--quiet`, `-q` | Suppress non-error output |
| `--verbose`, `-v` | Increase log verbosity (repeatable) |
| `--help`, `-h` | Show help for the command |
| `--version`, `-V` | Print the `dex` version |

Global options may appear before or after the subcommand.

## Command tree

The tree mirrors the command domains of the IPC surface (see
[`Commands.md`](Commands.md)); each subcommand drives the same command the
shell drives.

```
dex
├── theme            manage the active theme                     [M1.4]
├── widget           install, list, remove Widgets               [M3.1]
├── search           query filesystem and Context                [M4.2]
├── secrets          store and retrieve secrets                  [Phase 4]
├── workspace        activate, list, deactivate Workspaces       [M5.5]
├── manifest         validate and inspect Workspace Manifests    [M5.5]
├── snapshot         create and restore Workspace Snapshots      [M5.5]
├── service          start, stop, status of Workspace Services   [M5.5]
├── journal          append and read journal entries             [Phase 5]
├── vault            query the Knowledge Vault                   [M6.2]
├── automation       run and schedule workflows                  [M7.1]
└── plugin           install, list, remove Plugins               [M8.1]
```

The milestone in brackets is the roadmap milestone that delivers the
subcommand. Subcommands without a milestone are planned within the phase
named.

## Subcommand reference

Each subcommand is **planned**; the exact arguments and output schemas are
owned by [`../30-specs/CLI.md`](../30-specs/CLI.md) and the per-domain
specifications. The entries below are the intended surface.

### `dex workspace`

Manage Workspaces — the atomic unit of the developer's day.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex workspace list` | — | list declared Workspaces | M5.5 |
| `dex workspace activate <name>` | `name` | perform Workspace Activation | M5.5 |
| `dex workspace deactivate` | — | leave the active Workspace | M5.5 |

### `dex manifest`

Work with Workspace Manifests.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex manifest validate <path>` | `path` | validate a Workspace Manifest | M5.5 |
| `dex manifest show <name>` | `name` | print a Workspace Manifest | M5.5 |

### `dex snapshot`

Capture and restore Workspace Snapshots.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex snapshot create <name>` | `name` | capture a Workspace Snapshot | M5.5 |
| `dex snapshot restore <name>` | `name` | restore a Workspace to a Snapshot | M5.5 |
| `dex snapshot list` | — | list Snapshots | M5.5 |

### `dex service`

Supervise Workspace Services.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex service start <name>` | `name` | start a Workspace Service | M5.5 |
| `dex service stop <name>` | `name` | stop a Workspace Service | M5.5 |
| `dex service status` | — | report Workspace Service states | M5.5 |

### `dex theme`

Switch and inspect themes.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex theme list` | — | list available themes | M1.4 |
| `dex theme set <name>` | `name` | set the active theme | M1.4 |
| `dex theme get` | — | print the active theme | M1.4 |

### `dex widget`

Manage Widgets.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex widget list` | — | list installed Widgets | M3.1 |
| `dex widget install <id>` | `id` | install a Widget | M3.1 |
| `dex widget remove <id>` | `id` | remove a Widget | M3.1 |

### `dex plugin`

Manage Plugins.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex plugin list` | — | list installed Plugins | M8.1 |
| `dex plugin install <id>` | `id` | install a Plugin | M8.1 |
| `dex plugin remove <id>` | `id` | remove a Plugin | M8.1 |

### `dex search`

Search filesystem and Context.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex search query <term>` | `term` | run a search | M4.2 |

### `dex secrets`

Store and retrieve secrets.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex secrets set <key>` | `key` | store a secret (read from stdin) | Phase 4 |
| `dex secrets get <key>` | `key` | retrieve a secret | Phase 4 |
| `dex secrets delete <key>` | `key` | delete a secret | Phase 4 |

### `dex journal`

Append and read journal entries.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex journal append <text>` | `text` | append an entry | Phase 5 |
| `dex journal read` | — | read recent entries | Phase 5 |

### `dex vault`

Query the Knowledge Vault.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex vault query <term>` | `term` | query the Knowledge Vault | M6.2 |

### `dex automation`

Run and schedule workflows.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex automation run <name>` | `name` | run a workflow | M7.1 |
| `dex automation list` | — | list workflows | M7.1 |

## Exit codes

Exit codes are the CLI's contract with scripts. The set is closed and maps
to the IPC error envelope (see [`Commands.md`](Commands.md)); the exact
mapping is finalized in [`../30-specs/CLI.md`](../30-specs/CLI.md).

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Internal failure |
| `2` | Usage error (unknown command, missing or invalid argument) |
| `3` | Validation failure |
| `4` | Not found |
| `5` | Conflict |
| `6` | Unsupported operation |
| `7` | Permission denied |
| `130` | Interrupted (SIGINT) |

## JSON output

With `--json`, the CLI writes a single JSON object to stdout and no
human-formatted text. The object shape is stable and schema-validated; the
formal schema is owned by [`../30-specs/CLI.md`](../30-specs/CLI.md).

On success:

```json
{ "ok": true, "data": { } }
```

On failure, the error envelope mirrors the IPC `AppError` shape:

```json
{ "ok": false, "error": { "type": "not_found", "message": "no such workspace" } }
```

`error.type` is one of the closed set: `validation`, `not_found`,
`permission_denied`, `conflict`, `unsupported`, `internal`.

## Examples

```bash
# Activate a Workspace
dex workspace activate my-project

# Validate a Workspace Manifest before committing it
dex manifest validate ./dex.workspace.yaml

# Capture a Snapshot, machine-readable
dex --json snapshot create before-refactor

# Set the active theme
dex theme set cyber

# Install a Plugin
dex plugin install org.example.tooling
```

## Related Documents

- CLI contract (formal grammar and schemas):
  [`../30-specs/CLI.md`](../30-specs/CLI.md)
- CLI First principle:
  [`../00-vision/02_Principles.md`](../00-vision/02_Principles.md)
- Command catalog (the IPC surface the CLI drives):
  [`Commands.md`](Commands.md)
- Event catalog:
  [`Events.md`](Events.md)
- Plugin and Widget SDK surface:
  [`PluginsWidgets.md`](PluginsWidgets.md)
- Roadmap and milestones:
  [`../10-product/11_Product_Roadmap.md`](../10-product/11_Product_Roadmap.md)
- Canonical terminology:
  [`../00-vision/03_Glossary.md`](../00-vision/03_Glossary.md)