import { describe, expect, it } from "vitest";

import { ERROR_CODES, IpcError } from "$lib/core/api/tauri";

describe("ERROR_CODES", () => {
  it("mirrors the closed Rust AppError code set (ADR-0002)", () => {
    expect(ERROR_CODES).toEqual([
      "validation",
      "not_found",
      "permission_denied",
      "conflict",
      "unsupported",
      "internal",
    ]);
  });
});

describe("IpcError.fromUnknown", () => {
  it("maps a structured AppError envelope to its typed code", () => {
    const error = IpcError.fromUnknown({
      type: "validation",
      message: "name must be non-empty",
    });
    expect(error).toBeInstanceOf(IpcError);
    expect(error.type).toBe("validation");
    expect(error.message).toBe("name must be non-empty");
  });

  it("maps a transport string to type 'unknown'", () => {
    const error = IpcError.fromUnknown("broken pipe");
    expect(error.type).toBe("unknown");
    expect(error.message).toBe("broken pipe");
  });

  it("maps a generic Error to type 'unknown' with its message", () => {
    const error = IpcError.fromUnknown(new Error("ipc failed"));
    expect(error.type).toBe("unknown");
    expect(error.message).toBe("ipc failed");
  });

  it("rejects envelope shapes that are not in the closed code set", () => {
    const error = IpcError.fromUnknown({ type: "bogus", message: "nope" });
    expect(error.type).toBe("unknown");
  });
});
