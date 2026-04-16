(function (root) {
  function normalize(text) {
    return String(text || "")
      .replace(/[−–]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseVector(raw) {
    if (!raw) return null;
    const parts = raw.split("|").map((part) => Number(part.trim().replace(",", ".")));
    return parts.length === 3 && parts.every((value) => Number.isFinite(value)) ? parts : null;
  }

  function extractLineDirections(text = "") {
    const directions = {};
    const regex = /\b([gh])\s*:\s*x\s*=\s*\(([^()]+)\)\s*\+\s*[a-z]\s*\(([^()]+)\)/gi;
    let match;
    while ((match = regex.exec(normalize(text))) !== null) {
      const direction = parseVector(match[3]);
      if (direction) directions[match[1].toLowerCase()] = direction;
    }
    return directions;
  }

  function extractNamedVectors(text = "") {
    const vectors = {};
    const regex = /\b([a-z])\s*=\s*\(([^()]+)\)/gi;
    let match;
    while ((match = regex.exec(normalize(text))) !== null) {
      const vector = parseVector(match[2]);
      if (vector) vectors[match[1].toLowerCase()] = vector;
    }
    return vectors;
  }

  function extractNamedPoint(draft = "") {
    const match = normalize(draft).match(/\b([A-Z])\s*\(([^()]+)\)\s*liegt auf\s*([ghe])/i);
    if (!match) return null;
    const point = parseVector(match[2]);
    if (!point) return null;
    return { label: match[1], point, target: match[3].toLowerCase() };
  }

  function extractPlaneEquation(text = "") {
    const match = normalize(text).match(/\bE\s*:\s*([+-]?\d*)x\s*([+-]\s*\d*)y\s*([+-]\s*\d*)z\s*=\s*([+-]?\d+(?:\.\d+)?)/i);
    if (!match) return null;
    const coeff = (raw, fallbackSign = 1) => {
      const cleaned = raw.replace(/\s+/g, "");
      if (cleaned === "+" || cleaned === "") return fallbackSign;
      if (cleaned === "-") return -1;
      return Number(cleaned);
    };
    return {
      a: coeff(match[1]),
      b: coeff(match[2]),
      c: coeff(match[3]),
      d: Number(match[4]),
    };
  }

  function dot(left, right) {
    return left.reduce((sum, value, index) => sum + value * right[index], 0);
  }

  function cross(left, right) {
    return [
      left[1] * right[2] - left[2] * right[1],
      left[2] * right[0] - left[0] * right[2],
      left[0] * right[1] - left[1] * right[0],
    ];
  }

  function almostZero(value, epsilon = 1e-6) {
    return Math.abs(value) <= epsilon;
  }

  function isParallel(left, right) {
    const product = cross(left, right);
    return product.every((value) => almostZero(value));
  }

  function isOrthogonal(left, right) {
    return almostZero(dot(left, right));
  }

  function parseLineBase(text = "", target = "g") {
    const regex = new RegExp(`\\b${target}\\s*:\\s*x\\s*=\\s*\\(([^()]+)\\)\\s*\\+\\s*[a-z]\\s*\\(([^()]+)\\)`, "i");
    const match = normalize(text).match(regex);
    if (!match) return null;
    const base = parseVector(match[1]);
    const direction = parseVector(match[2]);
    if (!base || !direction) return null;
    return { base, direction };
  }

  function parsePlaneEquationWithLabel(text = "", target = "E") {
    const normalized = normalize(text);
    const generalRegex = new RegExp(`\\b${target}\\s*:\\s*([+-]?\\d*)x\\s*([+-]\\s*\\d*)y\\s*([+-]\\s*\\d*)z\\s*=\\s*([+-]?\\d+(?:\\.\\d+)?)`, "i");
    let match = normalized.match(generalRegex);
    if (match) {
      const coeff = (raw, fallbackSign = 1) => {
        const cleaned = raw.replace(/\s+/g, "");
        if (cleaned === "+" || cleaned === "") return fallbackSign;
        if (cleaned === "-") return -1;
        return Number(cleaned);
      };
      return {
        a: coeff(match[1]),
        b: coeff(match[2]),
        c: coeff(match[3]),
        d: Number(match[4]),
      };
    }
    const axisRegex = new RegExp(`\\b${target}\\s*:\\s*([xyz])\\s*=\\s*([+-]?\\d+(?:\\.\\d+)?)`, "i");
    match = normalized.match(axisRegex);
    if (!match) return null;
    const axis = match[1].toLowerCase();
    const constant = Number(match[2]);
    return axis === "x"
      ? { a: 1, b: 0, c: 0, d: constant }
      : axis === "y"
        ? { a: 0, b: 1, c: 0, d: constant }
        : { a: 0, b: 0, c: 1, d: constant };
  }

  function pointOnLine(point, line) {
    let lambda = null;
    for (let i = 0; i < 3; i++) {
      const dir = line.direction[i];
      const diff = point[i] - line.base[i];
      if (almostZero(dir)) {
        if (!almostZero(diff)) return false;
        continue;
      }
      const current = diff / dir;
      if (lambda == null) lambda = current;
      if (!almostZero(current - lambda, 1e-5)) return false;
    }
    return true;
  }

  function classifyLineLineRelation(lineLeft, lineRight) {
    const directionCross = cross(lineLeft.direction, lineRight.direction);
    if (directionCross.every((value) => almostZero(value))) return "parallel";
    const baseDiff = lineRight.base.map((value, index) => value - lineLeft.base[index]);
    if (!almostZero(dot(baseDiff, directionCross))) return "skew";
    return "intersecting";
  }

  function classifyLinePlaneRelation(line, plane) {
    const denominator = plane.a * line.direction[0] + plane.b * line.direction[1] + plane.c * line.direction[2];
    const offset = plane.a * line.base[0] + plane.b * line.base[1] + plane.c * line.base[2] - plane.d;
    if (almostZero(denominator)) return almostZero(offset) ? "contained" : "parallel";
    return "intersecting";
  }

  function verifyParallelLinesClaim({ task, draft }) {
    const text = normalize(draft);
    if (!/\bparallel\b/i.test(text)) return { ok: true, issues: [] };
    const directions = extractLineDirections(task?.question || "");
    if (!directions.g || !directions.h) return { ok: true, issues: [] };
    if (isParallel(directions.g, directions.h)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "vector-parallel-check-failed", message: "Die behauptete Parallelitaet passt nicht zu den Richtungsvektoren." }],
    };
  }

  function verifyOrthogonalityClaim({ task, draft }) {
    const text = normalize(draft);
    if (!/\b(orthogonal|rechtwinklig)\b/i.test(text)) return { ok: true, issues: [] };
    const vectors = extractNamedVectors(task?.question || "");
    const lineDirections = extractLineDirections(task?.question || "");
    const left = vectors.a || lineDirections.g;
    const right = vectors.b || lineDirections.h;
    if (!left || !right) return { ok: true, issues: [] };
    if (isOrthogonal(left, right)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "vector-orthogonality-check-failed", message: "Die behauptete Orthogonalitaet passt nicht zum Skalarprodukt der Vektoren." }],
    };
  }

  function verifyPointOnLineClaim({ task, draft }) {
    const claim = extractNamedPoint(draft);
    if (!claim || claim.target === "e") return { ok: true, issues: [] };
    const line = parseLineBase(task?.question || "", claim.target);
    if (!line) return { ok: true, issues: [] };
    if (pointOnLine(claim.point, line)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "point-line-check-failed", message: `Der behauptete Punkt liegt nicht auf ${claim.target}.` }],
    };
  }

  function verifyPointOnPlaneClaim({ task, draft }) {
    const claim = extractNamedPoint(draft);
    if (!claim || claim.target !== "e") return { ok: true, issues: [] };
    const plane = extractPlaneEquation(task?.question || "");
    if (!plane) return { ok: true, issues: [] };
    const value = plane.a * claim.point[0] + plane.b * claim.point[1] + plane.c * claim.point[2];
    if (almostZero(value - plane.d, 1e-6)) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "point-plane-check-failed", message: "Der behauptete Punkt erfuellt die Ebenengleichung nicht." }],
    };
  }

  function verifyLineLineRelationClaim({ task, draft }) {
    const text = normalize(draft);
    if (!/\b(schneiden sich|parallel|windschief)\b/i.test(text)) return { ok: true, issues: [] };
    const left = parseLineBase(task?.question || "", "g");
    const right = parseLineBase(task?.question || "", "h");
    if (!left || !right) return { ok: true, issues: [] };
    const actual = classifyLineLineRelation(left, right);
    const claimed = /\bparallel\b/i.test(text)
      ? "parallel"
      : /\bwindschief\b/i.test(text)
        ? "skew"
        : "intersecting";
    if (actual === claimed) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "vector-line-line-check-failed", message: "Die behauptete Lagebeziehung der Geraden passt nicht zu den Gleichungen." }],
    };
  }

  function verifyLinePlaneRelationClaim({ task, draft }) {
    const text = normalize(draft);
    if (!/\b(schneidet|parallel|liegt in)\b/i.test(text)) return { ok: true, issues: [] };
    const line = parseLineBase(task?.question || "", "g");
    const plane = parsePlaneEquationWithLabel(task?.question || "", "E");
    if (!line || !plane) return { ok: true, issues: [] };
    const actual = classifyLinePlaneRelation(line, plane);
    const claimed = /\bliegt in\b/i.test(text)
      ? "contained"
      : /\bparallel\b/i.test(text)
        ? "parallel"
        : "intersecting";
    if (actual === claimed) return { ok: true, issues: [] };
    return {
      ok: false,
      issues: [{ code: "vector-line-plane-check-failed", message: "Die behauptete Lagebeziehung von Gerade und Ebene passt nicht zu den Gleichungen." }],
    };
  }

  const api = {
    classifyLineLineRelation,
    classifyLinePlaneRelation,
    extractLineDirections,
    verifyLineLineRelationClaim,
    verifyLinePlaneRelationClaim,
    verifyParallelLinesClaim,
    verifyOrthogonalityClaim,
    verifyPointOnLineClaim,
    verifyPointOnPlaneClaim,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaVectorGuards = api;
})(typeof window !== "undefined" ? window : globalThis);
