(function () {
  const cases = [
    ["normalizes decimal comma", MarthaPlot.normalizePlotExpression("f(x)=1,5*x"), "f(x)=1.5*x"],
    ["extracts exponential function", MarthaPlot.extractFunctions("f(x)=4000*x*e^(-0.4*x)")[0].expr, "4000*x*exp(-0.4*x)"],
    ["detects explicit plot command", MarthaPlot.detectPlots("PLOT(x^3-3*x, -3, 3)").length, 1],
    ["rejects symbolic coefficient term", MarthaPlot.validatePlotExpression("ax^2+bx").ok, false],
  ];

  function render(name, ok, detail) {
    const root = document.getElementById("results");
    const div = document.createElement("div");
    div.className = ok ? "ok" : "fail";
    div.textContent = (ok ? "PASS: " : "FAIL: ") + name;
    root.appendChild(div);
    if (!ok) {
      const pre = document.createElement("pre");
      pre.textContent = detail;
      root.appendChild(pre);
    }
  }

  cases.forEach(([name, actual, expected]) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    render(name, ok, "Expected: " + JSON.stringify(expected) + "\nActual: " + JSON.stringify(actual));
  });
})();
