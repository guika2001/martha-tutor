const {
  normalizePlotExpression,
  extractFunctions,
  detectPlots,
  isDerivativePlotRequest,
  validatePlotExpression,
  deriveExpression,
  guessRange,
} = require("../plot.js");

describe("plot helpers", () => {
  it("normalizes decimal commas", () => {
    expect(normalizePlotExpression("f(x)=1,5*x")).toBe("f(x)=1.5*x");
  });

  it("extracts exponential functions from task text", () => {
    const match = extractFunctions("f(x)=4000*x*e^(-0.4*x)");
    expect(match).toHaveLength(1);
    expect(match[0].expr).toBe("4000*x*exp(-0.4*x)");
  });

  it("keeps fractional coefficients intact", () => {
    const match = extractFunctions("f(x)=\\frac{1}{6}\\cdot x^3-\\frac{1}{2}\\cdot x^2+\\frac{28}{3}");
    expect(match).toHaveLength(1);
    expect(match[0].expr.replace(/\s+/g, "")).toBe("(1)/(6)*x^3-(1)/(2)*x^2+(28)/(3)");
  });

  it("ignores solved equations that are not functions", () => {
    const match = extractFunctions("f(x)=0 ⇔ x=-√3 ∨ x=0 ∨ x=√3");
    expect(match).toHaveLength(0);
  });

  it("detects explicit plot commands", () => {
    const plots = detectPlots("PLOT(x^3-3*x, -3, 3)");
    expect(plots).toHaveLength(1);
    expect(plots[0]).toEqual({ expr: "x^3-3*x", xmin: -3, xmax: 3 });
  });

  it("detects multilingual derivative plot requests", () => {
    expect(isDerivativePlotRequest("mutasd a függvény deriváltját")).toBe(true);
    expect(isDerivativePlotRequest("zeige die Ableitung")).toBe(true);
    expect(isDerivativePlotRequest("show the derivative")).toBe(true);
    expect(isDerivativePlotRequest("magyarázd el a deriváltat")).toBe(false);
  });

  it("rejects symbolic coefficient terms", () => {
    expect(validatePlotExpression("ax^2+bx").ok).toBe(false);
  });

  it("rejects equality chains as plot input", () => {
    expect(validatePlotExpression("0 ⇔ x=-√3").ok).toBe(false);
  });

  it("rejects unbalanced parentheses", () => {
    expect(validatePlotExpression("1)/(6)*x^3").ok).toBe(false);
  });

  it("uses a positive default range for logarithms", () => {
    expect(guessRange("log(x)")).toEqual([0.1, 10]);
  });

  it("derives a plottable derivative expression from a task function", () => {
    global.math = {
      parse: (expr) => expr,
      derivative: (node) => {
        expect(node).toBe("x^3-3*x");
        return "3 * x ^ 2 - 3";
      },
      simplify: (node) => ({ toString: () => node }),
    };
    expect(deriveExpression("x^3-3*x", 1)).toBe("3 * x ^ 2 - 3");
    delete global.math;
  });

  it("rejects incomplete auto-plot expressions instead of trying to render them", () => {
    expect(validatePlotExpression("(2*x-1)*").ok).toBe(false);
  });
});
