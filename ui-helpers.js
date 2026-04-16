(function (root) {
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
    const question = String((task && task.question) || "").toLowerCase();

    if (typeof buildToolModeHint === "function") {
      const hint = buildToolModeHint(task ? task.toolMode : null);
      if (hint && hint.message) {
        notices.push({ kind: "tool", icon: "🧮", message: hint.message });
      }
    }

    if (task && task.figureRequired) {
      notices.push({
        kind: "figure",
        icon: "⚠️",
        message: `${task.figureLabel || "Abbildung"} erforderlich. ${task.figureStatus === "missing" ? "PDF-Abbildung fehlt." : "Grafik im Original sorgfältig mitprüfen."}`,
      });
    }

    return notices;
  }

  function renderTaskNoticeMessages(container, notices) {
    container.innerHTML = "";
    notices.forEach((notice) => {
      const element = container.ownerDocument.createElement("div");
      element.className = "abw";
      element.textContent = `${notice.icon} ${notice.message}`;
      container.appendChild(element);
    });
    return container;
  }

  const api = {
    buildTaskMetaBits,
    buildTaskNoticeMessages,
    renderTaskNoticeMessages,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaUiHelpers = api;
})(typeof window !== "undefined" ? window : globalThis);
