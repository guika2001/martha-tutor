const {
  createSimulationRun,
  buildSimulationTaskIndexes,
  formatRemainingTime,
  isSimulationExpired,
} = require("../simulation.js");

describe("simulation run", () => {
  it("locks a deterministic task sequence for the run", () => {
    const run = createSimulationRun({
      taskIds: ["a", "b", "c"],
      durationMinutes: 90,
      startedAt: 0,
    });

    expect(run.taskIds).toEqual(["a", "b", "c"]);
    expect(run.endsAt).toBe(90 * 60 * 1000);
  });

  it("builds task indexes from block view representatives", () => {
    const taskIndexes = buildSimulationTaskIndexes({
      kind: "block",
      items: [
        { representativeIndex: 4 },
        { representativeIndex: 9 },
        { representativeIndex: 12 },
      ],
    });

    expect(taskIndexes).toEqual([4, 9, 12]);
  });

  it("formats remaining time as mm:ss", () => {
    expect(formatRemainingTime(125000)).toBe("02:05");
  });

  it("detects expired runs", () => {
    expect(isSimulationExpired({ endsAt: 1000 }, 1200)).toBe(true);
  });
});
