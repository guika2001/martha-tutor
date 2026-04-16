(function (root) {
  const plotApi = typeof module !== "undefined" && module.exports
    ? require("./plot.js")
    : root && root.MarthaPlot
      ? root.MarthaPlot
      : null;

  const SUBSCRIPT_MAP = {
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
  };

  const SUPERSCRIPT_MAP = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
  };

  function normalizeText(text) {
    return String(text || "")
      .replace(/[−–]/g, "-")
      .replace(/\u00a0/g, " ");
  }

  function normalizeSubAndSuperscripts(text) {
    return normalizeText(text)
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUBSCRIPT_MAP[ch] || ch)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => SUPERSCRIPT_MAP[ch] || ch);
  }

  function normalizeMathExpression(text) {
    if (plotApi && typeof plotApi.normalizePlotExpression === "function") {
      return plotApi.normalizePlotExpression(text);
    }
    return normalizeText(text);
  }

  function cleanupExpressionCandidate(expr) {
    let cleaned = normalizeMathExpression(expr);
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    cleaned = cleaned.replace(/\s*x\s*(?:in|∈)\s*[A-Za-zℝ].*$/i, "").trim();
    const trailingWordMatch = cleaned.match(/\s+([A-Za-zÄÖÜäöüß]{2,})(.*)$/);
    if (trailingWordMatch) {
      const supported = new Set(["sin", "cos", "tan", "exp", "log", "sqrt", "abs", "pi", "x", "e", "a", "b", "c", "d", "p", "q", "s", "f", "g", "h", "u", "w", "y"]);
      if (!supported.has(trailingWordMatch[1].toLowerCase())) {
        cleaned = cleaned.slice(0, trailingWordMatch.index).trim();
      }
    }
    cleaned = cleaned.replace(/\.\s+[A-ZÄÖÜ].*$/, "").trim();
    cleaned = cleaned.replace(/[.,;:]+$/, "").trim();
    cleaned = cleaned
      .replace(/\s*([+\-*/^])\s*/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\)\s*\(/g, ")*(")
      .replace(/(\d|\))(?=Math\.)/g, "$1*")
      .replace(/(\d|\))(?=[A-Za-z(])/g, "$1*");
    return cleaned;
  }

  function toNumber(expr) {
    const normalized = normalizeSubAndSuperscripts(String(expr || ""))
      .replace(/\s+/g, "")
      .replace(/,/g, ".")
      .replace(/π/g, "Math.PI")
      .replace(/√\s*\(/g, "Math.sqrt(")
      .replace(/√\s*([0-9.]+)/g, "Math.sqrt($1)")
      .replace(/(\d|\))(?=Math\.)/g, "$1*")
      .replace(/(\d|\))(?=\()/g, "$1*")
      .replace(/(\d)([A-Za-z])/g, "$1*$2")
      .replace(/Math\.PI(\d)/g, "Math.PI*$1");
    if (!normalized) return null;
    try {
      const value = Function("Math", `"use strict"; return (${normalized});`)(Math);
      return Number.isFinite(Number(value)) ? Number(value) : null;
    } catch (_) {
      return null;
    }
  }

  function normalizePointName(name) {
    return normalizeSubAndSuperscripts(String(name || "")).replace(/\s+/g, "");
  }

  function normalizeTaskText(task = {}) {
    return [task.question, task.expected_answer].filter(Boolean).join("\n");
  }

  function extractFunctionExpressionFromTask(task = {}) {
    const text = normalizeTaskText(task);
    const re = /([A-Za-z][A-Za-z0-9_]*)\s*\(\s*x\s*\)\s*=\s*([^,\n;]+)/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const expr = cleanupExpressionCandidate(match[2]);
      if (expr) return expr;
    }
    return "";
  }

  function extractFunctionNameFromTask(task = {}) {
    const text = normalizeTaskText(task);
    const re = /([A-Za-z][A-Za-z0-9_]*)\s*\(\s*x\s*\)\s*=\s*([^,\n;]+)/g;
    let fallback = "";
    let match;
    while ((match = re.exec(text)) !== null) {
      const name = normalizePointName(match[1]);
      if (!fallback) fallback = name;
      if (name && name === name.toLowerCase()) return name;
    }
    return fallback;
  }

  function extractNamedPointsFromTask(task = {}) {
    const text = normalizeTaskText(task);
    const re = /([A-Za-zÄÖÜäöü][A-Za-z0-9_₀₁₂₃₄₅₆₇₈₉]*)\s*\(\s*([^|()]+?)\s*\|\s*([^|()]+?)\s*\)/g;
    const points = [];
    const seen = new Set();
    let match;
    while ((match = re.exec(text)) !== null) {
      const name = normalizePointName(match[1]);
      const x = toNumber(match[2]);
      const y = toNumber(match[3]);
      if (!name || x == null || y == null) continue;
      const key = `${name}:${x}:${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({ name, x, y });
    }
    return points;
  }

  function extractTangentCueFromTask(task = {}, namedPoints = []) {
    const text = normalizeSubAndSuperscripts(normalizeTaskText(task));
    const pointLookup = new Map(namedPoints.map((point) => [point.name, point]));

    const xMatch = text.match(/Tangente[^.\n]*?\b(?:an der Stelle|bei)\s*x\s*=\s*([^\s,\n.;)]+)/i)
      || text.match(/\b(?:an der Stelle|bei)\s*x\s*=\s*([^\s,\n.;)]+)/i);
    if (xMatch) {
      const atX = toNumber(xMatch[1]);
      if (atX != null) return { atX };
    }

    const atPointMatch = text.match(/Tangente[^.\n]*?\b(?:im Punkt|durch den Punkt)\s+([A-Za-zÄÖÜäöü][A-Za-z0-9_₀₁₂₃₄₅₆₇₈₉]*)/i);
    if (atPointMatch) {
      const name = normalizePointName(atPointMatch[1]);
      return pointLookup.has(name)
        ? { atPoint: pointLookup.get(name) }
        : { atPointName: name };
    }

    const simplePointMatch = text.match(/(?:im Punkt|durch den Punkt)\s+([A-Za-zÄÖÜäöü][A-Za-z0-9_₀₁₂₃₄₅₆₇₈₉]*)/i);
    if (simplePointMatch) {
      const name = normalizePointName(simplePointMatch[1]);
      return pointLookup.has(name)
        ? { atPoint: pointLookup.get(name) }
        : { atPointName: name };
    }

    return null;
  }

  function extractAreaCueFromTask(task = {}) {
    const text = normalizeSubAndSuperscripts(normalizeTaskText(task));

    const bracketMatch = text.match(/(?:Intervall|im Intervall|von)?\s*\[\s*([^;\]]+)\s*[;,]\s*([^\]]+)\s*\]/i);
    if (bracketMatch) {
      const from = toNumber(bracketMatch[1]);
      const to = toNumber(bracketMatch[2]);
      if (from != null && to != null) return { from, to };
    }

    const explicitIntegral = text.match(/∫\s*([0-9A-Za-z+\-*/().,√π]+)\s*\^\s*\(\s*([0-9A-Za-z+\-*/.,√π]+)\s*\)/)
      || text.match(/∫\s*([0-9A-Za-z+\-*/().,√π]+)\s*\^\s*([0-9A-Za-z+\-*/.,√π]+)/);
    if (explicitIntegral) {
      const from = toNumber(explicitIntegral[1]);
      const to = toNumber(explicitIntegral[2]);
      if (from != null && to != null) return { from, to };
    }

    const compactIntegral = text.match(/∫\s*([0-9A-Za-z+\-*/().,√π]+)\s*([0-9A-Za-z+\-*/().,√π]+)/);
    if (compactIntegral) {
      const from = toNumber(compactIntegral[1]);
      const to = toNumber(compactIntegral[2]);
      if (from != null && to != null) return { from, to };
    }

    const fromToMatch = text.match(/von\s*([0-9A-Za-z+\-*/().,√π]+)\s*bis\s*([0-9A-Za-z+\-*/().,√π]+)/i);
    if (fromToMatch) {
      const from = toNumber(fromToMatch[1]);
      const to = toNumber(fromToMatch[2]);
      if (from != null && to != null) return { from, to };
    }

    return null;
  }

  function buildAnalysisRedrawModel(task = {}) {
    const functionExpression = extractFunctionExpressionFromTask(task);
    if (!functionExpression) return null;

    const functionName = extractFunctionNameFromTask(task);
    const namedPoints = extractNamedPointsFromTask(task);
    const tangentCue = extractTangentCueFromTask(task, namedPoints);
    const areaCue = extractAreaCueFromTask(task);

    return {
      kind: "analysis-redraw",
      functionName,
      functionExpression,
      namedPoints,
      tangentCue,
      areaCue,
    };
  }

  function renderAnalysisRedraw(container, model = {}) {
    if (!container || !model || !model.functionExpression || typeof math === "undefined") return false;
    container.innerHTML = "";
    const doc = container.ownerDocument;
    const canvas = doc.createElement("canvas");
    canvas.className = "pdf-preview-canvas";
    container.appendChild(canvas);

    const width = 420;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#24293b";
    ctx.lineWidth = 1;

    const xMin = -5;
    const xMax = 5;
    const samples = [];
    let yMin = Infinity;
    let yMax = -Infinity;
    let fn;
    try {
      const code = math.parse(model.functionExpression).compile();
      fn = (x) => code.evaluate({ x, e: Math.E, pi: Math.PI, PI: Math.PI });
    } catch (_) {
      return false;
    }

    for (let i = 0; i <= 240; i++) {
      const x = xMin + (i / 240) * (xMax - xMin);
      const y = fn(x);
      if (Number.isFinite(y)) {
        samples.push({ x, y });
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
      }
    }
    if (!samples.length) return false;
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const pad = 24;
    const toX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (width - 2 * pad);
    const toY = (y) => height - pad - ((y - yMin) / (yMax - yMin)) * (height - 2 * pad);

    ctx.beginPath();
    ctx.moveTo(toX(0), pad);
    ctx.lineTo(toX(0), height - pad);
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(width - pad, toY(0));
    ctx.stroke();

    ctx.strokeStyle = "#7c6cff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((point, index) => {
      const px = toX(point.x);
      const py = toY(point.y);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    if (Array.isArray(model.namedPoints)) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "12px sans-serif";
      model.namedPoints.forEach((point) => {
        const px = toX(point.x);
        const py = toY(point.y);
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(point.name, px + 6, py - 6);
      });
    }

    return true;
  }

  const api = {
    buildAnalysisRedrawModel,
    extractFunctionExpressionFromTask,
    extractFunctionNameFromTask,
    extractNamedPointsFromTask,
    extractTangentCueFromTask,
    extractAreaCueFromTask,
    renderAnalysisRedraw,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaAnalysisRedraw = api;
})(typeof window !== "undefined" ? window : globalThis);
