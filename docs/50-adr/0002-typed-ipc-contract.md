# ADR-0002: Typed IPC Contract with Boundary Validation

- Status: Accepted
- Date: 2026-08-04
- Deciders: Principal Architect
- Scope: The UI ⇄ Rust communication boundary — the most-used seam in the system

## Context

Every feature talks to Rust for system access. At 100k+ LOC the boundary must
fail loudly and locally, not as "it worked in dev" runtime surprises. Tauri 2
gives us: serde-typed Rust commands on one side, `invoke` returning
`Promise<unknown>` on the other. Without discipline, drift between the Rust
types, the TS types, and the wire format goes undetected until a command
misfires in production.

`zod` is already a dependency (`package.json`), which makes schema validation
at the frontend edge nearly free. Tauri deserializes command args into typed
Rust structs, so the Rust edge already validates on the way in.

## Decision

1. **Two validation edges, each owning its side:**
   - Rust edge: commands take **exactly one `#[derive(Deserialize)]` struct
     arg** (`GreetArgs`-style). **No `#[serde(rename_all = ...)]`** on arg or
     result structs — serde defaults (snake_case field naming) are the wire
     authority. Individual-parameter commands are forbidden. Results are
     `#[derive(Serialize)]` structs or `Result<T, AppError>`.
   - Frontend edge: every command is described by a zod schema pair
     (args + result). `invoke` validates args before the round trip (fail
     fast) and the result after (detect contract drift). See `core/api/tauri.ts`.
   - **Wire shape (Tauri 2 gotcha):** Tauri keys invoke payloads by the Rust
     parameter name. Because commands declare their single struct arg as
     `args`, the frontend must send `{ args: { ...fields } }` — field-spread
     payloads fail with `command <name> missing required key args`. The shared
     `invoke` owns this wrap; contract clients always pass plain fields.

2. **Contract definition** lives in `core/api/commands.ts`:

   ```ts
   // core/api/commands.ts
   export interface CommandContract<A extends z.ZodType, R extends z.ZodType> {
     readonly name: string; // must equal the Rust #[tauri::command] fn name
     readonly args: A;
     readonly result: R;
   }
   export const defineCommand = <A extends z.ZodType, R extends z.ZodType>(
     name: string, args: A, result: R,
   ): CommandContract<A, R> => ({ name, args, result });
   ```

   A single registry (`COMMANDS`) lists every contract; a command is not
   callable until it is registered there AND in Rust's `invoke_handler`.
   Grep-ability: all IPC names appear in exactly two files
   (`core/api/commands.ts` + `src-tauri/src/lib.rs`).

3. **One contract client per command domain** in `core/services/<domain>.ts`
   mirroring `src-tauri/src/commands/<domain>.rs`. The client exports typed
   async functions built on the shared `invoke` — the only public surface
   features may use. `@tauri-apps/api` is imported nowhere outside `core/api/`.

4. **Error envelope** — Rust `AppError` gets a **manual `Serialize` impl**
   emitting exactly `{ "type": string, "message": string }` (see
   `src-tauri/src/utils/errors.rs`); derived serialization is forbidden.
   `type` comes from a **closed code set**: `validation`, `not_found`,
   `permission_denied`, `conflict`, `unsupported`, `internal`. Frontend
   `core/api/tauri.ts` mirrors the set as a zod union and validates every
   rejection against it; anything else is a transport error. Exactly two
   error shapes reach callers: the structured envelope and a transport
   (string/unknown) rejection — both normalized to `IpcError`. Infallible
   commands return `Ok(())` (`z.null()` on the frontend).

5. **Events (Rust → UI push)** — `core/api/events.ts` provides a typed
   `onEvent<T>(name, schema, handler)` wrapper over Tauri's `listen` with
   payload validation; invalid payloads are logged and dropped, never thrown
   into the handler. Event names are `dex.<domain>.<event>` and must be
   declared in the `EVENTS` registry in `core/api/events.ts`; only
   `src-tauri/src/events/` emits.

6. **Deferred (documented, not built):** runtime validation on the Rust side
   beyond serde (e.g., semantic validation in command handlers) lives in the
   command/service logic itself, feature by feature.

## Consequences

- New IPC surface costs: 1 Rust command + registration + 1 contract + 1
  contract client + schemas. The pattern is fully type-checked end to end.
- Contract drift fails the zod parse at the boundary with a message naming the
  command and the offending field, instead of `undefined` deep in UI code.
- Strict ordering for command naming: command fn name (Rust), contract name
  (TS) and `tauri.conf`/capability grants must agree; capability grants for new
  plugins are added in `src-tauri/capabilities/default.json`.
- Slight per-call validation cost (one parse each way) is accepted; schema
  objects are module-level singletons, and zod parses are allocation-light.
