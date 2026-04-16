(function (root) {
  const plotApi = typeof module !== "undefined" && module.exports
    ? require("./plot.js")
    : root && root.MarthaPlot
      ? root.MarthaPlot
      : null;

  function normalize(text) {
    return plotApi && typeof plotApi.normalizePlotExpression === "function"
      ? plotApi.normalizePlotExpression(text)
      : String(text || "");
  }

  function extractFunctionExpressionFromTask(task = {}) {
    const text = [task.question, task.expected_answer].filter(Boolean).join("\n");
    const matches = plotApi && typeof plotApi.extractFunctions === "function"
      ? plotApi.extractFunctions(text)
      : [];
    return matches[0]?.expr || "";
  }

  function extractClaimedRoots(draft = "") {
    const text = normalize(draft);
    const roots = [];
    const regex = /x\s*=\s*(-?\d+(?:\.\d+)?)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      roots.push(Number(match[1]));
    }
    return Array.from(new Set(roots));
  }

  function extractPointFromTask(task = {}, expression = "") {
    const text = normalize([task.question, task.expected_answer].filter(Boolean).join("\n"));
    const coordMatch = text.match(/\(\s*(-?\d+(?:\.\d+)?)\s*\|\s*(-?\d+(?:\.\d+)?)\s*\)/);
    if (coordMatch) {
      return { x: Number(coordMatch[1]), y: Number(coordMatch[2]) };
    }
    const xMatch = text.match(/(?:an der stelle|bei)\s*x\s*=\s*(-?\d+(?:\.\d+)?)/i);
    if (!xMatch || !expression) return null;
    try {
      const fn = compileExpression(expression);
      const x = Number(xMatch[1]);
      return { x, y: Number(fn(x)) };
    } catch (_) {
      return null;
    }
  }

  function extractIntervalFromTask(task = {}) {
    const text = normalize([task.question, task.expected_answer].filter(Boolean).join("\n"));
    const bracketMatch = text.match(/\[\s*(-?\d+(?:\.\d+)?)\s*[;,]\s*(-?\d+(?:\.\d+)?)\s*\]/);
    if (bracketMatch) {
      return { from: Number(bracketMatch[1]), to: Number(bracketMatch[2]) };
    }
    const fromToMatch = text.match(/von\s*(-?\d+(?:\.\d+)?)\s*bis\s*(-?\d+(?:\.\d+)?)/i);
    if (fromToMatch) {
      return { from: Number(fromToMatch[1]), to: Number(fromToMatch[2]) };
    }
    return null;
  }

  function compileExpression(expression) {
    const normalized = normalize(expression)
      .replace(/\^/g, "**")
      .replace(/\bexp\(/g, "Math.exp(")
      .replace(/\bsqrt\(/g, "Math.sqrt(")
      .replace(/\blog\(/g, "Math.log(")
      .replace(/\bsin\(/g, "Math.sin(")
      .replace(/\bcos\(/g, "Math.cos(")
      .replace(/\btan\(/g, "Math.tan(")
      .replace(/\bpi\b/gi, "Math.PI");
    if (!/^[0-9x+\-*/().,\s*MathPIexpqrtlogsincota]*$/i.test(normalized)) {
      throw new Error("Unsupported expression");
    }
    return new Function("x", `return ${normalized};`);
  }

  function almostEqual(left, right, epsilon = 1e-4) {
    return Math.abs(left - right) <= epsilon;
  }

  function extractClaimedDerivative(draft = "") {
    const text = normalize(draft);
    const match = text.match(/f'\(x\)\s*=\s*([^.\n,;]+)/i);
    return match ? match[1].trim() : "";
  }

  function numericDerivative(fn, x) {
    const h = 1e-5;
    return (fn(x + h) - fn(x - h)) / (2 * h);
  }

  function verifyClaimedDerivative({ expression, draft }) {
    const derivativeExpr = extractClaimedDerivative(draft);
    if (!expression || !derivativeExpr) return { ok: true, issues: [] };
    let fn;
    let derivativeFn;
    try {
      fn = compileExpression(expression);
      derivativeFn = compileExpression(derivativeExpr);
    } catch (_) {
      return { ok: true, issues: [] };
    }
    const samplePoints = [-2, -0.5, 1, 2.5];
    const failed = samplePoints.some((x) => !almostEqual(Number(derivativeFn(x)), numericDerivative(fn, x), 5e-3));
    if (!failed) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "derivative-check-failed",
        message: "Die angegebene Ableitung passt numerisch nicht zur Funktion.",
      }],
    };
  }

  function extractClaimedLine(draft = "") {
    const text = normalize(draft);
    const match = text.match(/y\s*=\s*([^.\n,;]+)/i);
    return match ? match[1].trim() : "";
  }

  function verifyClaimedTangent({ expression, point, draft }) {
    const lineExpr = extractClaimedLine(draft);
    if (!expression || !lineExpr || !point) return { ok: true, issues: [] };
    let fn;
    let lineFn;
    try {
      fn = compileExpression(expression);
      lineFn = compileExpression(lineExpr);
    } catch (_) {
      return { ok: true, issues: [] };
    }
    const slope = numericDerivative(fn, point.x);
    const lineSlope = numericDerivative(lineFn, point.x);
    const pointMatch = almostEqual(Number(lineFn(point.x)), Number(point.y), 5e-3);
    const slopeMatch = almostEqual(Number(lineSlope), Number(slope), 5e-3);
    if (pointMatch && slopeMatch) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "tangent-check-failed",
        message: "Die angegebene Tangente passt nicht zugleich zu Punkt und Steigung.",
      }],
    };
  }

  function extractClaimedScalar(draft = "", keywordPattern) {
    const text = normalize(draft);
    const match = text.match(new RegExp(`${keywordPattern}[^0-9-]*(-?\\d+(?:\\.\\d+)?)`, "i"));
    return match ? Number(match[1]) : null;
  }

  function numericIntegral(fn, from, to, steps = 2000) {
    const dx = (to - from) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const x1 = from + i * dx;
      const x2 = x1 + dx;
      sum += (fn(x1) + fn(x2)) * 0.5 * dx;
    }
    return sum;
  }

  function verifyClaimedArea({ expression, interval, draft }) {
    const claimed = extractClaimedScalar(draft, "(?:flaecheninhalt|fläche|flaeche)");
    if (!expression || claimed == null || !interval) return { ok: true, issues: [] };
    let fn;
    try {
      fn = compileExpression(expression);
    } catch (_) {
      return { ok: true, issues: [] };
    }
    const actual = Math.abs(numericIntegral(fn, interval.from, interval.to));
    if (almostEqual(actual, claimed, 1e-2)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "area-check-failed",
        message: `Der angegebene Flächeninhalt passt nicht zum Intervall [${interval.from}, ${interval.to}].`,
      }],
    };
  }

  function verifyClaimedRoots({ expression, draft }) {
    const roots = extractClaimedRoots(draft);
    if (!expression || !roots.length) return { ok: true, issues: [] };
    let fn;
    try {
      fn = compileExpression(expression);
    } catch (_) {
      return { ok: true, issues: [] };
    }
    const failures = roots.filter((x) => {
      try {
        return Math.abs(Number(fn(x))) > 1e-6;
      } catch (_) {
        return false;
      }
    });
    if (!failures.length) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{
        code: "root-check-failed",
        message: `Mindestens eine genannte Nullstelle erfüllt f(x)=0 nicht: ${failures.join(", ")}`,
      }],
    };
  }

  function verifyProbabilityBounds(draft = "") {
    const issues = [];
    const regex = /wahrscheinlichkeit[^0-9-]*(-?\d+(?:\.\d+)?)/gi;
    let match;
    while ((match = regex.exec(normalize(draft))) !== null) {
      const value = Number(match[1]);
      const suffix = draft.slice(match.index, match.index + 40);
      if (!suffix.includes("%") && (value < 0 || value > 1)) {
        issues.push({
          code: "probability-out-of-range",
          message: `Wahrscheinlichkeiten müssen zwischen 0 und 1 liegen, gefunden: ${value}.`,
        });
      }
    }
    return { ok: issues.length === 0, issues };
  }

  const api = {
    extractFunctionExpressionFromTask,
    extractPointFromTask,
    extractIntervalFromTask,
    extractClaimedRoots,
    extractClaimedDerivative,
    verifyClaimedRoots,
    verifyClaimedDerivative,
    verifyClaimedTangent,
    verifyClaimedArea,
    verifyProbabilityBounds,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaAnalysisGuards = api;
})(typeof window !== "undefined" ? window : globalThis);
