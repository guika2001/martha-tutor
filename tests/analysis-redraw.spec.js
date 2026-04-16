const {
  buildAnalysisRedrawModel,
  extractFunctionExpressionFromTask,
  extractNamedPointsFromTask,
  extractTangentCueFromTask,
  extractAreaCueFromTask,
} = require("../analysis-redraw.js");

describe("analysis redraw model", () => {
  it("builds a redraw model with function, named points, tangent cue, and area cue", () => {
    const model = buildAnalysisRedrawModel({
      question: [
        "Gegeben ist die Funktion f mit f(x) = (1/2)·x³ - (6/28)·x², x ∈ ℝ.",
        "Der Punkt Q(-4 | 12) liegt auf dem Graphen von f.",
        "Zeigen Sie: Die Gerade durch die Punkte P(4/3 | 28/3) und Q ist die Tangente an den Graphen von f im Punkt Q.",
        "Berechnen Sie den Flächeninhalt im Intervall [0;2].",
      ].join("\n"),
      expected_answer: [
        "Da H(0 | 28/3) ein Hochpunkt des Graphen von f ist, verläuft die Tangente im Hochpunkt waagerecht.",
        "∫₀² f(x) dx",
      ].join("\n"),
    });

    expect(model).toEqual({
      kind: "analysis-redraw",
      functionName: "f",
      functionExpression: "(1/2)*x^3-(6/28)*x^2",
      namedPoints: [
        { name: "Q", x: -4, y: 12 },
        { name: "P", x: 4 / 3, y: 28 / 3 },
        { name: "H", x: 0, y: 28 / 3 },
      ],
      tangentCue: { atPoint: { name: "Q", x: -4, y: 12 } },
      areaCue: { from: 0, to: 2 },
    });
  });

  it("normalizes subscripted point names and radical coordinates", () => {
    const points = extractNamedPointsFromTask({
      question: "Die Punkte E₁(-1|-2) und E₂(2|2√3) sind Extrempunkte des Graphen.",
    });

    expect(points).toEqual([
      { name: "E1", x: -1, y: -2 },
      { name: "E2", x: 2, y: 2 * Math.sqrt(3) },
    ]);
  });

  it("extracts tangent and area cues independently", () => {
    const task = {
      question: "Begründen Sie, dass die Tangente an den Graphen von f an der Stelle x = 0 durch den Punkt P(4/3 | 28/3) verläuft. Berechnen Sie den Flächeninhalt der schraffierten Fläche.",
      expected_answer: "∫₀^(1/2) f(x) dx",
    };

    expect(extractTangentCueFromTask(task, [{ name: "P", x: 4 / 3, y: 28 / 3 }])).toEqual({ atX: 0 });
    expect(extractAreaCueFromTask(task)).toEqual({ from: 0, to: 0.5 });
  });

  it("returns null when no function expression is present", () => {
    expect(buildAnalysisRedrawModel({
      question: "Der Punkt P(1|2) liegt auf dem Graphen.",
    })).toBeNull();
  });

  it("extracts the first supported function expression from the task text", () => {
    expect(extractFunctionExpressionFromTask({
      question: "Gegeben ist die Funktion s(x) = a · sin(b·x + 1). Die Punkte E₁(-1|-2) und E₂(2|2√3) sind Extrempunkte.",
      expected_answer: "a = 2, b = π/4",
    })).toBe("a*sin(b*x+1)");
  });
});
