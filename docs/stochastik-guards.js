(function (root) {
  function normalize(text) {
    return String(text || "")
      .replace(/(\d),(\d)/g, "$1.$2")
      .replace(/[−–]/g, "-")
      .trim();
  }

  function extractBinomialParamsFromTask(task = {}) {
    const text = normalize([task.question, task.expected_answer].filter(Boolean).join(" "));
    const match = text.match(/(?:X|Y|Z)\s*~\s*B\s*\(\s*(\d+)\s*[;,]\s*(0?\.\d+|1(?:\.0+)?)\s*\)/i);
    if (!match) return null;
    return { n: Number(match[1]), p: Number(match[2]) };
  }

  function extractClaimedValue(draft = "", pattern) {
    const text = normalize(draft);
    const match = text.match(pattern);
    return match ? Number(match[1]) : null;
  }

  function almostEqual(left, right, epsilon = 1e-2) {
    return Math.abs(left - right) <= epsilon;
  }

  function verifyClaimedExpectation({ params, draft }) {
    const claimed = extractClaimedValue(draft, /erwartungswert[^0-9-]*(-?\d+(?:\.\d+)?)/i);
    if (!params || claimed == null) return { ok: true, issues: [] };
    const expected = params.n * params.p;
    if (almostEqual(claimed, expected)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "expectation-check-failed",
        message: `Der angegebene Erwartungswert passt nicht zu E(X)=n*p=${expected}.`,
      }],
    };
  }

  function verifyClaimedSigma({ params, draft }) {
    const claimed = extractClaimedValue(draft, /standardabweichung[^0-9-]*(-?\d+(?:\.\d+)?)/i);
    if (!params || claimed == null) return { ok: true, issues: [] };
    const sigma = Math.sqrt(params.n * params.p * (1 - params.p));
    if (almostEqual(claimed, sigma, 5e-2)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "sigma-check-failed",
        message: `Die angegebene Standardabweichung passt nicht zu sigma=${sigma.toFixed(2)}.`,
      }],
    };
  }

  function verifyProbabilityInterpretation(draft = "") {
    const text = normalize(draft).toLowerCase();
    const issues = [];
    if (/(wahrscheinlichkeit|chance).*(größer als 1|groesser als 1|über 1|ueber 1)/i.test(text)) {
      issues.push({
        code: "probability-interpretation-failed",
        message: "Wahrscheinlichkeiten dürfen nicht größer als 1 beschrieben werden.",
      });
    }
    if (/(wahrscheinlichkeit|chance).*(kleiner als 0|unter 0)/i.test(text)) {
      issues.push({
        code: "probability-interpretation-failed",
        message: "Wahrscheinlichkeiten dürfen nicht kleiner als 0 beschrieben werden.",
      });
    }
    return { ok: issues.length === 0, issues };
  }

  const api = {
    extractBinomialParamsFromTask,
    verifyClaimedExpectation,
    verifyClaimedSigma,
    verifyProbabilityInterpretation,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaStochastikGuards = api;
})(typeof window !== "undefined" ? window : globalThis);
