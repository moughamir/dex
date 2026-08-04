# ADR-0005: Plugin Boundary and CSP Baseline

- Status: Accepted
- Date: 2026-08-04
- Deciders: Principal Architect (with architecture review)
- Scope: Native extension boundary + shell web-security baseline

## Context

DEX will ship a widget/plugin ecosystem (roadmap Phases 3 and 8). The shell
is a single Tauri webview with full typed IPC access; if third-party code
ever ran inside that privileged context it could reach the filesystem
through the same typed surface as the shell itself. The boundary must be
fixed in Phase 0, because CSP and capability grants are cheap to set now and
expensive to retrofit later.

## Decision

1. **Plugins are Rust-hosted extensions** of `src-tauri/` — not arbitrary
   web code in the privileged webview. A plugin = manifest + command/event
   surface + capability grants, loaded and versioned by the host.
2. **Manifests are schema-validated (zod) at install/update**; unknown
   fields are rejected, never silently ignored.
3. **Per-plugin capability grants** in `src-tauri/capabilities/*.json`.
   A plugin gets exactly the permissions it declares — no default elevation.
4. **Plugin UI (future widget layer) renders in isolated contexts**
   (sandboxed iframe/separate origin) with no IPC access of its own; all
   effects go through shell-mediated commands. Widgets never import
   `@tauri-apps/api`.
5. **Strict CSP from Phase 0** (`tauri.conf.json`):

   ```
   default-src 'self'; style-src 'self' 'unsafe-inline';
   img-src 'self' data:; connect-src ipc: http://ipc.localhost
   ```

   Dev-mode HMR (Vite websocket) may require temporary relaxation during
   development — never ship the loosened policy.

## Consequences

- New native extensions require: manifest + capability grant + review; the
  shell surface stays small and auditable.
- CSP is the blast-radius reducer: even a compromised renderer cannot fetch
  arbitrary origins or run inline scripts.
- Widget development must use the sandbox API from day one (Phase 3 M3.1) —
  the SDK contract is part of the widget boundary, not an afterthought.
