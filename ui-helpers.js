(function (root) {
  const figureSourceApi = typeof module !== "undefined" && module.exports
    ? require("./figure-source.js")
    : root && root.MarthaFigureSources
      ? root.MarthaFigureSources
      : null;
  const figureRedrawApi = typeof module !== "undefined" && module.exports
    ? require("./figure-redraw.js")
    : root && root.MarthaFigureRedraw
      ? root.MarthaFigureRedraw
      : null;

  function buildTaskMetaBits(task) {
    const source = (task && task.source) || {};
    const bits = [
      task && task.topic,
      source.level,
      source.year,
      task && task.examPart,
      task && task.taskType,
      task && task.toolType,
    ].filter(Boolean);

    if (task && task.primaryOperator) bits.push("Operator: " + task.primaryOperator);
    if (task && task.toolMode) bits.push("Werkzeugmodus: " + task.toolMode);
    if (task && task.figureRequired) bits.push((task.figureLabel || "Abbildung") + " erforderlich");
    if (task && task.figureRequired && task.figureStatus === "missing") bits.push("PDF-Abbildung fehlt");

    return bits;
  }

  function buildTaskNoticeMessages(task, dependencies = {}) {
    const notices = [];
    const buildToolModeHint = dependencies.buildToolModeHint;
    const sources = figureSourceApi && typeof figureSourceApi.resolveFigurePdfSources === "function"
      ? figureSourceApi.resolveFigurePdfSources(task)
      : [];

    if (typeof buildToolModeHint === "function") {
      const hint = buildToolModeHint(task ? task.toolMode : null);
      if (hint && hint.message) {
        notices.push({ kind: "tool", icon: "🧮", message: hint.message });
      }
    }

    if (task && task.figureRequired) {
      let figureMessage = "Originalabbildung in der Quelle öffnen.";
      if (!sources.length && task.figureStatus === "missing") figureMessage = "PDF-Abbildung fehlt.";
      else if (!sources.length) figureMessage = "Keine passende PDF-Quelle validiert.";
      notices.push({
        kind: "figure",
        icon: "⚠️",
        message: `${task.figureLabel || "Abbildung"} erforderlich. ${figureMessage}`,
        sources,
      });
    }

    return notices;
  }

  function createNoticeElement(doc, notice) {
    const element = doc.createElement("div");
    element.className = "abw";
    const text = doc.createElement("span");
    text.textContent = `${notice.icon} ${notice.message}`;
    element.appendChild(text);
    if (notice.sources && notice.sources.length) {
      const links = doc.createElement("div");
      links.className = "notice-links";
      notice.sources.forEach((source) => {
        const anchor = doc.createElement("a");
        anchor.className = "notice-link";
        anchor.href = source.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = source.label;
        links.appendChild(anchor);
      });
      element.appendChild(links);
    }
    return element;
  }

  function renderTaskNoticeMessages(container, notices) {
    container.innerHTML = "";
    notices.forEach((notice) => {
      container.appendChild(createNoticeElement(container.ownerDocument, notice));
    });
    return container;
  }

  function createFigurePanel(doc, task) {
    if (!task || !task.figureRequired || !figureSourceApi || typeof figureSourceApi.resolveFigurePdfSources !== "function") return null;
    const sources = figureSourceApi.resolveFigurePdfSources(task);
    if (!sources.length) return null;

    const panel = doc.createElement("section");
    panel.className = "pdf-panel";

    const header = doc.createElement("div");
    header.className = "pdf-panel-head";
    header.innerHTML = `<strong>${task.figureLabel || "Abbildung"}</strong><span>PDF-Quelle wird validiert …</span>`;
    panel.appendChild(header);

    const linkRow = doc.createElement("div");
    linkRow.className = "pdf-panel-links";
    sources.forEach((source, index) => {
      const anchor = doc.createElement("a");
      anchor.className = "pdf-chip";
      anchor.href = source.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = source.label;
      if (index === 0) anchor.dataset.primary = "true";
      linkRow.appendChild(anchor);
    });
    panel.appendChild(linkRow);

    const preview = doc.createElement("div");
    preview.className = "pdf-preview";
    panel.appendChild(preview);

    const redraw = doc.createElement("div");
    redraw.className = "pdf-redraw";
    panel.appendChild(redraw);

    const redrawBadge = doc.createElement("div");
    redrawBadge.className = "pdf-validation-badge status-" + ((task.redrawState && task.redrawState.status) || "preview-only");
    redrawBadge.textContent = task.redrawState && task.redrawState.status === "validated"
      ? "Redraw validiert"
      : task.redrawState && task.redrawState.status === "uncertain"
        ? "Redraw unsicher"
        : task.redrawState && task.redrawState.status === "unavailable"
          ? "Keine sichere Darstellung verfügbar"
          : "Nur PDF-Vorschau";
    panel.appendChild(redrawBadge);

    panel._task = task;
    panel._sources = sources;
    panel._redrawHost = redraw;
    panel._redrawBadge = redrawBadge;
    return panel;
  }

  async function hydrateFigurePanel(panel) {
    if (!panel || !root || !root.MarthaPdfFigure || typeof root.MarthaPdfFigure.renderFigurePreview !== "function") return;
    if (panel.dataset.hydrated === "true") return;
    panel.dataset.hydrated = "true";
    const preview = panel.querySelector(".pdf-preview");
    try {
      const pdfValidation = await root.MarthaPdfFigure.renderFigurePreview(preview, {
        task: panel._task,
        sources: panel._sources,
      });
      const statusText = preview.dataset.status || "PDF-Quelle bereit.";
      const headStatus = panel.querySelector(".pdf-panel-head span");
      if (headStatus) headStatus.textContent = statusText;
      if (figureRedrawApi && typeof figureRedrawApi.buildFigureRedrawForTask === "function" && panel._redrawHost) {
        const redrawState = figureRedrawApi.buildFigureRedrawForTask({
          task: panel._task,
          pdfValidation,
        });
        panel._task.redrawState = redrawState;
        if (panel._redrawBadge) {
          panel._redrawBadge.className = "pdf-validation-badge status-" + redrawState.status;
          panel._redrawBadge.textContent = redrawState.status === "validated"
            ? "Redraw validiert"
            : redrawState.status === "uncertain"
              ? "Redraw unsicher"
              : redrawState.status === "unavailable"
                ? "Keine sichere Darstellung verfügbar"
                : "Nur PDF-Vorschau";
        }
        if (redrawState.status === "validated" && typeof figureRedrawApi.renderFigureRedraw === "function") {
          const rendered = figureRedrawApi.renderFigureRedraw(panel._redrawHost, redrawState);
          if (!rendered) {
            panel._redrawHost.innerHTML = '<div class="pdf-preview-status">Für diese Aufgabe ist aktuell kein sicheres Redraw verfügbar.</div>';
          }
        } else if (panel._redrawHost) {
          panel._redrawHost.innerHTML = '<div class="pdf-preview-status">Für diese Aufgabe wird bewusst nur die validierte PDF-Vorschau gezeigt.</div>';
        }
      }
    } catch (_) {
      const headStatus = panel.querySelector(".pdf-panel-head span");
      if (headStatus) headStatus.textContent = "PDF-Vorschau konnte nicht geladen werden.";
    }
  }

  const api = {
    buildTaskMetaBits,
    buildTaskNoticeMessages,
    createNoticeElement,
    renderTaskNoticeMessages,
    createFigurePanel,
    hydrateFigurePanel,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaUiHelpers = api;
})(typeof window !== "undefined" ? window : globalThis);
