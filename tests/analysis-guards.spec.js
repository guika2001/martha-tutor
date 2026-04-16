const {
  extractFunctionExpressionFromTask,
  extractPointFromTask,
  extractIntervalFromTask,
  extractClaimedRoots,
  verifyClaimedRoots,
  verifyClaimedDerivative,
  verifyClaimedTangent,
  verifyClaimedArea,
  verifyProbabilityBounds,
} = require("../analysis-guards.js");

describe("analysis guards", () => {
  it("extracts the first function expression from a task", () => {
    const expr = extractFunctionExpressionFromTask({
      question: "Gegeben ist die Funktion f(x)=x^2-4. Bestimme die Nullstellen.",
    });

    expect(expr).toBe("x^2-4");
  });

  it("extracts claimed roots from a teacher answer", () => {
    const roots = extractClaimedRoots("Dann folgt x=-2 oder x=2.");
    expect(roots).toEqual([-2, 2]);
  });

  it("extracts a tangent point from the task text", () => {
    const point = extractPointFromTask({
      question: "Bestimme die Tangente an den Graphen von f(x)=x^2 an der Stelle x=1.",
    }, "x^2");

    expect(point).toEqual({ x: 1, y: 1 });
  });

  it("extracts an interval from the task text", () => {
    const interval = extractIntervalFromTask({
      question: "Berechne den Flaecheninhalt im Intervall [0;2].",
    });

    expect(interval).toEqual({ from: 0, to: 2 });
  });

  it("accepts correct roots by substitution", () => {
    const result = verifyClaimedRoots({
      expression: "x^2-4",
      draft: "Die Nullstellen sind x=-2 oder x=2.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects incorrect roots by substitution", () => {
    const result = verifyClaimedRoots({
      expression: "x^2-4",
      draft: "Die Nullstellen sind x=5.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("root-check-failed");
  });

  it("rejects probabilities outside [0,1]", () => {
    const result = verifyProbabilityBounds("Die Wahrscheinlichkeit betraegt 1.25.");

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("probability-out-of-range");
  });

  it("accepts a correct derivative formula", () => {
    const result = verifyClaimedDerivative({
      expression: "x^2-4",
      draft: "Damit ist f'(x)=2*x.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect derivative formula", () => {
    const result = verifyClaimedDerivative({
      expression: "x^2-4",
      draft: "Damit ist f'(x)=x+2.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("derivative-check-failed");
  });

  it("accepts a tangent line that matches slope and point", () => {
    const result = verifyClaimedTangent({
      expression: "x^2",
      point: { x: 1, y: 1 },
      draft: "Die Tangente lautet y=2*x-1.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a tangent line with wrong slope", () => {
    const result = verifyClaimedTangent({
      expression: "x^2",
      point: { x: 1, y: 1 },
      draft: "Die Tangente lautet y=x.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("tangent-check-failed");
  });

  it("accepts a correct area value on an interval", () => {
    const result = verifyClaimedArea({
      expression: "x",
      interval: { from: 0, to: 2 },
      draft: "Der Flaecheninhalt betraegt 2.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect area value on an interval", () => {
    const result = verifyClaimedArea({
      expression: "x",
      interval: { from: 0, to: 2 },
      draft: "Der Flaecheninhalt betraegt 5.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("area-check-failed");
  });
});
