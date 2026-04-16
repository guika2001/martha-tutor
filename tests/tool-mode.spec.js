const { normalizeToolMode, buildToolModeHint } = require("../tool-mode.js");

describe("tool mode", () => {
  it("classifies CAS/MMS labels explicitly", () => {
    expect(normalizeToolMode("CAS/MMS")).toBe("cas");
  });

  it("returns uncertainty when metadata is missing", () => {
    expect(buildToolModeHint(null).status).toBe("uncertain");
  });
});
