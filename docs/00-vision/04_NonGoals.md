# DEX Non-Goals

## Purpose

What DEX intentionally does not do. This document is the boundary that
prevents scope creep and keeps the core lightweight. A proposal that lands
here is rejected for the foreseeable future; overturning a non-goal is a
manifesto-level decision, not a roadmap decision.

Non-goals are negative statements of the same strength as the Principles.
Where a Principle says what DEX is, this document says what DEX is not and
will not become.

## Identity boundaries

The Manifesto states these as identity; this document states them as
enforced scope.

- **Not a desktop environment.** DEX does not manage a desktop of icons,
  panels, and menus.
- **Not a window manager.** DEX does not own compositing or window layout;
  it composes with the window manager of the host system.
- **Not an IDE.** DEX does not host an editor or a debugger; it
  orchestrates them.
- **Not an Electron dashboard.** DEX is a native layer over the operating
  system, not a web surface over the desktop.
- **Not a launcher.** Searching and launching are capabilities within the
  Workspace Runtime, not its purpose.
- **Not an AI application.** Intelligence is an optional capability that
  degrades gracefully; it is never the reason DEX exists.

## Scope non-goals

- **DEX does not replace the tools it integrates.** The terminal, the
  editor, the browser, and the shell remain external and first-class. A
  feature that duplicates an existing tool is rejected by principle 11.
- **DEX is not cross-platform-first.** Native First (principle 5) means
  Linux excellence precedes any other platform. Windows and macOS ports
  are not constraints on the design.
- **DEX is not a cloud service.** There is no account, no mandatory
  synchronization, and no telemetry by default. Offline First (principle 2)
  is not a mode of DEX; it is DEX.
- **DEX is not a web application.** There is no server-side runtime, no
  remote-first architecture, and no browser-only mode.
- **DEX does not define its own window manager or compositor.** The host
  system owns windows and compositing; DEX orchestrates through them.
- **DEX does not lock data into proprietary formats.** Workspace Manifests,
  Snapshots, and Vault data are open, documented contracts (the
  specifications). Lock-in contradicts the durability the project exists
  for.
- **DEX is not a general-purpose automation platform.** Automation targets
  the development workflow — Workspaces, services, tooling — not the
  consumer desktop.
- **DEX is not AI-dependent.** No core capability may require a model, an
  API key, or a network. AI is Optional (principle 12) and the core path
  never crosses it.

## How non-goals are enforced

- A proposal that violates a non-goal is rejected at review with a
  citation to this document.
- A proposal to *overturn* a non-goal requires a new Architecture Decision
  Record that names the non-goal, states the cost of keeping it, and is
  reviewed against the Manifesto.
- Roadmap milestones may not schedule non-goal work; the roadmap and this
  document are checked against each other at each phase gate.

## Related Documents

- Identity: [`00_Manifesto.md`](00_Manifesto.md)
- The twelve values: [`02_Principles.md`](02_Principles.md)
- Canonical terminology: [`03_Glossary.md`](03_Glossary.md)
- Product roadmap: [`../10-product/11_Product_Roadmap.md`](../10-product/11_Product_Roadmap.md)
- Architecture decisions: [`../50-adr/`](../50-adr/)