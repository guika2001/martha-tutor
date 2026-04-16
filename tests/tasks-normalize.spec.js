const {
  buildTaskIndex,
  getVisibleItems,
  findBlockIdByTaskIndex,
  buildCombinedTask,
} = require("../tasks-normalize.js");

describe("task navigator normalization", () => {
  const sampleTasks = [
    { task_id: "Pflichtaufgabe 1a", topic: "Analysis", question: "Q1", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Pflichtaufgabe 1b", topic: "Analysis", question: "Q2", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 3 },
    { task_id: "Pflichtaufgabe 2a", topic: "Analysis", question: "Q3", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Aufgabe a) (1)", topic: "Stochastik", question: "Q4", expected_answer: "A4", source: { level: "LK", year: "2025-Beispiel" }, points: 2 },
    { task_id: "Aufgabe a) (2)", topic: "Stochastik", question: "Q5", expected_answer: "A5", source: { level: "LK", year: "2025-Beispiel" }, points: 4 },
  ];

  it("keeps level groups separate", () => {
    const index = buildTaskIndex(sampleTasks);
    expect(index.levels.map((item) => item.id)).toEqual(["GK", "LK"]);
  });

  it("groups related subtasks into a task block", () => {
    const index = buildTaskIndex(sampleTasks);
    const blockView = getVisibleItems(index, { level: "LK", year: "2025-Beispiel", topic: "Stochastik" });
    expect(blockView.kind).toBe("block");
    expect(blockView.items).toHaveLength(1);
    expect(blockView.items[0].taskIndexes).toEqual([3, 4]);
  });

  it("maps task indexes back to block ids", () => {
    const index = buildTaskIndex(sampleTasks);
    expect(findBlockIdByTaskIndex(index, 4)).toContain("Aufgabe a)");
  });

  it("builds a combined synthetic task for block rendering", () => {
    const index = buildTaskIndex(sampleTasks);
    const block = getVisibleItems(index, { level: "LK", year: "2025-Beispiel", topic: "Stochastik" }).items[0];
    const synthetic = buildCombinedTask(block);
    expect(synthetic.isSyntheticBlock).toBe(true);
    expect(synthetic.question).toContain("[Aufgabe a) (1)]");
    expect(synthetic.expected_answer).toContain("[Aufgabe a) (2)]");
  });
});
