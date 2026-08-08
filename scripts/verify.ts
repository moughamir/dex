/**
 * M0.4 authoritative verification gate.
 *
 * Runs every check that CI runs, in a fixed order, fail-fast. Mirrors the
 * package.json `cargo:*` scripts exactly (all pass `--manifest-path`, so this
 * script is cwd-independent). Exit code is the failing step's code, or 0.
 *
 *   bun run verify
 */

import { $ } from "bun";

const ROOT = import.meta.dir;

const STEPS = [
  { name: "frontend formatting (prettier --check src/)", script: "format:check" },
  { name: "backend formatting (cargo fmt --check)", script: "cargo:fmt:check" },
  { name: "frontend lint (eslint src/)", script: "lint" },
  { name: "frontend types (svelte-check)", script: "check" },
  { name: "backend lint (cargo clippy -D warnings)", script: "cargo:clippy" },
  { name: "backend types (cargo check)", script: "cargo:check" },
  { name: "frontend tests (vitest)", script: "test" },
  { name: "frontend production build (vite build)", script: "build" },
  { name: "backend tests (cargo test)", script: "cargo:test" },
] as const;

function fail(step: string, code: number): never {
  console.error(`\n[verify] FAILED: ${step} (exit ${code})`);
  process.exit(code);
}

for (let i = 0; i < STEPS.length; i++) {
  const step = STEPS[i];
  console.log(`\n[verify] [${i + 1}/${STEPS.length}] ${step.name}`);
  const proc = Bun.spawn(["bun", "run", step.script], {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) fail(step.name, code);
}

console.log("\n[verify] ALL GATES PASSED");
