import { defineConfig } from "vitest/config";

export const coverageInclude = [
  "plot.js",
  "tasks-normalize.js",
  "operatoren.js",
  "tool-mode.js",
  "storage.js",
  "ui-helpers.js",
];

export function createVitestConfig(testOverrides = {}) {
  return defineConfig({
    test: {
      globals: true,
      exclude: ["tests/**/*.test.js", "tests/e2e/**", "node_modules/**"],
      ...testOverrides,
    },
    resolve: {
      conditions: ["browser", "node"],
    },
  });
}

