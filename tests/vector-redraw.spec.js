const {
  buildVectorRedrawModel,
} = require("../vector-redraw.js");

describe("vector redraw model", () => {
  it("builds a redraw model with named points and a derived vector from a real vector task", () => {
    const model = buildVectorRedrawModel({
      task_id: "Wahlpflichtaufgabe 3a",
      topic: "Vektorielle Geometrie",
      source: { level: "GK", year: "2025-Beispiel" },
      question:
        "Gegeben sind die Punkte A(5 | 0 | a) und B(2 | 4 | 5). Der Koordinatenursprung wird mit O bezeichnet. Bestimmen Sie denjenigen Wert von a, für den A und B den Abstand 5 haben.",
    });

    expect(model.kind).toBe("vector-redraw-model");
    expect(model.points.map((point) => point.label)).toEqual(["A", "B", "O"]);
    expect(model.points.find((point) => point.label === "A").coordinates).toEqual([5, 0, "a"]);
    expect(model.points.find((point) => point.label === "O").coordinates).toEqual([0, 0, 0]);
    expect(model.vectors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "AB",
          kind: "point-difference",
          components: [-3, 4, "5-a"],
        }),
      ])
    );
    expect(model.validationHint.supported).toBe(true);
    expect(model.validationHint.confidence).toBe("low");
  });

  it("captures a simple 3D line equation and its direction vector", () => {
    const model = buildVectorRedrawModel({
      task_id: "Synthetic line task",
      topic: "Vektorielle Geometrie",
      question: "Gegeben sind die Geraden g: x=(1|2|3)+r(2|1|0) und h: x=(0|1|0)+s(4|2|0).",
    });

    expect(model.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "g",
          kind: "equation",
          baseCoordinates: [1, 2, 3],
          direction: [2, 1, 0],
        }),
        expect.objectContaining({
          label: "h",
          kind: "equation",
          baseCoordinates: [0, 1, 0],
          direction: [4, 2, 0],
        }),
      ])
    );
    expect(model.vectors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "g",
          kind: "direction",
          components: [2, 1, 0],
        }),
      ])
    );
    expect(model.validationHint.supported).toBe(true);
    expect(model.validationHint.confidence).toBe("medium");
  });

  it("classifies a line-line redraw as intersecting when the two lines meet", () => {
    const model = buildVectorRedrawModel({
      task_id: "Line intersection task",
      topic: "Vektorielle Geometrie",
      question: "Gegeben sind die Geraden g: x=(0|0|0)+r(1|0|0) und h: x=(0|0|0)+s(0|1|0). Bestimmen Sie die Lagebeziehung.",
    });

    expect(model.geometryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "line-line",
          status: "intersecting",
          labels: ["g", "h"],
        }),
      ])
    );
  });

  it("classifies a line-plane redraw as intersecting when a line crosses the plane", () => {
    const model = buildVectorRedrawModel({
      task_id: "Line plane task",
      topic: "Vektorielle Geometrie",
      question: "Gegeben sind die Gerade g: x=(0|0|1)+r(0|0|-1) und die Ebene E: z=0. Untersuchen Sie die Lagebeziehung von g und E.",
    });

    expect(model.geometryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "line-plane",
          status: "intersecting",
          lineLabel: "g",
          planeLabel: "E",
        }),
      ])
    );
  });

  it("stays conservative when no line or vector relation is explicit enough", () => {
    const model = buildVectorRedrawModel({
      task_id: "Single point task",
      topic: "Vektorielle Geometrie",
      question: "Gegeben ist der Punkt P(1 | 2 | 3).",
    });

    expect(model.points).toHaveLength(1);
    expect(model.lines).toHaveLength(0);
    expect(model.vectors).toHaveLength(0);
    expect(model.validationHint.supported).toBe(false);
    expect(model.validationHint.reason).toMatch(/no line or vector relation/i);
  });
});
