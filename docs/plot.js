(function (root) {
  function normalizePlotExpression(text) {
    if (!text) return "";
    let t = String(text);
    t = t.replace(/\$\$?/g, " ");
    t = t.replace(/\\cdot/g, "*").replace(/[·⋅]/g, "*");
    t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");
    t = t.replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)");
    t = t.replace(/\\left|\\right/g, "");
    t = t.replace(/\\[,;]/g, " ");
    t = t.replace(/\\in/g, "").replace(/\\mathbb\{R\}/g, "").replace(/[ℝ∈]/g, "");
    t = t.replace(/[²]/g, "^2").replace(/[³]/g, "^3").replace(/[⁴]/g, "^4");
    t = t.replace(/π/g, "pi");
    t = t.replace(/(\d),(\d)/g, "$1.$2");
    t = t.replace(/[−–]/g, "-");
    t = t.replace(/e\^\{([^}]+)\}/g, "exp($1)");
    t = t.replace(/e\^\(([^)]+)\)/g, "exp($1)");
    t = t.replace(/e\^(-?[\w.*+\-/()]+)/g, "exp($1)");
    return t.trim();
  }

  function hasOnlySupportedIdentifiers(expr) {
    const stripped = expr.replace(/\b(?:exp|sin|cos|tan|log|sqrt|abs|pi|PI|x|e)\b/g, " ");
    return !/[a-zA-ZáéíóöőúüűÄÖÜäöüß]{2,}/.test(stripped);
  }

  function extractFunctions(text) {
    const t = normalizePlotExpression(text);
    if (!t) return [];
    const mathWords = new Set(["exp", "sin", "cos", "tan", "log", "sqrt", "pi", "abs", "ln", "max", "min"]);
    const pat = /([fghDupw])\s*\(\s*x\s*\)\s*=\s*([^,;\n]+)/gm;
    const results = [];
    let m;
    while ((m = pat.exec(t)) !== null) {
      let expr = m[2].trim();
      expr = expr.replace(/\s+[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰäöüÄÖÜß]{2,}.*$/, (match) => {
        const word = match.trim().split(/\s+/)[0].toLowerCase();
        return mathWords.has(word) ? match : "";
      });
      expr = expr.trim().replace(/[,;.\s]+$/, "");
      if (expr.length < 3 || !expr.includes("x")) continue;
      if (!hasOnlySupportedIdentifiers(expr.replace(/ln\(/g, "log("))) continue;
      const noMath = expr.replace(/exp|sin|cos|tan|log|sqrt|abs|pi/g, "##");
      if (/(?<!\w)[a-wyzA-WYZ](?=\*?x|\^|\*|\s*[+\-])/.test(noMath)) continue;
      expr = expr.replace(/(\d)([x(])/g, "$1*$2");
      expr = expr.replace(/([)])(\d)/g, "$1*$2");
      expr = expr.replace(/([x)])([x(])/g, "$1*$2");
      expr = expr.replace(/ln\(/g, "log(");
      results.push({ name: m[1], expr });
    }
    return results;
  }

  function guessRange(expr) {
    const s = normalizePlotExpression(expr);
    let xmin = -5;
    let xmax = 5;
    if (s.includes("exp(-0.4") || s.includes("exp(-0,4")) { xmin = 0; xmax = 20; }
    else if (s.includes("exp(-x") || s.includes("exp(-1")) { xmin = -2; xmax = 8; }
    else if (s.includes("exp(2") || s.includes("exp(2*x")) { xmin = -2; xmax = 2; }
    else if (s.includes("sin") || s.includes("cos")) { xmin = 0; xmax = 4 * Math.PI; }
    else if (s.includes("log(") || s.includes("ln(")) { xmin = 0.1; xmax = 10; }
    return [xmin, xmax];
  }

  function detectPlots(text) {
    const t = normalizePlotExpression(text);
    const pats = [
      /\[\s*PLOT\s*:\s*(?:f\(x\)\s*=\s*)?(.+?)\s*:\s*([-\d.]+)\s*:\s*([-\d.]+)\s*\]/gi,
      /PLOT\s*\(\s*(?:f\(x\)\s*=\s*)?(.+?)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/gi,
      /PLOT\s*:\s*(?:f\(x\)\s*=\s*)?(.+?)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)/gi,
    ];
    const found = [];
    for (const p of pats) {
      let m;
      while ((m = p.exec(t)) !== null) {
        found.push({ expr: m[1].trim(), xmin: parseFloat(m[2]), xmax: parseFloat(m[3]) });
      }
      if (found.length) break;
    }
    return found;
  }

  function validatePlotExpression(expr) {
    const normalized = normalizePlotExpression(expr)
      .replace(/(\d)([x(])/g, "$1*$2")
      .replace(/([)])(\d)/g, "$1*$2")
      .replace(/([x)])([x(])/g, "$1*$2");
    if (!normalized || !normalized.includes("x")) {
      return { ok: false, reason: "Kein plottbarer Funktionsterm mit x gefunden." };
    }
    if (!hasOnlySupportedIdentifiers(normalized)) {
      return { ok: false, reason: "Der Term enthält nicht unterstützte Bezeichner." };
    }
    if (typeof math !== "undefined") {
      try {
        math.parse(normalized);
      } catch (error) {
        return { ok: false, reason: "Parse-Fehler: " + error.message };
      }
    }
    return { ok: true, expr: normalized };
  }

  function niceStep(range, maxTicks) {
    const v = range / maxTicks;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const rs = v / mag;
    if (rs <= 1.5) return mag;
    if (rs <= 3) return 2 * mag;
    if (rs <= 7) return 5 * mag;
    return 10 * mag;
  }

  function niceNum(n) {
    if (Math.abs(n) < 1e-10) return "0";
    if (Math.abs(n) >= 1000) return Math.round(n).toString();
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2).replace(/\.?0+$/, "");
  }

  function drawPlot(expr, xmin, xmax, targetEl) {
    const validation = validatePlotExpression(expr);
    const wrap = document.createElement("div");
    wrap.className = "pbox";

    const lbl = document.createElement("div");
    lbl.className = "plbl";
    lbl.textContent = "f(x) = " + expr;
    wrap.appendChild(lbl);

    if (!validation.ok) {
      const err = document.createElement("div");
      err.className = "abw";
      err.textContent = validation.reason;
      wrap.appendChild(err);
      targetEl.appendChild(wrap);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 240;
    canvas.style.cssText = "width:100%;height:auto;border-radius:8px;background:#0f1117";
    wrap.insertBefore(canvas, lbl);
    targetEl.appendChild(wrap);

    const ctx = canvas.getContext("2d");
    const W = 400, H = 240, pad = 40;
    let fn;
    try {
      const node = math.parse(validation.expr);
      const code = node.compile();
      fn = (x) => {
        try { return code.evaluate({ x, e: Math.E, pi: Math.PI, PI: Math.PI }); }
        catch (_) { return NaN; }
      };
    } catch (ex) {
      const err = document.createElement("div");
      err.className = "abw";
      err.textContent = "Parse-Fehler: " + ex.message;
      wrap.appendChild(err);
      return;
    }

    const steps = 500;
    const dx = (xmax - xmin) / steps;
    const pts = [];
    let ymin = Infinity;
    let ymax = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const x = xmin + i * dx;
      const y = fn(x);
      if (isFinite(y) && !isNaN(y)) {
        pts.push({ x, y });
        if (y < ymin) ymin = y;
        if (y > ymax) ymax = y;
      }
    }
    if (pts.length < 2) {
      const err = document.createElement("div");
      err.className = "abw";
      err.textContent = "Keine darstellbaren Werte im gewählten Bereich.";
      wrap.appendChild(err);
      return;
    }

    const yR = ymax - ymin || 1;
    ymin -= yR * 0.1;
    ymax += yR * 0.1;
    const toX = (x) => pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad);
    const toY = (y) => H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad);

    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1c1f2b";
    ctx.lineWidth = 1;
    ctx.font = "11px -apple-system,sans-serif";
    ctx.fillStyle = "#555a73";
    ctx.textAlign = "center";

    const xStep = niceStep(xmax - xmin, 8);
    const xStart = Math.ceil(xmin / xStep) * xStep;
    for (let x = xStart; x <= xmax; x += xStep) {
      const px = toX(x);
      ctx.beginPath();
      ctx.moveTo(px, pad);
      ctx.lineTo(px, H - pad);
      ctx.stroke();
      ctx.fillText(niceNum(x), px, H - pad + 16);
    }

    ctx.textAlign = "right";
    const yStep = niceStep(ymax - ymin, 6);
    const yStart = Math.ceil(ymin / yStep) * yStep;
    for (let y = yStart; y <= ymax; y += yStep) {
      const py = toY(y);
      ctx.beginPath();
      ctx.moveTo(pad, py);
      ctx.lineTo(W - pad, py);
      ctx.stroke();
      ctx.fillText(niceNum(y), pad - 8, py + 4);
    }

    ctx.strokeStyle = "#3a3f55";
    ctx.lineWidth = 1.5;
    if (xmin <= 0 && xmax >= 0) {
      const ax = toX(0);
      ctx.beginPath();
      ctx.moveTo(ax, pad);
      ctx.lineTo(ax, H - pad);
      ctx.stroke();
    }
    if (ymin <= 0 && ymax >= 0) {
      const ay = toY(0);
      ctx.beginPath();
      ctx.moveTo(pad, ay);
      ctx.lineTo(W - pad, ay);
      ctx.stroke();
    }

    function drawCurve(strokeStyle, lineWidth) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        const px = toX(p.x);
        const py = toY(p.y);
        if (py >= pad - 10 && py <= H - pad + 10) {
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    drawCurve("rgba(124,108,255,0.15)", 8);
    drawCurve("#7c6cff", 2.5);
  }

  function renderPlotsFromText(text, containerEl, label) {
    const plots = detectPlots(text);
    const funcs = plots.length ? [] : extractFunctions(text);
    const items = plots.length
      ? plots.map((p) => ({ expr: p.expr, xmin: p.xmin, xmax: p.xmax }))
      : funcs.map((f) => {
          const range = guessRange(f.expr);
          return { expr: f.expr, xmin: range[0], xmax: range[1] };
        });
    if (!items.length) return;
    const section = document.createElement("div");
    section.style.cssText = "margin-top:12px;border-top:1px solid var(--bd);padding-top:10px";
    const lbl = document.createElement("div");
    lbl.style.cssText = "font-size:.75rem;color:var(--ac);font-weight:600;margin-bottom:6px";
    lbl.textContent = label || "📈 Funktion";
    section.appendChild(lbl);
    items.forEach(({ expr, xmin, xmax }) => drawPlot(expr, xmin, xmax, section));
    containerEl.appendChild(section);
  }

  const api = {
    normalizePlotExpression,
    extractFunctions,
    guessRange,
    detectPlots,
    validatePlotExpression,
    drawPlot,
    renderPlotsFromText,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaPlot = api;
})(typeof window !== "undefined" ? window : globalThis);
