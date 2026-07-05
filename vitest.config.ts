import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests live next to source or under tests/unit. E2E (Playwright) is
    // excluded so it doesn't run under Vitest.
    include: ["src/**/*.{test,spec}.ts", "tests/unit/**/*.{test,spec}.ts"],
    exclude: ["tests/e2e/**", "node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
