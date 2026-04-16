(function (root) {
  const analysisApi = typeof module !== "undefined" && module.exports
    ? (() => { try { return require("./analysis-redraw.js"); } catch (_) { return null; } })()
    : root && root.MarthaAnalysisRedraw
      ? root.MarthaAnalysisRedraw
      : null;
  const vectorApi = typeof module !== "undefined" && module.exports
    ? (() => { try { return require("./vector-redraw.js"); } catch (_) { return null; } })()
    : root && root.MarthaVectorRedraw
      ? root.MarthaVectorRedraw
      : null;

  function buildFigureRedrawState({ task, pdfValidation, redrawResult }) {
    if (!task || !task.figureRequired) {
      return { status: "unavailable", engine: "", model: null, reason: "No figure task.", pdfValidation: pdfValidation || null };
    }
    if (!redrawResult || !redrawResult.model) {
      return {
        status: pdfValidation && pdfValidation.ok ? "preview-only" : "unavailable",
        engine: "",
        model: null,
        reason: "No redraw model.",
        pdfValidation: pdfValidation || null,
      };
    }
    if (pdfValidation && pdfValidation.ok && redrawResult.ok) {
      return {
        status: "validated",
        engine: redrawResult.engine,
        model: redrawResult.model,
        reason: "",
        pdfValidation: pdfValidation || null,
      };
    }
    return {
      status: "uncertain",
      engine: redrawResult.engine,
      model: redrawResult.model,
      reason: redrawResult.reason || "Uncertain redraw.",
      pdfValidation: pdfValidation || null,
    };
  }

  function buildFigureRedrawForTask({ task, pdfValidation }) {
    if (task && task.topic === "Analysis" && analysisApi && typeof analysisApi.buildAnalysisRedrawModel === "function") {
      const model = analysisApi.buildAnalysisRedrawModel(task);
      return buildFigureRedrawState({
        task,
        pdfValidation,
        redrawResult: {
          engine: "analysis",
          ok: Boolean(model && model.functionExpression),
          reason: model && model.functionExpression ? "" : "Missing function expression.",
          model,
        },
      });
    }

    if (task && task.topic === "Vektorielle Geometrie" && vectorApi && typeof vectorApi.buildVectorRedrawModel === "function") {
      const model = vectorApi.buildVectorRedrawModel(task);
      return buildFigureRedrawState({
        task,
        pdfValidation,
        redrawResult: {
          engine: "vector",
          ok: Boolean(model && model.validationHint && model.validationHint.supported),
          reason: model && model.validationHint ? model.validationHint.reason : "Insufficient geometry anchors.",
          model,
        },
      });
    }

    return buildFigureRedrawState({ task, pdfValidation, redrawResult: null });
  }

  function renderFigureRedraw(container, redrawState) {
    if (!container || !redrawState || !redrawState.model) return false;
    if (redrawState.engine === "analysis" && analysisApi && typeof analysisApi.renderAnalysisRedraw === "function") {
      return analysisApi.renderAnalysisRedraw(container, redrawState.model);
    }
    if (redrawState.engine === "vector" && vectorApi && typeof vectorApi.renderVectorRedraw === "function") {
      return vectorApi.renderVectorRedraw(container, redrawState.model);
    }
    return false;
  }

  const api = { buildFigureRedrawState, buildFigureRedrawForTask, renderFigureRedraw };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaFigureRedraw = api;
})(typeof window !== "undefined" ? window : globalThis);
