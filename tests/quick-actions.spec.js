const { buildQuickActionPrompt } = require("../quick-actions.js");

describe("quick action prompts", () => {
  it("builds a Hungarian tip prompt that is not the same as solution", () => {
    const tip = buildQuickActionPrompt("tip", "hu");
    const solution = buildQuickActionPrompt("solution", "hu");

    expect(tip).toContain("kis tippet");
    expect(solution).toContain("teljes megoldást");
    expect(tip).not.toBe(solution);
  });

  it("builds a Hungarian first-step prompt distinct from tip", () => {
    const step = buildQuickActionPrompt("step", "hu");
    const tip = buildQuickActionPrompt("tip", "hu");

    expect(step).toContain("első lépést");
    expect(step).not.toBe(tip);
  });
});
