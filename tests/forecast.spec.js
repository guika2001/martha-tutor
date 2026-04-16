const { buildTaskIndex } = require("../tasks-normalize.js");
const { buildForecastVariants } = require("../forecast.js");

describe("forecast variants", () => {
  it("creates up to three visible forecast variants from the task index", () => {
    const index = buildTaskIndex([
      { task_id: "Wahlpflichtaufgabe 1a", topic: "Analysis", question: "Q1", expected_answer: "A1", source: { level: "GK", year: "2025-Beispiel" }, points: 2 },
      { task_id: "Wahlpflichtaufgabe 2a", topic: "Stochastik", question: "Q2", expected_answer: "A2", source: { level: "GK", year: "2025-Beispiel" }, points: 2 },
      { task_id: "Aufgabe a)(1)", topic: "Analysis", question: "Q3", expected_answer: "A3", source: { level: "GK", year: "ab-2026" }, points: 4 },
      { task_id: "Aufgabe b)(1)", topic: "Stochastik", question: "Q4", expected_answer: "A4", source: { level: "GK", year: "ab-2026" }, points: 3 },
      { task_id: "Aufgabe c)(1)", topic: "Vektorielle Geometrie", question: "Q5", expected_answer: "A5", source: { level: "GK", year: "ab-2026" }, points: 3 },
    ]);

    const variants = buildForecastVariants(index, { level: "GK", year: "ab-2026" });

    expect(variants).toHaveLength(3);
    expect(variants[0].blocks.length).toBeGreaterThan(0);
    expect(variants[0].label).toMatch(/Variante A/);
  });

  it("keeps level-specific variants actionable with block ids and task indexes", () => {
    const index = buildTaskIndex([
      { task_id: "Aufgabe a)(1)", topic: "Analysis", question: "Q1", expected_answer: "A1", source: { level: "GK", year: "ab-2026" }, points: 4 },
      { task_id: "Aufgabe b)(1)", topic: "Stochastik", question: "Q2", expected_answer: "A2", source: { level: "GK", year: "ab-2026" }, points: 3 },
      { task_id: "Aufgabe c)(1)", topic: "Vektorielle Geometrie", question: "Q3", expected_answer: "A3", source: { level: "GK", year: "ab-2026" }, points: 3 },
      { task_id: "Aufgabe d)(1)", topic: "Analysis", question: "Q4", expected_answer: "A4", source: { level: "LK", year: "ab-2026" }, points: 5 },
      { task_id: "Aufgabe e)(1)", topic: "Stochastik", question: "Q5", expected_answer: "A5", source: { level: "LK", year: "ab-2026" }, points: 5 },
      { task_id: "Aufgabe f)(1)", topic: "Vektorielle Geometrie", question: "Q6", expected_answer: "A6", source: { level: "LK", year: "ab-2026" }, points: 5 },
    ]);

    const variants = buildForecastVariants(index, { level: "LK", year: "ab-2026" });

    expect(variants[0].level).toBe("LK");
    expect(variants[0].blocks.every((block) => block.level === "LK")).toBe(true);
    expect(variants[0].blocks[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      taskIndexes: expect.any(Array),
      representativeIndex: expect.any(Number),
    }));
  });

  it("localizes forecast labels and metadata for Hungarian", () => {
    const index = buildTaskIndex([
      { task_id: "Aufgabe a)(1)", topic: "Stochastik", question: "Q1", expected_answer: "A1", source: { level: "GK", year: "ab-2026" }, points: 4 },
      { task_id: "Aufgabe b)(1)", topic: "Analysis", question: "Q2", expected_answer: "A2", source: { level: "GK", year: "ab-2026" }, points: 3 },
      { task_id: "Aufgabe c)(1)", topic: "Vektorielle Geometrie", question: "Q3", expected_answer: "A3", source: { level: "GK", year: "ab-2026" }, points: 3 },
    ]);

    const variants = buildForecastVariants(index, { level: "GK", year: "ab-2026", lang: "hu" });

    expect(variants[0].label).toContain("A változat");
    expect(variants[0].rationale).toContain("NRW-szerkezet");
    expect(["Valószínűségszámítás", "Analízis", "Vektorgeometria"]).toContain(variants[0].blocks[0].topic);
  });
});
