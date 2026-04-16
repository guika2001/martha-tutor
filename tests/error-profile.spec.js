const { buildErrorProfile, buildRecoverySummary } = require("../error-profile.js");

describe("error profile", () => {
  it("tracks open and recovered errors by topic and operator", () => {
    const profile = buildErrorProfile([
      { topic: "Analysis", operator: "begruenden", success: false, timestamp: 100 },
      { topic: "Analysis", operator: "begruenden", success: false, timestamp: 200 },
      { topic: "Analysis", operator: "begruenden", success: true, timestamp: 300 },
      { topic: "Stochastik", operator: "bestimmen", success: false, timestamp: 400 },
    ]);

    expect(profile.topic.Analysis.open).toBe(1);
    expect(profile.topic.Analysis.recovered).toBe(1);
    expect(profile.topic.Analysis.lastFailureAt).toBe(200);
    expect(profile.operator.begruenden.open).toBe(1);
    expect(profile.operator.bestimmen.open).toBe(1);
    expect(profile.operator.begruenden.lastSuccessAt).toBe(300);
  });

  it("summarizes recovery ratio inside one dimension without double-counting", () => {
    const summary = buildRecoverySummary({
      topic: {
        Analysis: { open: 2, recovered: 1 },
        Stochastik: { open: 0, recovered: 2 },
      },
      operator: {
        begruenden: { open: 1, recovered: 1 },
      },
    });

    expect(summary.dimension).toBe("topic");
    expect(summary.openTotal).toBe(2);
    expect(summary.recoveredTotal).toBe(3);
    expect(summary.recoveryRate).toBeCloseTo(3 / 5);
  });
});
