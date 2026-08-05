import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      // The real lucide-svelte barrel compiles ~1900 icon .svelte files on
      // import in vitest's node pool (~80s). Tests only assert data/config
      // structure, so route it to a lightweight test double.
      "lucide-svelte": fileURLToPath(
        new URL("./tests/frontend/stubs/lucide-svelte.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/frontend/**/*.test.ts"],
    environment: "node",
  },
});
