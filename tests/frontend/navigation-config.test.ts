import { describe, expect, it } from "vitest";

import { DOCK_WORKSPACES, SIDEBAR_NAV } from "$lib/core/config/navigation";
import { layout } from "$lib/core/config/layout";

const EXPECTED_WORKSPACES = [
  "dashboard",
  "projects",
  "database",
  "agents",
  "plugins",
] as const;

describe("SIDEBAR_NAV", () => {
  it("exports one section map per workspace", () => {
    expect(Object.keys(SIDEBAR_NAV)).toEqual([...EXPECTED_WORKSPACES]);
  });

  it("maps each workspace to a non-empty list of sections", () => {
    for (const workspace of EXPECTED_WORKSPACES) {
      expect(Array.isArray(SIDEBAR_NAV[workspace])).toBe(true);
      expect(SIDEBAR_NAV[workspace].length).toBeGreaterThan(0);
    }
  });

  it("gives every section a stable kebab-case id, title and items", () => {
    for (const workspace of EXPECTED_WORKSPACES) {
      for (const section of SIDEBAR_NAV[workspace]) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(typeof section.title).toBe("string");
        expect(Array.isArray(section.items)).toBe(true);
        expect(section.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("shapes every item per the SidebarItem contract (id, label, href, optional badge)", () => {
    for (const workspace of EXPECTED_WORKSPACES) {
      for (const section of SIDEBAR_NAV[workspace]) {
        for (const item of section.items) {
          expect(item.id).toMatch(/^[a-z0-9-]+$/);
          expect(typeof item.label).toBe("string");
          expect(item.label.length).toBeGreaterThan(0);
          expect(item.href).toMatch(/^\//);
          if (item.badge !== undefined) {
            expect(typeof item.badge).toBe("string");
          }
        }
      }
    }
  });

  it("links resolve to existing static routes", () => {
    const hrefs = Object.values(SIDEBAR_NAV)
      .flatMap((sections) => sections.flatMap((section) => section.items))
      .map((item) => item.href);

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/projects");
    expect(hrefs).toContain("/database/connections");
  });
});

describe("DOCK_WORKSPACES", () => {
  it("mirrors the sidebar workspaces in render order", () => {
    expect(DOCK_WORKSPACES.map((workspace) => workspace.id)).toEqual([
      ...EXPECTED_WORKSPACES,
    ]);
  });

  it("exposes the Workspace contract (id, label, href, icon)", () => {
    for (const workspace of DOCK_WORKSPACES) {
      expect(EXPECTED_WORKSPACES).toContain(workspace.id);
      expect(typeof workspace.label).toBe("string");
      expect(workspace.label.length).toBeGreaterThan(0);
      expect(workspace.href).toMatch(/^\//);
      expect(typeof workspace.icon).toBe("function");
    }
  });
});

describe("layout config", () => {
  it("exposes positive shell dimensions and a sane collapsed state", () => {
    expect(layout.shellPadding).toBeGreaterThan(0);
    expect(layout.hudHeight).toBeGreaterThan(0);
    expect(layout.sidebarWidth).toBeGreaterThan(layout.sidebarCollapsedWidth);
    expect(layout.sidebarCollapsedWidth).toBeGreaterThan(0);
    expect(layout.dockHeight).toBeGreaterThan(0);
    expect(layout.statusHeight).toBeGreaterThan(0);
    expect(layout.contentMaxWidth).toBeGreaterThan(layout.contentGap);
  });
});
