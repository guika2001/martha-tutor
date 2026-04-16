import { createVitestConfig } from "./vitest.shared.mjs";

export default createVitestConfig({
  include: ["tests/**/*.dom.spec.js"],
  environment: "jsdom",
  setupFiles: ["tests/setup-dom.js"],
});

