const {
  normalizePlotExpression,
  extractFunctions,
  detectPlots,
  validatePlotExpression,
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

  it("detects explicit plot commands", () => {
    const plots = detectPlots("PLOT(x^3-3*x, -3, 3)");
    expect(plots).toHaveLength(1);
    expect(plots[0]).toEqual({ expr: "x^3-3*x", xmin: -3, xmax: 3 });
  });

  it("rejects symbolic coefficient terms", () => {
    expect(validatePlotExpression("ax^2+bx").ok).toBe(false);
  });

  it("uses a positive default range for logarithms", () => {
    expect(guessRange("log(x)")).toEqual([0.1, 10]);
  });
});
