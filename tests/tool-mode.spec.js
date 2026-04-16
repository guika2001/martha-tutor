const { buildToolModeHint, normalizeToolMode } = require("../tool-mode.js");

describe("tool mode hints", () => {
  it("does not show a warning notice when the tool mode is unknown", () => {
    expect(buildToolModeHint(null)).toBeNull();
    expect(buildToolModeHint("")).toBeNull();
  });

  it("still recognizes supported tool types", () => {
    expect(normalizeToolMode("mit Hilfsmitteln")).toBe("supported");
    expect(buildToolModeHint("supported").message).toContain("Mit Hilfsmitteln");
  });
});
