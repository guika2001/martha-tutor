const { buildStudyPlan } = require("../study-plan.js");

describe("study plan", () => {
  it("prioritizes weak areas before simulation checkpoints", () => {
    const plan = buildStudyPlan({
      readiness: {
        topics: { Analysis: { successRate: 0.4 } },
        operators: { begruenden: { successRate: 0.3 } },
      },
      errorProfile: {
        topic: { Analysis: { open: 3, recovered: 0 } },
      },
    });

    expect(plan.sessions[0].focus.topic).toBe("Analysis");
    expect(plan.sessions.at(-1).type).toBe("simulation");
  });
});
