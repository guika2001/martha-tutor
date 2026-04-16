(function (root) {
  const analysisApi = typeof module !== "undefined" && module.exports
    ? require("./analysis-guards.js")
    : root && root.MarthaAnalysisGuards
      ? root.MarthaAnalysisGuards
      : null;
  const stochastikApi = typeof module !== "undefined" && module.exports
    ? require("./stochastik-guards.js")
    : root && root.MarthaStochastikGuards
      ? root.MarthaStochastikGuards
      : null;
  const vectorApi = typeof module !== "undefined" && module.exports
    ? require("./vector-guards.js")
    : root && root.MarthaVectorGuards
      ? root.MarthaVectorGuards
      : null;
  const UNCERTAIN_PATTERNS = [
    /\bich glaube\b/i,
    /\bvielleicht\b/i,
    /\bvermutlich\b/i,
    /\bwahrscheinlich\b/i,
  ];
  const FIGURE_ASSERTION_PATTERNS = [
    /\baus der abbildung erkennt man\b/i,
    /\bdie grafik zeigt eindeutig\b/i,
    /\baus dem diagramm liest man ab\b/i,
    /\bin der skizze sieht man\b/i,
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[.,;:!?()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractReferenceTokens(text) {
    const raw = normalize(text).split(" ").filter(Boolean);
    const filtered = raw.filter((token) => /[=x0-9+\-/*^]/.test(token) || token.length > 3);
    return Array.from(new Set(filtered));
  }

  function compareWithReference(draft, reference) {
    const referenceTokens = extractReferenceTokens(reference);
    if (!referenceTokens.length) return 1;
    const draftText = normalize(draft);
    const hits = referenceTokens.filter((token) => draftText.includes(token)).length;
    return hits / referenceTokens.length;
  }

  function evaluateDraft({ task, draft }) {
    const issues = [];
    const text = String(draft || "").trim();
    if (!text) {
      issues.push({ code: "empty-draft", severity: "blocking", message: "Keine Lösung erzeugt." });
      return { ok: false, issues };
    }

    if (UNCERTAIN_PATTERNS.some((pattern) => pattern.test(text))) {
      issues.push({ code: "uncertain-language", severity: "blocking", message: "Unsichere Formulierungen sind in einer validierten Lösung nicht erlaubt." });
    }

    if (task && task.expected_answer) {
      const overlap = compareWithReference(text, task.expected_answer);
      if (overlap < 0.2) {
        issues.push({ code: "reference-mismatch", severity: "blocking", message: "Die Antwort weicht zu stark von der vorhandenen Musterlösung ab.", overlap });
      }
    }

    if (task && task.figureRequired && task.figureStatus !== "present" && FIGURE_ASSERTION_PATTERNS.some((pattern) => pattern.test(text))) {
      issues.push({
        code: "missing-figure-reference",
        severity: "blocking",
        message: `${task.figureLabel || "Abbildung"} ist im aktuellen Arbeitsbereich nicht sichtbar. Aussagen aus der Grafik dürfen nicht sicher behauptet werden.`,
      });
    }

    if (task && task.redrawState && task.redrawState.status === "uncertain" &&
        /aus der zeichnung.*sicher|eindeutig aus der abbildung/i.test(text)) {
      issues.push({
        code: "uncertain-redraw-claim",
        severity: "blocking",
        message: "Die Antwort behandelt eine unsichere Redraw-Darstellung als sicheren Beleg.",
      });
    }

    if (analysisApi) {
      const expression = analysisApi.extractFunctionExpressionFromTask
        ? analysisApi.extractFunctionExpressionFromTask(task)
        : "";
      const rootCheck = analysisApi.verifyClaimedRoots
        ? analysisApi.verifyClaimedRoots({ expression, draft: text })
        : { ok: true, issues: [] };
      const derivativeCheck = analysisApi.verifyClaimedDerivative
        ? analysisApi.verifyClaimedDerivative({ expression, draft: text })
        : { ok: true, issues: [] };
      const tangentPoint = analysisApi.extractPointFromTask
        ? analysisApi.extractPointFromTask(task, expression)
        : null;
      const tangentCheck = analysisApi.verifyClaimedTangent
        ? analysisApi.verifyClaimedTangent({ expression, point: tangentPoint, draft: text })
        : { ok: true, issues: [] };
      const interval = analysisApi.extractIntervalFromTask
        ? analysisApi.extractIntervalFromTask(task)
        : null;
      const areaCheck = analysisApi.verifyClaimedArea
        ? analysisApi.verifyClaimedArea({ expression, interval, draft: text })
        : { ok: true, issues: [] };
      const probabilityCheck = analysisApi.verifyProbabilityBounds
        ? analysisApi.verifyProbabilityBounds(text)
        : { ok: true, issues: [] };
      issues.push(
        ...(rootCheck.issues || []),
        ...(derivativeCheck.issues || []),
        ...(tangentCheck.issues || []),
        ...(areaCheck.issues || []),
        ...(probabilityCheck.issues || [])
      );
    }

    if (stochastikApi) {
      const params = stochastikApi.extractBinomialParamsFromTask
        ? stochastikApi.extractBinomialParamsFromTask(task)
        : null;
      const expectationCheck = stochastikApi.verifyClaimedExpectation
        ? stochastikApi.verifyClaimedExpectation({ params, draft: text })
        : { ok: true, issues: [] };
      const sigmaCheck = stochastikApi.verifyClaimedSigma
        ? stochastikApi.verifyClaimedSigma({ params, draft: text })
        : { ok: true, issues: [] };
      const interpretationCheck = stochastikApi.verifyProbabilityInterpretation
        ? stochastikApi.verifyProbabilityInterpretation(text)
        : { ok: true, issues: [] };
      issues.push(
        ...(expectationCheck.issues || []),
        ...(sigmaCheck.issues || []),
        ...(interpretationCheck.issues || [])
      );
    }

    if (vectorApi) {
      const parallelCheck = vectorApi.verifyParallelLinesClaim
        ? vectorApi.verifyParallelLinesClaim({ task, draft: text })
        : { ok: true, issues: [] };
      const orthogonalityCheck = vectorApi.verifyOrthogonalityClaim
        ? vectorApi.verifyOrthogonalityClaim({ task, draft: text })
        : { ok: true, issues: [] };
      const pointLineCheck = vectorApi.verifyPointOnLineClaim
        ? vectorApi.verifyPointOnLineClaim({ task, draft: text })
        : { ok: true, issues: [] };
      const pointPlaneCheck = vectorApi.verifyPointOnPlaneClaim
        ? vectorApi.verifyPointOnPlaneClaim({ task, draft: text })
        : { ok: true, issues: [] };
      issues.push(
        ...(parallelCheck.issues || []),
        ...(orthogonalityCheck.issues || []),
        ...(pointLineCheck.issues || []),
        ...(pointPlaneCheck.issues || [])
      );
    }

    return {
      ok: issues.length === 0,
      issues,
    };
  }

  const api = { compareWithReference, evaluateDraft };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionGuards = api;
})(typeof window !== "undefined" ? window : globalThis);
