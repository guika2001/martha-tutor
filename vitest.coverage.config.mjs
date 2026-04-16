import { createVitestConfig, coverageInclude } from "./vitest.shared.mjs";

export default createVitestConfig({
  include: ["tests/**/*.spec.js"],
  environment: "jsdom",
  setupFiles: ["tests/setup-dom.js"],
  coverage: {
    provider: "v8",
    reporter: ["text", "html"],
    include: coverageInclude,
    thresholds: {
      lines: 55,
      functions: 55,
      statements: 55,
      branches: 40,
    },
  },
});
