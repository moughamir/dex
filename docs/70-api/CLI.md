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
| `--workspace <path>` | Run the command against the workspace at `path` |
| `--verbose` | Increase log verbosity |

Help and version are subcommands rather than flags: `dex help [command]`
and `dex version`. Global options may appear before or after the subcommand.

## Command tree

The tree mirrors the command domains of the IPC surface (see
[`Commands.md`](Commands.md)); each subcommand drives the same command the
shell drives.

```
dex
├── init             write a Workspace Manifest                       [M5.5]
├── activate         perform Workspace Activation                     [M5.5]
├── snapshot         capture a Workspace Snapshot                     [M5.5]
├── restore          restore a Workspace to a Snapshot                [M5.5]
├── service          start, stop, status, list Services               [M5.5]
├── plugin           install, list, update, uninstall Plugins         [M8.1]
├── widget           install, list, enable, disable Widgets           [M3.1]
├── vault            query, add, search the Knowledge Vault           [M6.2]
├── theme            list, set, validate themes                       [M1.4]
├── journal          show and export journal entries                  [Phase 5]
├── secrets          store and retrieve secrets                       [Phase 4]
├── automation       run, list, validate workflows                    [M7.1]
├── help             show help for a command
└── version          print the `dex` version
```

The milestone in brackets is the roadmap milestone that delivers the
subcommand. `help` and `version` are always available and have no milestone;
every other subcommand is planned within the phase or milestone named.

## Subcommand reference

Each subcommand is **planned**; the exact arguments and output schemas are
owned by [`../30-specs/CLI.md`](../30-specs/CLI.md) and the per-domain
specifications. The entries below are the intended surface.

### `dex init`

Write a Workspace Manifest.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex init` | — | write a Workspace Manifest | M5.5 |

### `dex activate`

Perform Workspace Activation.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex activate <workspace>` | `workspace` | activate the named Workspace | M5.5 |

### `dex snapshot`

Capture a Workspace Snapshot.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex snapshot <workspace>` | `workspace` | capture a Snapshot of the Workspace | M5.5 |

### `dex restore`

Restore a Workspace to a Snapshot.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex restore <snapshot>` | `snapshot` | restore a Workspace to a Snapshot | M5.5 |

### `dex service`

Supervise Workspace Services.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex service start <name>` | `name` | start a Service | M5.5 |
| `dex service stop <name>` | `name` | stop a Service | M5.5 |
| `dex service status` | — | report Service states | M5.5 |
| `dex service list` | — | list Services | M5.5 |

### `dex plugin`

Manage Plugins.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex plugin install <manifest>` | `manifest` | install a Plugin from a manifest | M8.1 |
| `dex plugin list` | — | list installed Plugins | M8.1 |
| `dex plugin update <id>` | `id` | update an installed Plugin | M8.1 |
| `dex plugin uninstall <id>` | `id` | uninstall a Plugin | M8.1 |

### `dex widget`

Manage Widgets.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex widget install <manifest>` | `manifest` | install a Widget from a manifest | M3.1 |
| `dex widget list` | — | list installed Widgets | M3.1 |
| `dex widget enable <id>` | `id` | enable an installed Widget | M3.1 |
| `dex widget disable <id>` | `id` | disable an installed Widget | M3.1 |

### `dex vault`

Query the Knowledge Vault.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex vault query <terms>` | `terms` | query the Knowledge Vault | M6.2 |
| `dex vault add <note>` | `note` | add a note to the Knowledge Vault | M6.2 |
| `dex vault search <terms>` | `terms` | search the Knowledge Vault | M6.2 |

### `dex theme`

Switch and inspect themes.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex theme list` | — | list available themes | M1.4 |
| `dex theme set <name>` | `name` | set the active theme | M1.4 |
| `dex theme validate <manifest>` | `manifest` | validate a theme manifest | M1.4 |

### `dex journal`

Read journal entries.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex journal show` | — | show journal entries | Phase 5 |
| `dex journal export` | — | export journal entries | Phase 5 |

### `dex secrets`

Store and retrieve secrets.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex secrets set <key>` | `key` | store a secret (read from stdin) | Phase 4 |
| `dex secrets get <key>` | `key` | retrieve a secret | Phase 4 |
| `dex secrets rotate <key>` | `key` | rotate a secret | Phase 4 |
| `dex secrets revoke <key>` | `key` | revoke a secret | Phase 4 |

### `dex automation`

Run and inspect workflows.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex automation run <workflow>` | `workflow` | run a workflow | M7.1 |
| `dex automation list` | — | list workflows | M7.1 |
| `dex automation validate <manifest>` | `manifest` | validate a workflow manifest | M7.1 |

### `dex help`

Show help for a command.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex help [command]` | `command` (optional) | show help for a command | — |

### `dex version`

Print the `dex` version.

| Subcommand | Arguments | Description | Milestone |
|---|---|---|---|
| `dex version` | — | print the `dex` version | — |

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
| `5` | Permission denied |
| `6` | Conflict |
| `7` | Unsupported operation |
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
dex activate my-project

# Write a Workspace Manifest before committing it
dex init ./dex.workspace.yaml

# Capture a Snapshot, machine-readable
dex --json snapshot my-project

# Set the active theme
dex theme set cyber

# Install a Plugin from a manifest
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