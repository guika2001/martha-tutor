const { buildRepetitionQueue, getNextRepetitionDueAt, buildNextRepetitionSelection } = require("../repetition.js");

describe("repetition", () => {
  it("prioritizes unresolved and overdue repetitions", () => {
    const now = 400_000_000;
    const queue = buildRepetitionQueue({
      now,
      events: [
        { topic: "Analysis", operator: "begruenden", success: false, timestamp: 1_000 },
        { topic: "Analysis", operator: "begruenden", success: true, timestamp: 2_000 },
        { topic: "Stochastik", operator: "bestimmen", success: false, timestamp: 500 },
      ],
      errorProfile: {
        topic: {
          Analysis: { open: 0, recovered: 1, lastSuccessAt: 2_000, lastFailureAt: 1_000 },
          Stochastik: { open: 1, recovered: 0, lastFailureAt: 500 },
        },
        operator: {
          begruenden: { open: 0, recovered: 1, lastSuccessAt: 2_000, lastFailureAt: 1_000 },
          bestimmen: { open: 1, recovered: 0, lastFailureAt: 500 },
        },
      },
    });

    expect(queue[0].topic).toBe("Stochastik");
    expect(queue[0].reason).toBe("open-error");
    expect(queue.some((item) => item.reason === "spaced-review")).toBe(true);
  });

  it("computes next due timestamp from review streak", () => {
    const dueAt = getNextRepetitionDueAt({
      now: 5_000,
      open: 0,
      recovered: 2,
      lastSuccessAt: 4_000,
      lastFailureAt: 1_000,
    });

    expect(dueAt).toBe(4_000 + (24 * 60 * 60 * 1000 * 3));
  });

  it("builds a next-repetition selection that clears restrictive filters", () => {
    const selection = buildNextRepetitionSelection({
      queue: [{ topic: "Vektorielle Geometrie", reason: "open-error" }],
      events: [
        { topic: "Analysis", level: "GK", timestamp: 100 },
        { topic: "Vektorielle Geometrie", level: "LK", timestamp: 200 },
      ],
    });

    expect(selection).toEqual({
      topic: "Vektorielle Geometrie",
      level: "LK",
      year: "",
      examPart: "",
      taskType: "",
      toolType: "",
    });
  });
});
