import { describe, expect, it } from "vitest";

import { resolveWorkspace, workspaceLabel } from "$lib/core/utils/helpers";

describe("workspaceLabel", () => {
  it("resolves known workspace ids to their labels", () => {
    expect(workspaceLabel("dashboard")).toBe("Dashboard");
    expect(workspaceLabel("projects")).toBe("Projects");
    expect(workspaceLabel("plugins")).toBe("Plugins");
  });

  it("falls back to the default label for unknown ids", () => {
    expect(workspaceLabel("unknown" as never)).toBe("Digital Experience");
  });
});

describe("resolveWorkspace", () => {
  it("resolves the root path to dashboard", () => {
    expect(resolveWorkspace("/")).toBe("dashboard");
  });

  it("resolves each workspace href to its id", () => {
    expect(resolveWorkspace("/projects")).toBe("projects");
    expect(resolveWorkspace("/database")).toBe("database");
    expect(resolveWorkspace("/agents")).toBe("agents");
    expect(resolveWorkspace("/plugins")).toBe("plugins");
  });

  it("prefers the longest matching href prefix", () => {
    expect(resolveWorkspace("/projects/deep/link")).toBe("projects");
    expect(resolveWorkspace("/database/connections")).toBe("database");
  });

  it("falls back to dashboard for unmatched paths", () => {
    expect(resolveWorkspace("/nope")).toBe("dashboard");
    expect(resolveWorkspace("")).toBe("dashboard");
  });
});
