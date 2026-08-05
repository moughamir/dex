# Documentation Audit Fixes — Writer Agent Prompt

## Context

A 12-pass documentation audit of the DEX `docs/` tree identified 9 issues across critical, high, and medium severity. This prompt covers the 5 critical and high-priority fixes that must be completed before Phase 1 development begins.

## Issues to Fix

### CRITICAL 1: ADR Numbering Conflicts

**Location:** `docs/50-adr/`

**Problem:** Five pairs of duplicate ADR numbers exist — every number from 0001–0005 has two files:

| Number | Populated File | Empty Duplicate |
|--------|---------------|-----------------|
| 0001 | `0001-layer-ownership.md` (6.6KB) | `0001-workspace-first.md` (0 bytes) |
| 0002 | `0002-typed-ipc-contract.md` (4.6KB) | `0002-offline-first.md` (0 bytes) |
| 0003 | `0003-design-tokens.md` (2.9KB) | `0003-cli-first.md` (0 bytes) |
| 0004 | `0004-transparent-compositing.md` (2.3KB) | `0004-plugin-system.md` (0 bytes) |
| 0005 | `0005-plugin-boundary.md` (2.1KB) | `0005-native-integration.md` (0 bytes) |

Additionally, `0006-threejs-renderer.md` (0 bytes) is unique but empty.

**Fix:**
1. Read all files in `docs/50-adr/` to understand current state
2. Delete all empty duplicate files (they are 0-byte placeholders):
   - `0001-workspace-first.md`
   - `0002-offline-first.md`
   - `0003-cli-first.md`
   - `0004-plugin-system.md`
   - `0005-native-integration.md`
   - `0006-threejs-renderer.md`
3. Verify no other files reference the deleted filenames
4. Update any cross-references if needed

**Acceptance Criteria:**
- All ADR files have unique numbering
- No broken cross-references
- Empty files are either removed or renumbered without conflicts

---

### CRITICAL 2: Populate Guides Layer

**Location:** `docs/80-guides/`

**Problem:** All 5 guide files are empty:
- `CreatingPlugin.md`
- `CreatingWidget.md`
- `CreatingTheme.md`
- `CreatingWorkspace.md`
- `UsingAI.md`

**Fix:** Populate each guide with practical how-to content based on the corresponding specs and architecture docs.

**For `CreatingPlugin.md`:**
- Reference `30-specs/PluginAPI.md` for the formal contract
- Reference `20-architecture/27_Plugins.md` for architecture
- Include: Prerequisites, Project setup, Manifest creation, Command registration, Event handling, Testing, Installation
- Include code examples (TypeScript for manifest, Rust for commands)

**For `CreatingWidget.md`:**
- Reference `30-specs/WidgetAPI.md` for the formal contract
- Include: Prerequisites, Widget structure, Sandboxed API usage, Shell-mediated commands, Positioning, Testing

**For `CreatingTheme.md`:**
- Reference `40-engineering/DesignSystem.md` for tokens
- Reference `30-specs/Theme.md` for the formal theme contract
- Include: Token architecture, Color palette definition, Typography, Motion, Theme switching, Persistence

**For `CreatingWorkspace.md`:**
- Reference `30-specs/Workspace.md` for lifecycle
- Reference `30-specs/Manifest.md` for manifest format
- Include: Creating a manifest, Declaring sessions, Declaring Workspace Services, Activation, Snapshots

**For `UsingAI.md`:**
- Reference `30-specs/Knowledge.md` for Knowledge Vault
- Reference `20-architecture/26_AI_Architecture.md` for AI architecture
- Include: Knowledge Vault basics, Connecting a Memory Provider, Querying the Vault, Disabling AI

**Acceptance Criteria:**
- Each guide has Purpose, Prerequisites, Steps, Examples, Related Documents sections
- Guides reference formal specs (not duplicate them)
- Code examples are realistic and follow project conventions
- Each guide is 100-200 lines

---

### CRITICAL 3: Populate Dev Files

**Location:** `docs/90-dev/`

**Problem:** 3 of 5 dev files are empty:
- `Debug.md`
- `ProjectStructure.md`
- `Profiling.md`

**Fix:**

**For `Debug.md`:**
- Reference `90-dev/Build.md` for build context
- Include: Frontend debugging (browser DevTools, Vite HMR), Rust debugging (cargo check, rust-gdb), IPC debugging (invoke logging, error envelope), Log plugin output locations, Common failure modes and diagnosis

**For `ProjectStructure.md`:**
- Reference `20-architecture/20_System_Architecture.md` for layer model
- Include: Repository layout diagram, `src/` frontend structure, `src-tauri/` Rust structure, `docs/` hierarchy, Key files and their roles, Wiring rules (ADR-0002 checklist)

**For `Profiling.md`:**
- Reference `40-engineering/Performance.md` for budgets
- Include: Performance budgets (cold start <500ms, 60 FPS, <200 MB idle), Frontend profiling (Chrome DevTools Performance tab), Rust profiling (cargo flamegraph), Memory measurement, FPS monitoring, When to optimize

**Acceptance Criteria:**
- Each file has Purpose, Content, Related Documents sections
- Content is practical and actionable
- References to other docs use relative paths
- Each file is 80-150 lines

---

### HIGH 4: Populate Release Engineering

**Location:** `docs/40-engineering/Release.md`

**Problem:** Empty file, but Release is M9.5 in roadmap

**Fix:** Create release process document.

**Structure:**
```markdown
# Release Process

## Purpose
[How DEX releases are built, tested, and published]

## Release Cycle
- Semantic versioning (MAJOR.MINOR.PATCH)
- Phase gates as release milestones

## Build Process
- Frontend build (`bun run build`)
- Rust build (`cargo build --release`)
- Tauri bundler (`bun run tauri build`)

## Packaging Targets
- Arch Linux (pacman/AUR)
- AppImage
- Flatpak

## Testing Gate
- `bun run check` passes
- `cargo check` passes
- `cargo test` passes
- Manual verification on Hyprland

## Release Checklist
[Step-by-step release process]

## Post-Release
- Tag creation
- Changelog update
- Announcement

## Related Documents
[Links to Build.md, CodingStandards.md, ProductRoadmap.md]
```

**Acceptance Criteria:**
- Covers build, packaging, testing, and publishing
- References existing build docs
- 60-100 lines

---

### HIGH 5: Add Missing Glossary Terms

**Location:** `docs/00-vision/03_Glossary.md`

**Problem:** Several terms used in docs are not defined in Glossary

**Fix:** Add the following terms:

```markdown
## Automation Terms

**Trigger** — An event that starts a Workflow execution (file change, cron schedule, CLI command, startup).

**Condition** — A test evaluated before a Workflow action executes; if false, the action is skipped.

**Action** — A single operation performed by a Workflow (run command, send notification, activate Workspace).

**Result** — The outcome of a Workflow action (success, failure, partial).

**Workflow** — A sequence of Trigger → Condition → Action → Result steps that automate a development routine.

**Macro** — A recorded sequence of keyboard, mouse, or shell operations that can be replayed.

**Scheduler** — The Runtime component that fires Triggers on cron schedules or system events.

**Smart Action** — An AI-generated Workflow created from natural language description.

## Other Terms

**Desktop Experience** — Alternative expansion of DEX; used in architecture docs but not the canonical product name.

**omnizya-dex** — The Rust crate name for the DEX backend (library target: `omnizya_dex_lib`).
```

**Acceptance Criteria:**
- All terms used in docs appear in Glossary
- Definitions are concise (1-2 sentences)
- Terms are grouped logically

---

## Execution Order

1. Fix ADR numbering (CRITICAL 1) — no dependencies
2. Add Glossary terms (HIGH 5) — no dependencies
3. Populate Release engineering (HIGH 4) — depends on Build.md reference
4. Populate Dev files (CRITICAL 3) — depends on Build.md, Architecture docs
5. Populate Guides (CRITICAL 2) — depends on Specs, Architecture docs

## Verification

After all fixes:
1. Run `bun run check` (if applicable to doc changes)
2. Verify all relative links resolve
3. Verify Glossary contains all used terms
4. Verify no ADR numbering conflicts remain
