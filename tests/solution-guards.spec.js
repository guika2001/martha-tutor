const { evaluateDraft, compareWithReference } = require("../solution-guards.js");

describe("solution guards", () => {
  it("flags uncertain language and weak alignment with official solutions", () => {
    const result = evaluateDraft({
      task: {
        question: "Bestimme die Nullstellen von f(x)=x^2-4.",
        expected_answer: "Die Nullstellen sind x=-2 und x=2.",
      },
      draft: "Ich glaube, vielleicht ist das Ergebnis 5.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "uncertain-language")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "reference-mismatch")).toBe(true);
  });

  it("accepts teacher-style solutions that align with the official answer", () => {
    const result = evaluateDraft({
      task: {
        question: "Bestimme die Nullstellen von f(x)=x^2-4.",
        expected_answer: "Die Nullstellen sind x=-2 und x=2.",
      },
      draft: "Wir setzen x^2-4=0. Dann folgt x^2=4 und damit x=-2 oder x=2. Das passt zur Musterlösung.",
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("blocks full confidence answers when a required figure is missing", () => {
    const result = evaluateDraft({
      task: {
        question: "Der Graph ist in Abbildung 1 dargestellt.",
        figureRequired: true,
        figureLabel: "Abbildung 1",
        figureStatus: "missing",
      },
      draft: "Aus der Abbildung erkennt man eindeutig, dass der Hochpunkt bei x=2 liegt.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "missing-figure-reference")).toBe(true);
  });

  it("blocks wrong vector geometry claims through the main solution guard", () => {
    const result = evaluateDraft({
      task: {
        question: "Gegeben sind die Geraden g: x=(1|2|3)+r(2|1|0) und h: x=(0|1|0)+s(1|0|1).",
      },
      draft: "Die Geraden g und h sind parallel.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "vector-parallel-check-failed")).toBe(true);
  });

  it("measures overlap with reference tokens", () => {
    const score = compareWithReference(
      "x=-2 oder x=2",
      "Die Nullstellen sind x=-2 und x=2."
    );

    expect(score).toBeGreaterThan(0.4);
  });
});
