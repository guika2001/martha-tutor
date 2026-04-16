const { summarizeReadiness } = require("../diagnostics.js");

describe("diagnostics", () => {
  it("builds readiness scores by topic and operator", () => {
    const summary = summarizeReadiness([
      { topic: "Analysis", operator: "begruenden", success: false },
      { topic: "Analysis", operator: "begruenden", success: true },
      { topic: "Stochastik", operator: "bestimmen", success: false },
    ]);

    expect(summary.topics.Analysis.successRate).toBeCloseTo(0.5);
    expect(summary.operators.begruenden.attempts).toBe(2);
  });
});
