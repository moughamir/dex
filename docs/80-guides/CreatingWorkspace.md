# Creating and Activating a Workspace

## Purpose

A Workspace is the atomic unit of a developer's work. It is declared by a
Workspace Manifest, brought to life by Workspace Activation, made recoverable
by a Workspace Snapshot, and kept dependable by supervised Workspace Services.
This guide walks one Workspace through the complete lifecycle: author the
Manifest, validate it, activate it, add a Workspace Service, capture a
Snapshot, and restore it.

The contracts are authoritative; this guide references them rather than
redefining them. Field names and semantics: [`Manifest.md`](../30-specs/Manifest.md).
Lifecycle and service supervision: [`Workspace.md`](../30-specs/Workspace.md).
Snapshot capture and restore: [`Snapshot.md`](../30-specs/Snapshot.md).
Command surface: [`CLI.md`](../30-specs/CLI.md) and
[`../70-api/CLI.md`](../70-api/CLI.md).

## Capability gates

The `dex` CLI is planned, not shipped. Phase 0 is the current phase (M0.4
open) and no CLI binary exists. Per the roadmap and the CLI reference, the
command domains this guide uses — `dex workspace`, `dex manifest`,
`dex snapshot`, `dex service` — are delivered by the Phase 5 Workspace Manager
milestone (**M5.5**), which also delivers the Workspace Service supervisor
that backs the `service` domain. The CLI binary's first command domains are
expected at Phase 4 **M4.1** (Rust Core). Until a milestone lands, the
commands below are the intended surface, and the same commands are driven by
the graphical shell when they ship (CLI First, principle 3), so the steps
transfer unchanged.

## Prerequisites

- DEX built and running. Verification order: `bun run check`, `cargo check`
  in `src-tauri/`, then `bun run tauri dev` on a Wayland/Hyprland session.
- The `dex` CLI on `PATH` (after M5.5; see Capability gates).
- A project directory that will become the Workspace root; the Manifest lives
  there as a file.
- For Step 4: the executable the declared service runs (here `bun`) installed.

## Step 1 — Author the Workspace Manifest

**Why.** The Manifest is the contract between a Workspace and the Workspace
Runtime: the same declaration activates the Workspace on any machine. A file
is diffable, reviewable, and scriptable — the CLI First surface for declaring
a Workspace. Authoring by hand is the canonical path; `dex init` scaffolds the
same file at a target path.

1. Create `dex.workspace.yaml` at the project root:

```yaml
manifest: dex.workspace
version: 1.0.0

id: arcade-engine
name: Arcade Engine
description: Core development workspace for the arcade engine project.

sessions:
  - id: terminal-main
    kind: terminal
    command: [fish]
    cwd: .
    workspace_dir: true

snapshot_policy:
  enabled: true
  periodic:
    interval: 30m
  on_leave: true
  retention: 12
```

2. Check the declared fields against the schema
   ([`Manifest.md`](../30-specs/Manifest.md)): `manifest` is the literal marker
   `dex.workspace`; `version` is the schema version `1.0.0`; `id` is a stable
   slug `[a-z0-9-]`; `name` is required. `description`, `sessions`, and
   `snapshot_policy` are optional. The `snapshot_policy` here is internally
   consistent: `periodic` is present because `enabled` is true, and `on_leave`
   is also true.

Expected: the file exists with exactly these top-level fields. The Runtime
accepts only fields it knows — unknown fields are rejected, never ignored.

## Step 2 — Validate the Manifest

**Why.** Validation runs before acceptance, at declaration and at every
resolution. A Manifest that fails validation is rejected with an `AppError` of
type `validation`; the Runtime never partially applies a Manifest. Validating
before declaring turns a typo into a typed error instead of a broken
Workspace.

1. Run `dex manifest validate ./dex.workspace.yaml`.

Expected: exit code `0`; with `--json`, stdout is
`{ "ok": true, "data": { } }`.

2. Confirm the rejection path. Add an unknown top-level field — a typo is the
   realistic case:

```yaml
service:
  - id: dev-server
    kind: process
```

3. Re-run `dex manifest validate ./dex.workspace.yaml`.

Expected: exit code `3`; the error envelope is
`{ "ok": false, "error": { "type": "validation", "message": "..." } }` and the
message names the unknown field. This is the documented contract: unknown
fields are rejected, never ignored — silent tolerance hides typos and version
drift. The same rule applies to unknown fields inside a known object.

4. Remove the unknown field, then break a rule — for example set
   `id: Arcade Engine` (uppercase, space).

Expected: exit code `3`; `validation`; the message names the slug rule
(`[a-z0-9-]`). Restore `id: arcade-engine` before continuing.

The enforced rules, in full, live in
[`Manifest.md`](../30-specs/Manifest.md): required fields (`manifest`,
`version`, `id`, `name`); `id` is a `[a-z0-9-]` slug; `version` is a supported
schema semver; `services[].id` and `sessions[].id` are unique; `snapshot_policy`
is internally consistent; hooks and commands are well-formed argv when present.

## Step 3 — Activate the Workspace

**Why.** Workspace Activation is the central act of DEX — the transition from
"declared" to "live". The Runtime resolves the Manifest first, starts declared
Workspace Services before sessions, launches sessions and apps, restores
window layout, and only then re-establishes Context.

1. Run `dex workspace activate arcade-engine`.

Expected: exit code `0`; the lifecycle moves `declared → activating → active`;
the terminal session launches; window layout is restored; Context is
re-established. `dex workspace list` reports state `active`.

2. Re-run `dex workspace activate arcade-engine`.

Expected: exit code `6` (`conflict`); the Runtime rejects re-activating an
`active` Workspace. Activation is idempotent in effect: activating a `paused`
Workspace resumes rather than relaunches.

Note: if a step of Activation fails, the Workspace moves to `failed` — the
Runtime never leaves a Workspace in a transient state. Recovery is explicit
(`recover()`, per [`Workspace.md`](../30-specs/Workspace.md)); see
Troubleshooting.

## Step 4 — Add a Workspace Service

**Why.** A Workspace Service is a managed subsystem the Workspace declares and
depends on — a database, a build daemon, a development server. Declared in the
Manifest, its lifecycle is owned by the Runtime: started during Activation,
supervised while the Workspace is `active`, stopped on leave. The state of a
project's supporting processes becomes part of the Workspace, not an accident
of what happened to be running.

1. Edit `dex.workspace.yaml` and add a `services:` section:

```yaml
services:
  - id: dev-server
    name: Vite Dev Server
    kind: process
    command: [bun, run, dev]
    cwd: .
    health_check:
      type: tcp
      probe: 127.0.0.1:1420
      interval_ms: 2000
      timeout_ms: 500
      grace_period_ms: 10000
    restart_policy:
      mode: on_failure
      max_restarts: 3
      backoff_ms: 1500
```

Field semantics are in [`Manifest.md`](../30-specs/Manifest.md): `kind` is the
service backend (`process`); `command` is the argv; `health_check` declares the
probe and its timings; `restart_policy.mode` is one of `always` | `on_failure` |
`never`.

2. Validate the edited Manifest: `dex manifest validate ./dex.workspace.yaml`.

Expected: exit code `0`.

3. Apply the new declaration. Leave the Workspace, then activate it again:
   `dex workspace deactivate` followed by `dex workspace activate arcade-engine`.

Expected: the service starts during Activation, before sessions; `dex service
status` reports the service `running`; the health check passes.

4. Confirm supervision. Stop the service process out of band (or run
   `dex service stop dev-server`), then observe.

Expected: the Runtime applies `restart_policy` (`on_failure`, `max_restarts`
3, `backoff_ms` 1500); a successful health check resets the restart count;
`dex service status` always reflects the supervised state. Stopping services on
`leave` happens in reverse declaration order (dependents before dependencies).

## Step 5 — Capture a Snapshot

**Why.** The Manifest is the reproducible floor; the Snapshot is the
recoverable ceiling. The declaration does not capture where work actually left
off — which files are open, what the sessions hold, what Context is active. A
Workspace Snapshot does.

1. Run `dex snapshot create before-refactor`.

Expected: exit code `0`. The capture protocol runs in order: Workspace Services
quiesce, service state and window layout are captured, sessions and open files
are captured, Context is read from the Knowledge Vault, the immutable Snapshot
object is written and checksum-verified, and services resume. The capture is
journaled.

2. Confirm: `dex snapshot list`.

Expected: the Snapshot appears with its `snapshot_id`, `workspace_id`,
`manifest_ref`, and `captured_at`.

3. Take a second Snapshot: `dex snapshot create after-setup`.

Expected: two Snapshot records exist. Snapshots are immutable and never
overwritten; retention prunes whole Snapshots oldest-first (here, keeping 12,
per `snapshot_policy.retention`).

Note: a Snapshot never captures filesystem or working-tree contents — code is
versioned by the developer's own tools. Files are captured by reference (paths
and open states), never by content.

## Step 6 — Restore a Snapshot

**Why.** Restore is the recovery path: after a failed experiment, a reboot, or
a broken change, a Snapshot returns the Workspace to exactly where work left
off — not to a clean slate.

1. Disrupt the Workspace, for example close the session and leave:
   `dex workspace deactivate`.

2. Run `dex snapshot restore before-refactor`.

Expected: exit code `0`; the Workspace returns to `active`. Restore validates
the Snapshot (`schema_version`, checksum, `manifest_ref`), resolves the
declaring Manifest, starts declared services fresh and health-checks them,
restores session state, window layout, and Context. Restore is atomic in
effect: it completes and leaves the Workspace `active`, or it fails and leaves
it `failed` — there is no partially-restored Workspace.

Restore semantics, in full, live in [`Snapshot.md`](../30-specs/Snapshot.md):
session state, window layout, and Context are restored exactly; Workspace
Service *processes* are re-derived (restarted fresh from the Manifest, then
health-checked) so Snapshots stay portable across machines and architectures;
open files are restored as references, with contents coming from the filesystem
and the developer's VCS.

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| Validation exits `3`, `error.type` is `validation`, message names a field | A top-level or nested field outside the schema — a typo or version drift | Remove the unknown field and re-validate. Unknown fields are rejected by contract. |
| Validation names `id` or `version` | `id` is not a `[a-z0-9-]` slug, or `version` is not a supported schema version | Fix the slug, or pin a supported schema version; an unsupported-version error names the supported range. |
| Activation fails at a service; the Workspace is `failed` | A declared service could not start: bad command path, missing executable, or an unreachable health-check probe | Fix the service declaration (`command`, `health_check` probe/timeouts, `grace_period_ms`), run `recover()` (or redeclare) to return the Workspace to `declared`, then activate again. |
| A service is marked `failed` while the Workspace is `active` | Restart budget exhausted (`max_restarts`) or health checks keep failing | Inspect with `dex service status`; fix the service declaration, then recover and reactivate. |
| Restore refuses with `validation` | The Snapshot's `schema_version` is not supported by the current Runtime | The error names the supported range; capture a fresh Snapshot on the current Runtime. |
| `dex workspace activate` exits `6` (`conflict`) | The Workspace is already `active` | Deactivate first, or activate a `paused` Workspace to resume. |

Every lifecycle transition is recorded in the Journal
([`Journal.md`](../30-specs/Journal.md)); `dex journal show` reports the prior
and new state for any failure, including aborted Activations and refused
restores.

## Related Documents

- Canonical terminology: [`../00-vision/03_Glossary.md`](../00-vision/03_Glossary.md)
- Workspace First, CLI First principles: [`../00-vision/02_Principles.md`](../00-vision/02_Principles.md)
- The Workspace Runtime narrative: [`../10-product/15_Workspace_Runtime.md`](../10-product/15_Workspace_Runtime.md)
- Roadmap and milestone gates (M5.5): [`../10-product/11_Product_Roadmap.md`](../10-product/11_Product_Roadmap.md)
- System architecture and layer model: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Layer ownership (frontend never touches SQLite or the shell): [`../50-adr/0001-layer-ownership.md`](../50-adr/0001-layer-ownership.md)
- Typed IPC contract: [`../50-adr/0002-typed-ipc-contract.md`](../50-adr/0002-typed-ipc-contract.md)
- Workspace Manifest contract: [`../30-specs/Manifest.md`](../30-specs/Manifest.md)
- Workspace contract (lifecycle, services): [`../30-specs/Workspace.md`](../30-specs/Workspace.md)
- Snapshot contract: [`../30-specs/Snapshot.md`](../30-specs/Snapshot.md)
- Journal contract: [`../30-specs/Journal.md`](../30-specs/Journal.md)
- CLI contract: [`../30-specs/CLI.md`](../30-specs/CLI.md)
- CLI reference: [`../70-api/CLI.md`](../70-api/CLI.md)
- Command catalog: [`../70-api/Commands.md`](../70-api/Commands.md)
- Sibling guides: [`CreatingPlugin.md`](CreatingPlugin.md), [`CreatingWidget.md`](CreatingWidget.md), [`CreatingTheme.md`](CreatingTheme.md)
