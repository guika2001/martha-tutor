const { buildFigureRedrawState, buildFigureRedrawForTask } = require("../figure-redraw.js");

describe("figure redraw orchestration", () => {
  it("returns a validated analysis redraw when pdf validation and redraw validation pass", () => {
    const result = buildFigureRedrawState({
      task: { topic: "Analysis", figureRequired: true },
      pdfValidation: { ok: true, pageNumber: 2 },
      redrawResult: { engine: "analysis", ok: true, reason: "", model: { type: "analysis" } },
    });

    expect(result.status).toBe("validated");
    expect(result.engine).toBe("analysis");
    expect(result.model.type).toBe("analysis");
  });

  it("falls back to preview-only when the pdf is valid but the redraw is not safe enough", () => {
    const result = buildFigureRedrawState({
      task: { topic: "Vektorielle Geometrie", figureRequired: true },
      pdfValidation: { ok: true, pageNumber: 1 },
      redrawResult: { engine: "vector", ok: false, reason: "Ambiguous geometry", model: { type: "vector" } },
    });

    expect(result.status).toBe("preview-only");
    expect(result.reason).toMatch(/Ambiguous geometry/);
  });

  it("marks preview-only when no redraw exists but the pdf page is valid", () => {
    const result = buildFigureRedrawState({
      task: { topic: "Analysis", figureRequired: true },
      pdfValidation: { ok: true, pageNumber: 3, matchedTokens: ["Abbildung 1"] },
      redrawResult: null,
    });

    expect(result.status).toBe("preview-only");
  });

  it("builds a validated redraw state for a supported analysis task", () => {
    const state = buildFigureRedrawForTask({
      task: {
        topic: "Analysis",
        figureRequired: true,
        question: "Gegeben ist f(x) = x^2. Der Punkt P(1|1) liegt auf dem Graphen.",
        expected_answer: "",
      },
      pdfValidation: { ok: true, pageNumber: 1 },
    });

    expect(state.status).toBe("validated");
    expect(state.engine).toBe("analysis");
  });

  it("builds a validated redraw state for a supported vector task", () => {
    const state = buildFigureRedrawForTask({
      task: {
        topic: "Vektorielle Geometrie",
        figureRequired: true,
        question: "Gegeben sind A(0|0|0) und B(1|1|1). Die Gerade g geht durch A und B.",
        expected_answer: "",
      },
      pdfValidation: { ok: true, pageNumber: 2 },
    });

    expect(state.status).toBe("validated");
    expect(state.engine).toBe("vector");
  });
});
