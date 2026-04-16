import { createVitestConfig } from "./vitest.shared.mjs";

export default createVitestConfig({
  include: ["tests/**/*.spec.js"],
  exclude: ["tests/**/*.dom.spec.js", "tests/**/*.test.js", "tests/e2e/**", "node_modules/**"],
  environment: "node",
});

