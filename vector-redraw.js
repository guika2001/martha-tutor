(function (root) {
  function normalize(text) {
    return String(text || "")
      .replace(/[−–]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseComponent(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    const numeric = value.replace(",", ".");
    if (/^[+-]?\d+(?:\.\d+)?$/.test(numeric)) return Number(numeric);
    return value;
  }

  function parseTriple(raw) {
    const parts = String(raw || "")
      .split("|")
      .map((part) => parseComponent(part));
    return parts.length === 3 ? parts : null;
  }

  function stringifyComponent(value) {
    return typeof value === "number" ? String(value) : String(value);
  }

  function subtractComponents(left, right) {
    if (typeof left === "number" && typeof right === "number") return left - right;
    const minuend = stringifyComponent(left);
    const subtrahend = stringifyComponent(right);
    if (minuend === subtrahend) return "0";
    return `${minuend}-${subtrahend}`;
  }

  function hasNumericTriple(values) {
    return Array.isArray(values) && values.length === 3 && values.every((value) => typeof value === "number" && Number.isFinite(value));
  }

  function cloneTriple(values) {
    return Array.isArray(values) ? values.slice(0, 3) : null;
  }

  function isOriginMentioned(text) {
    return /\b(Koordinatenursprung|Ursprung)\b/i.test(text) || /\bO\b[^.?!]*\bbezeichnet\b/i.test(text);
  }

  function extractPoints(text = "") {
    const points = new Map();
    const normalized = normalize(text);
    const pointRegex = /\b([A-Z][A-Za-z0-9_]*)\s*\(([^()]*\|[^()]*\|[^()]*)\)/g;
    let match;
    while ((match = pointRegex.exec(normalized)) !== null) {
      const label = match[1];
      const coordinates = parseTriple(match[2]);
      if (!coordinates) continue;
      points.set(label, {
        label,
        coordinates,
        numericCoordinates: hasNumericTriple(coordinates) ? cloneTriple(coordinates) : null,
        raw: match[2].trim(),
      });
    }
    if (isOriginMentioned(normalized) && !points.has("O")) {
      points.set("O", {
        label: "O",
        coordinates: [0, 0, 0],
        numericCoordinates: [0, 0, 0],
        raw: "0|0|0",
        origin: true,
      });
    }
    return Array.from(points.values()).sort((left, right) => left.label.localeCompare(right.label));
  }

  function extractExplicitVectors(text = "") {
    const vectors = [];
    const normalized = normalize(text);
    const vectorRegex = /\b([A-Z]{1,3}|[a-z])\s*=\s*\(([^()]*\|[^()]*\|[^()]*)\)/g;
    let match;
    while ((match = vectorRegex.exec(normalized)) !== null) {
      const components = parseTriple(match[2]);
      if (!components) continue;
      vectors.push({
        label: match[1],
        components,
        numericComponents: hasNumericTriple(components) ? cloneTriple(components) : null,
        raw: match[2].trim(),
        source: "explicit",
      });
    }
    return vectors;
  }

  function extractLineEquations(text = "") {
    const lines = [];
    const normalized = normalize(text);
    const lineRegex = /\b([a-z])\s*:\s*x\s*=\s*\(([^()]*\|[^()]*\|[^()]*)\)\s*\+\s*([a-z])\s*\(([^()]*\|[^()]*\|[^()]*)\)/gi;
    let match;
    while ((match = lineRegex.exec(normalized)) !== null) {
      const base = parseTriple(match[2]);
      const direction = parseTriple(match[4]);
      if (!base || !direction) continue;
      lines.push({
        label: match[1],
        kind: "equation",
        baseCoordinates: base,
        direction,
        numericBaseCoordinates: hasNumericTriple(base) ? cloneTriple(base) : null,
        numericDirection: hasNumericTriple(direction) ? cloneTriple(direction) : null,
        raw: `x=(${match[2].trim()})+${match[3]}(${match[4].trim()})`,
      });
    }
    return lines;
  }

  function deriveLineDirectionVectors(lines = []) {
    return lines
      .filter((line) => Array.isArray(line.direction))
      .map((line) => ({
        label: line.label,
        kind: "direction",
        fromLine: line.label,
        components: cloneTriple(line.direction),
        numericComponents: line.numericDirection ? cloneTriple(line.numericDirection) : null,
        raw: line.raw,
        source: line.kind,
      }));
  }

  function extractPointPairLines(text = "", points = []) {
    const labels = new Map(points.map((point) => [point.label, point]));
    const lines = [];
    const normalized = normalize(text);
    const pairRegex = /\b(?:Gerade|Strecke)\b[^.?!]*?\b([A-Z])\b\s*(?:und|,)\s*\b([A-Z])\b/gi;
    let match;
    while ((match = pairRegex.exec(normalized)) !== null) {
      const left = labels.get(match[1]);
      const right = labels.get(match[2]);
      if (!left || !right) continue;
      const baseCoordinates = cloneTriple(left.coordinates);
      const direction = left.coordinates.map((value, index) => subtractComponents(right.coordinates[index], value));
      lines.push({
        label: `${left.label}${right.label}`,
        kind: "point-pair",
        pointLabels: [left.label, right.label],
        basePoint: left.label,
        baseCoordinates,
        direction,
        numericBaseCoordinates: left.numericCoordinates ? cloneTriple(left.numericCoordinates) : null,
        numericDirection: hasNumericTriple(direction) ? cloneTriple(direction) : null,
        raw: `${left.label}-${right.label}`,
      });
    }
    return lines;
  }

  function deriveVectorsFromPoints(text = "", points = []) {
    const pointLookup = new Map(points.map((point) => [point.label, point]));
    const normalized = normalize(text);
    const vectors = [];
    const pairRegex = /\b([A-Z])\b\s*(?:und|,)\s*\b([A-Z])\b/g;
    let match;
    const seen = new Set();
    while ((match = pairRegex.exec(normalized)) !== null) {
      const left = pointLookup.get(match[1]);
      const right = pointLookup.get(match[2]);
      if (!left || !right) continue;
      const key = `${left.label}${right.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      vectors.push({
        label: `${left.label}${right.label}`,
        kind: "point-difference",
        fromPoint: left.label,
        toPoint: right.label,
        components: left.coordinates.map((value, index) => subtractComponents(right.coordinates[index], value)),
        numericComponents: left.numericCoordinates && right.numericCoordinates
          ? right.numericCoordinates.map((value, index) => value - left.numericCoordinates[index])
          : null,
        raw: `${right.label}-${left.label}`,
      });
    }
    return vectors;
  }

  function cross(left, right) {
    return [
      left[1] * right[2] - left[2] * right[1],
      left[2] * right[0] - left[0] * right[2],
      left[0] * right[1] - left[1] * right[0],
    ];
  }

  function dot(left, right) {
    return left.reduce((sum, value, index) => sum + value * right[index], 0);
  }

  function almostZero(value, epsilon = 1e-6) {
    return Math.abs(value) <= epsilon;
  }

  function parseCoefficient(raw, fallbackSign = 1) {
    const cleaned = String(raw || "").replace(/\s+/g, "");
    if (cleaned === "+" || cleaned === "") return fallbackSign;
    if (cleaned === "-") return -1;
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : fallbackSign;
  }

  function extractPlanes(text = "") {
    const planes = [];
    const normalized = normalize(text);
    const generalRegex = /\b([A-Z])\s*:\s*([+-]?\d*)x\s*([+-]\s*\d*)y\s*([+-]\s*\d*)z\s*=\s*([+-]?\d+(?:\.\d+)?)/g;
    let match;
    while ((match = generalRegex.exec(normalized)) !== null) {
      planes.push({
        label: match[1],
        kind: "plane",
        normal: [
          parseCoefficient(match[2]),
          parseCoefficient(match[3]),
          parseCoefficient(match[4]),
        ],
        constant: Number(match[5]),
        raw: match[0],
      });
    }

    const simpleAxisRegex = /\b([A-Z])\s*:\s*([xyz])\s*=\s*([+-]?\d+(?:\.\d+)?)/g;
    while ((match = simpleAxisRegex.exec(normalized)) !== null) {
      const axis = match[2].toLowerCase();
      const constant = Number(match[3]);
      const normal = axis === "x" ? [1, 0, 0] : axis === "y" ? [0, 1, 0] : [0, 0, 1];
      planes.push({
        label: match[1],
        kind: "plane",
        normal,
        constant,
        raw: match[0],
      });
    }

    return planes;
  }

  function classifyLineLineRelation(left, right) {
    if (!left || !right || !left.numericBaseCoordinates || !left.numericDirection || !right.numericBaseCoordinates || !right.numericDirection) {
      return null;
    }
    const directionCross = cross(left.numericDirection, right.numericDirection);
    if (directionCross.every((value) => almostZero(value))) {
      return {
        kind: "line-line",
        labels: [left.label, right.label],
        status: "parallel",
      };
    }
    const baseDiff = right.numericBaseCoordinates.map((value, index) => value - left.numericBaseCoordinates[index]);
    if (!almostZero(dot(baseDiff, directionCross))) {
      return {
        kind: "line-line",
        labels: [left.label, right.label],
        status: "skew",
      };
    }
    return {
      kind: "line-line",
      labels: [left.label, right.label],
      status: "intersecting",
    };
  }

  function classifyLinePlaneRelation(line, plane) {
    if (!line || !plane || !line.numericBaseCoordinates || !line.numericDirection || !Array.isArray(plane.normal)) return null;
    const denominator = dot(plane.normal, line.numericDirection);
    const offset = dot(plane.normal, line.numericBaseCoordinates) - plane.constant;
    if (almostZero(denominator)) {
      return {
        kind: "line-plane",
        lineLabel: line.label,
        planeLabel: plane.label,
        status: almostZero(offset) ? "contained" : "parallel",
      };
    }
    return {
      kind: "line-plane",
      lineLabel: line.label,
      planeLabel: plane.label,
      status: "intersecting",
    };
  }

  function buildGeometryRelations(lines = [], planes = []) {
    const relations = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const relation = classifyLineLineRelation(lines[i], lines[j]);
        if (relation) relations.push(relation);
      }
    }
    lines.forEach((line) => {
      planes.forEach((plane) => {
        const relation = classifyLinePlaneRelation(line, plane);
        if (relation) relations.push(relation);
      });
    });
    return relations;
  }

  function buildValidationHint(points, lines, vectors) {
    const hasPoints = points.length > 0;
    const hasRelation = lines.length > 0 || vectors.length > 0;
    if (!hasPoints && !hasRelation) {
      return {
        supported: false,
        confidence: "low",
        reason: "No explicit 3D points were detected.",
        missing: ["points", "relations"],
      };
    }

    if (!hasRelation) {
      return {
        supported: false,
        confidence: "low",
        reason: "No line or vector relation was explicit enough to redraw safely, even though 3D points were found.",
        missing: ["relations"],
      };
    }

    if (!hasPoints && hasRelation) {
      const exactRelation = [...lines, ...vectors].every((item) => {
        if (item.baseCoordinates && item.direction) return hasNumericTriple(item.baseCoordinates) && hasNumericTriple(item.direction);
        if (item.numericComponents) return hasNumericTriple(item.numericComponents);
        return true;
      });
      return {
        supported: true,
        confidence: exactRelation ? "medium" : "low",
        reason: exactRelation
          ? "An explicit line or vector relation was detected without named points."
          : "A line or vector relation was detected, but only partially reconstructable data was available.",
        missing: [],
      };
    }

    const exactGeometry = [...points, ...lines, ...vectors].every((item) => {
      if (item.coordinates) return hasNumericTriple(item.coordinates);
      if (item.baseCoordinates && item.direction) return hasNumericTriple(item.baseCoordinates) && hasNumericTriple(item.direction);
      if (item.numericBaseCoordinates || item.numericDirection || item.numericComponents) {
        return Boolean(item.numericBaseCoordinates || item.numericDirection || item.numericComponents);
      }
      return true;
    });

    return {
      supported: true,
      confidence: exactGeometry ? "medium" : "low",
      reason: exactGeometry
        ? "Explicit 3D anchors and at least one relation were detected."
        : "Only partial 3D geometry could be reconstructed safely.",
      missing: [],
    };
  }

  function buildVectorRedrawModel(task = {}) {
    const question = normalize(task.question || "");
    const points = extractPoints(question);
    const lines = [...extractLineEquations(question), ...extractPointPairLines(question, points)];
    const planes = extractPlanes(question);
    const vectors = [
      ...extractExplicitVectors(question),
      ...deriveLineDirectionVectors(lines),
      ...deriveVectorsFromPoints(question, points),
    ];
    const geometryRelations = buildGeometryRelations(lines, planes);
    const validationHint = buildValidationHint(points, lines, vectors);

    return {
      kind: "vector-redraw-model",
      taskId: task.task_id || task.id || "",
      topic: task.topic || "",
      source: task.source ? { ...task.source } : null,
      question: task.question || "",
      points,
      lines,
      planes,
      vectors,
      geometryRelations,
      validationHint,
    };
  }

  function projectPoint(point, width, height, scale) {
    const [x, y, z] = point.numericCoordinates || [0, 0, 0];
    const px = width / 2 + (x - z * 0.35) * scale;
    const py = height / 2 - (y + z * 0.2) * scale;
    return { x: px, y: py };
  }

  function renderVectorRedraw(container, model = {}) {
    if (!container || !model) return false;
    const plottablePoints = Array.isArray(model.points)
      ? model.points.filter((point) => Array.isArray(point.numericCoordinates))
      : [];
    const lineAnchors = Array.isArray(model.lines)
      ? model.lines
        .filter((line) => Array.isArray(line.numericBaseCoordinates) && Array.isArray(line.numericDirection))
        .flatMap((line) => {
          const base = line.numericBaseCoordinates;
          const dir = line.numericDirection;
          return [
            { label: `${line.label}-0`, numericCoordinates: base },
            { label: `${line.label}-1`, numericCoordinates: base.map((value, index) => value + dir[index]) },
          ];
        })
      : [];
    const planeAnchors = Array.isArray(model.planes)
      ? model.planes.flatMap((plane) => {
        if (!Array.isArray(plane.normal)) return [];
        const [a, b, c] = plane.normal;
        if (almostZero(c)) return [];
        return [
          { label: `${plane.label}-a`, numericCoordinates: [0, 0, plane.constant / c] },
          { label: `${plane.label}-b`, numericCoordinates: [1, 0, (plane.constant - a) / c] },
          { label: `${plane.label}-c`, numericCoordinates: [0, 1, (plane.constant - b) / c] },
        ].filter((point) => point.numericCoordinates.every((value) => Number.isFinite(value)));
      })
      : [];
    const allAnchors = [...plottablePoints, ...lineAnchors, ...planeAnchors];
    if (!allAnchors.length) return false;

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

    const maxCoord = Math.max(1, ...allAnchors.flatMap((point) => point.numericCoordinates.map((value) => Math.abs(value))));
    const scale = Math.min(42, 140 / maxCoord);

    ctx.strokeStyle = "#24293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 16);
    ctx.lineTo(width / 2, height - 16);
    ctx.moveTo(16, height / 2);
    ctx.lineTo(width - 16, height / 2);
    ctx.stroke();

    const pointLookup = new Map(allAnchors.map((point) => [point.label, projectPoint(point, width, height, scale)]));

    ctx.fillStyle = "rgba(96,165,250,.12)";
    (model.planes || []).forEach((plane) => {
      const anchors = [`${plane.label}-a`, `${plane.label}-b`, `${plane.label}-c`]
        .map((label) => pointLookup.get(label))
        .filter(Boolean);
      if (anchors.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(anchors[0].x, anchors[0].y);
      anchors.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#93c5fd";
      ctx.font = "12px sans-serif";
      ctx.fillText(plane.label, anchors[0].x + 6, anchors[0].y - 6);
      ctx.fillStyle = "rgba(96,165,250,.12)";
    });

    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    (model.lines || []).forEach((line) => {
      const from = line.pointLabels && line.pointLabels.length >= 2
        ? pointLookup.get(line.pointLabels[0])
        : pointLookup.get(`${line.label}-0`);
      const to = line.pointLabels && line.pointLabels.length >= 2
        ? pointLookup.get(line.pointLabels[1])
        : pointLookup.get(`${line.label}-1`);
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.fillStyle = "#93c5fd";
      ctx.font = "12px sans-serif";
      ctx.fillText(line.label, to.x + 6, to.y + 12);
    });

    ctx.fillStyle = "#34d399";
    ctx.font = "12px sans-serif";
    plottablePoints.forEach((point) => {
      const projected = pointLookup.get(point.label);
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(point.label, projected.x + 6, projected.y - 6);
    });

    return true;
  }

  const api = {
    buildVectorRedrawModel,
    buildValidationHint,
    buildGeometryRelations,
    classifyLineLineRelation,
    classifyLinePlaneRelation,
    deriveVectorsFromPoints,
    extractExplicitVectors,
    deriveLineDirectionVectors,
    extractLineEquations,
    extractPlanes,
    extractPointPairLines,
    extractPoints,
    renderVectorRedraw,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaVectorRedraw = api;
})(typeof window !== "undefined" ? window : globalThis);
