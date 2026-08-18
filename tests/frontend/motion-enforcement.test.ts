import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

function listFiles(dir: string, ext: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full, ext));
    } else if (full.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

const MOTION_DIR = join(SRC, "lib/ui/motion");

describe("motion engine enforcement", () => {
  it("no module under ui/motion/ schedules frames via requestAnimationFrame", () => {
    const files = listFiles(MOTION_DIR, ".ts");
    expect(files.length).toBeGreaterThan(0);

    const violators = files.filter((file) =>
      /requestAnimationFrame/.test(readFileSync(file, "utf8")),
    );
    expect(violators).toEqual([]);
  });

  it("no Svelte transition directives (transition:/in:/out:/animate:) in src/lib markup", () => {
    const svelteFiles = listFiles(join(SRC, "lib"), ".svelte");
    expect(svelteFiles.length).toBeGreaterThan(0);

    // Strip <style> blocks: CSS `transition:` is legitimate; Svelte markup
    // directives are banned (consumer contract, Animation.md).
    const directive = /(?:^|\s)(?:transition|in|out|animate):[a-zA-Z_$]/;
    const violators = svelteFiles.filter((file) => {
      const markup = readFileSync(file, "utf8").replace(
        /<style[\s\S]*?<\/style>/g,
        "",
      );
      return directive.test(markup);
    });
    expect(violators).toEqual([]);
  });
});
