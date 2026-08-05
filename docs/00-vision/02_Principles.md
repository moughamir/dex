# DEX Principles

## Purpose

These twelve principles are the immutable engineering rules of DEX. Every
architectural decision references this document; every Architecture
Decision Record is judged against it. A decision that violates a principle
must be rejected, or must be accompanied by an explicit, documented
exception that names the principle it suspends and the cost it accepts.

The principles are stated as rules, not preferences. Documents live longer
than debates; the rules settle the arguments in advance.

## 1. Workspace First

**Rule:** The Workspace is the atomic unit of the developer's day.
Everything in DEX is organized around declaring, activating, and restoring
complete Workspaces.

**Why:** A developer's work lives in Workspaces, not in applications.
Organizing the system around Workspaces is what makes DEX a Workspace
Runtime rather than a launcher or a dashboard.

**Consequences for architecture:** The Runtime's primary objects and
operations are Workspace-shaped. Windows, processes, and sessions are
subordinate artifacts of a Workspace, and the data model is centered on
the Workspace, the Workspace Manifest, Workspace Activation, and the
Workspace Snapshot.

## 2. Offline First

**Rule:** The machine is fully functional with no network. Local state is
the source of truth; synchronization is layered on top, never required.

**Why:** A developer's machine must not depend on connectivity. The
Runtime, the Knowledge Vault, and every Workspace must work on a laptop
with the network cable pulled.

**Consequences for architecture:** No remote dependency in the core.
Synchronization is an opt-in extension, never a precondition. Secrets and
knowledge stay local; anything that leaves the machine does so by explicit
request.

## 3. CLI First

**Rule:** Every capability is reachable and scriptable from the command
line. A capability that cannot be automated is a capability that does not
exist.

**Why:** Scripting, composition, and repeatability are non-negotiable for
a developer tool. The CLI is the stable, complete surface; the graphical
shell is a second client of the same surface.

**Consequences for architecture:** Every Runtime operation has a CLI form
with a stable interface. The CLI and the shell drive the same commands,
so what works in one works in the other, and nothing is GUI-only.

## 4. Plugin First

**Rule:** Extensibility is designed into the platform from the start,
bounded by a hard security boundary — never added as an afterthought.

**Why:** A platform is defined as much by its extension boundary as by its
core. Retrofitting a plugin system after the core is built produces an
insecure one.

**Consequences for architecture:** The plugin boundary is fixed in
Phase 0 (ADR-0005): Plugins are Rust-hosted, manifest-validated, and
capability-gated; Widgets render in isolated contexts with no direct IPC.

## 5. Native First

**Rule:** Performance and integration with the host Linux system come
before cross-platform reach.

**Why:** DEX is a native layer over the operating system, not a web
surface. Native behavior — Wayland integration, GPU compositing,
keyboard-first input, filesystem and Hyprland access — is the product.

**Consequences for architecture:** Rust owns all system access; the shell
window is transparent and composited; there is no Electron. Cross-platform
reach is a later consideration, never a constraint on the Linux design.

## 6. Context over Applications

**Rule:** Applications are means, not ends. DEX is organized around the
developer's Context and treats applications as tools within it.

**Why:** The user's mental model is "what am I working on", not "which
program is in front of me". Interfaces that lead with Context respect that
model; interfaces that lead with applications re-create the desktop
environment DEX is not.

**Consequences for architecture:** The active Workspace and its Context
are the top-level model of the shell. Application windows are artifacts of
Context — launched, arranged, and restored by the Runtime.

## 7. Lightweight Core

**Rule:** The core does as little as possible, well. Everything that can
live outside the core lives outside it.

**Why:** A small core is auditable, testable, and stable. Every feature
carried in the core is carried forever, in every build, on every user.

**Consequences for architecture:** The core is the Workspace Runtime, the
IPC and security boundary, and the lifecycle machinery. Features live in
`features/`, extensions live in Plugins, and the core surface stays small
enough to hold in one head.

## 8. Strong Typing

**Rule:** Every seam between components is a typed contract. Unchecked
boundaries are where systems rot.

**Why:** DEX crosses a language boundary — TypeScript and Rust — at every
IPC call. Without schema validation at both edges, a mismatch becomes a
runtime failure in production instead of a type error in the editor.

**Consequences for architecture:** Every IPC command is schema-validated
at both edges (ADR-0002). Registries reject duplicates, invalid payloads
are dropped, and the wire contract lives in exactly two places: the
command registry and the Rust handler.

## 9. Composition over Inheritance

**Rule:** Capabilities are composed from small pieces with clear
boundaries, not inherited from large ones.

**Why:** Inheritance couples what should vary. Composition keeps each
piece small, testable, and replaceable — the difference between a platform
and a monolith.

**Consequences for architecture:** Features are vertical slices composed of
components, services, stores, types, and utilities. Shared logic is
promoted to `core/` or `ui/primitives/`; it is never copy-pasted and never
subclassed into a hierarchy.

## 10. Feature First Architecture

**Rule:** The codebase is structured around product features, so the
architecture maps to the product rather than to a framework.

**Why:** When the repository mirrors the product, a new engineer finds the
feature they are asked to change, and the cost of a feature is visible in
its folder.

**Consequences for architecture:** Business features live in
`features/<feature>/` owning their components, services, stores, types,
and utilities. Features never import other features; shared infrastructure
moves to `core/`.

## 11. Integrate, Don't Replace

**Rule:** DEX composes with the terminal, the editor, the browser, and the
shell. It never seeks to absorb them.

**Why:** The tools a developer already uses are the tools they are fastest
with. Replacing them would make DEX a competitor to its own ecosystem
instead of the layer that orchestrates it.

**Consequences for architecture:** DEX drives external tools — launches
them, restores their state, feeds them Context — and re-implements only
what no existing tool provides. A feature that duplicates an existing tool
is a candidate for removal, not a roadmap item.

## 12. AI is Optional

**Rule:** Intelligence is a feature, not an identity. Every AI capability
degrades gracefully to a fully manual workflow.

**Why:** DEX must be complete without a model, an API key, or a network.
AI is valuable exactly when it is optional: when its absence costs nothing
and its presence never blocks the core path.

**Consequences for architecture:** AI capabilities sit behind Providers and
are never on the critical path of the Workspace Runtime. The Knowledge
Vault works without intelligence; intelligence is a consumer of the Vault.

## Related Documents

- Identity: [`00_Manifesto.md`](00_Manifesto.md)
- Canonical terminology: [`03_Glossary.md`](03_Glossary.md)
- Boundary of scope: [`04_NonGoals.md`](04_NonGoals.md)
- System architecture: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Architecture decisions: [`../50-adr/`](../50-adr/)