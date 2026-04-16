const {
  buildTaskIndex,
  getVisibleItems,
  findBlockIdByTaskIndex,
  buildCombinedTask,
  stripTaskLeadIn,
} = require("../tasks-normalize.js");

describe("task navigator normalization", () => {
  const sampleTasks = [
    { task_id: "Pflichtaufgabe 1a", topic: "Analysis", question: "Q1", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Pflichtaufgabe 1b", topic: "Analysis", question: "Q2", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 3 },
    { task_id: "Pflichtaufgabe 2a", topic: "Analysis", question: "Q3", expected_answer: "", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Aufgabe a) (1)", topic: "Stochastik", question: "Löse folgende Aufgabe aus dem NRW Abitur 2025-Beispiel (Mathematik, LK):\n\nBegründen Sie, dass die gegebene Wahrscheinlichkeit sinnvoll ist.\n\nQ4", expected_answer: "A4", source: { level: "LK", year: "2025-Beispiel" }, points: 2 },
    { task_id: "Aufgabe a) (2)", topic: "Stochastik", question: "Löse folgende Aufgabe aus dem NRW Abitur 2025-Beispiel (Mathematik, LK):\n\nBegründen Sie, dass die gegebene Wahrscheinlichkeit sinnvoll ist.\n\nQ5", expected_answer: "A5", source: { level: "LK", year: "2025-Beispiel" }, points: 4 },
    { task_id: "Aufgabe b)", topic: "Stochastik", question: "Löse folgende Aufgabe aus dem NRW Abitur 2025-Beispiel (Mathematik, GK):\n\nDer Graph der Funktion f ist in Abbildung 1 dargestellt.\nBerechnen Sie den Flächeninhalt.", expected_answer: "", source: { level: "GK", year: "2025-Beispiel" }, points: 3 },
    { task_id: "Wahlpflichtaufgabe 1a", topic: "Lineare Algebra", question: "Ermitteln Sie die Lösungsmenge des linearen Gleichungssystems: 10x + 2y - 5z = 6, -2x + 3z = 8, 4x - 2y + 3z = 4.", expected_answer: "", source: { level: "GK", year: "2025-Beispiel" }, points: 2 },
    { task_id: "Wahlpflichtaufgabe 1a", topic: "Lineare Algebra", question: "Ermitteln Sie die Lösungsmenge des linearen Gleichungssystems: 10x + 2y - 5z = 6, -2x + 3z = 8, 4x - 2y + 3z = 4.", expected_answer: "", source: { level: "GK", year: "2025-Beispiel" }, points: 2 },
  ];

  it("keeps level groups separate", () => {
    const index = buildTaskIndex(sampleTasks);
    expect(index.levels.map((item) => item.id)).toEqual(["GK", "LK"]);
  });

  it("uses year as a filter while topic stays the navigation step", () => {
    const index = buildTaskIndex(sampleTasks);
    const topicView = getVisibleItems(index, { level: "LK", year: "2025-Beispiel", topic: "" });
    expect(topicView.kind).toBe("topic");
    expect(topicView.filters.years.map((item) => item.id)).toEqual(["", "2025-Beispiel"]);
    expect(topicView.items).toHaveLength(1);
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
    expect(synthetic.task_id).not.toContain("Aufgabe a)");
    expect(synthetic.question).toContain("Teil 1");
    expect(synthetic.examPart).toBe("2. Prüfungsteil");
    expect(synthetic.toolType).toBe("mit Hilfsmitteln");
    expect(synthetic.toolMode).toBe("supported");
    expect(synthetic.primaryOperator).toBe("begruenden");
  });

  it("removes generic NRW lead-in boilerplate", () => {
    const cleaned = stripTaskLeadIn("Löse folgende Aufgabe aus dem NRW Abitur 2025-Beispiel (Mathematik, GK):\n\nEine Funktion f ist gegeben.");
    expect(cleaned).toBe("Eine Funktion f ist gegeben.");
  });

  it("offers exam-part and task-type filters", () => {
    const index = buildTaskIndex(sampleTasks);
    const topicView = getVisibleItems(index, { level: "LK", topic: "", year: "2025-Beispiel", examPart: "", taskType: "", toolType: "" });
    expect(topicView.filters.examParts.map((item) => item.id)).toContain("2. Prüfungsteil");
    expect(topicView.filters.taskTypes.map((item) => item.id)).toContain("Prüfungsaufgabe");
    expect(topicView.filters.toolTypes.map((item) => item.id)).toContain("mit Hilfsmitteln");
  });

  it("extracts figure metadata for tasks that reference an illustration", () => {
    const index = buildTaskIndex(sampleTasks);
    const block = getVisibleItems(index, { level: "GK", year: "2025-Beispiel", topic: "Stochastik" }).items[0];
    const synthetic = buildCombinedTask(block);

    expect(synthetic.figureRequired).toBe(true);
    expect(synthetic.figureLabel).toBe("Abbildung 1");
    expect(synthetic.figureStatus).toBe("referenced");
  });

  it("deduplicates identical tasks inside one block", () => {
    const index = buildTaskIndex(sampleTasks);
    const block = getVisibleItems(index, { level: "GK", year: "2025-Beispiel", topic: "Lineare Algebra" }).items[0];
    const synthetic = buildCombinedTask(block);

    expect(block.taskIndexes).toHaveLength(1);
    expect(synthetic.question.match(/Teil /g) || []).toHaveLength(1);
  });
});
