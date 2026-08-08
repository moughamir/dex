import { beforeEach, describe, expect, it, vi } from "vitest";

import { SIDEBAR_NAV } from "$lib/core/config/navigation";
import { workspaceLabel } from "$lib/core/utils/helpers";

/**
 * Test double for SvelteKit's `$app/state` `page`. Rune-backed (`$state`)
 * so the shell store's `$derived` read of `page.url.pathname` is tracked;
 * tests drive route changes through `navigate()`.
 */
vi.mock("$app/state", async () => {
  const { page } = await import("./stubs/app-state.svelte");
  return { page };
});

import { navigate, resetPage } from "./stubs/app-state.svelte";
import { shellStore } from "$lib/core/stores/shell.svelte";

describe("shellStore", () => {
  beforeEach(() => {
    resetPage();
    shellStore.setSidebarCollapsed(false);
    shellStore.setDockVisible(true);
    shellStore.setSidebarVisible(true);
  });

  describe("init", () => {
    it("boots the active workspace from the current pathname", () => {
      navigate("/database/connections");
      shellStore.init();

      expect(shellStore.activeWorkspace).toBe("database");
      expect(workspaceLabel(shellStore.activeWorkspace)).toBe("Database");
    });

    it("is a safe no-op — repeated calls do not disturb derived state", () => {
      navigate("/plugins");
      shellStore.init();
      shellStore.init();
      shellStore.init();

      expect(shellStore.activeWorkspace).toBe("plugins");
    });
  });

  describe("activeWorkspace reactivity", () => {
    it("follows route changes after boot (regression: stale workspace)", () => {
      navigate("/plugins");
      shellStore.init();
      expect(shellStore.activeWorkspace).toBe("plugins");

      navigate("/database/connections");
      expect(shellStore.activeWorkspace).toBe("database");
      expect(workspaceLabel(shellStore.activeWorkspace)).toBe("Database");

      navigate("/agents");
      expect(shellStore.activeWorkspace).toBe("agents");

      navigate("/nope");
      expect(shellStore.activeWorkspace).toBe("dashboard");
      expect(workspaceLabel(shellStore.activeWorkspace)).toBe("Dashboard");
    });

    it("keeps currentContext in sync with the active workspace", () => {
      navigate("/projects");
      shellStore.init();
      expect(shellStore.currentContext).toEqual(SIDEBAR_NAV.projects);

      navigate("/");
      expect(shellStore.currentContext).toEqual(SIDEBAR_NAV.dashboard);
    });
  });

  describe("sidebar collapse", () => {
    it("toggleSidebar flips the collapsed state", () => {
      shellStore.init();
      expect(shellStore.sidebarCollapsed).toBe(false);

      shellStore.toggleSidebar();
      expect(shellStore.sidebarCollapsed).toBe(true);

      shellStore.toggleSidebar();
      expect(shellStore.sidebarCollapsed).toBe(false);
    });

    it("setSidebarCollapsed sets the collapsed state explicitly", () => {
      shellStore.setSidebarCollapsed(true);
      expect(shellStore.sidebarCollapsed).toBe(true);

      shellStore.setSidebarCollapsed(false);
      expect(shellStore.sidebarCollapsed).toBe(false);
    });
  });

  describe("visibility flags", () => {
    it("defaults to dock and sidebar visible", () => {
      shellStore.init();
      expect(shellStore.dockVisible).toBe(true);
      expect(shellStore.sidebarVisible).toBe(true);
    });

    it("setDockVisible and setSidebarVisible update the flags", () => {
      shellStore.setDockVisible(false);
      expect(shellStore.dockVisible).toBe(false);

      shellStore.setSidebarVisible(false);
      expect(shellStore.sidebarVisible).toBe(false);

      shellStore.setDockVisible(true);
      shellStore.setSidebarVisible(true);
      expect(shellStore.dockVisible).toBe(true);
      expect(shellStore.sidebarVisible).toBe(true);
    });
  });
});
