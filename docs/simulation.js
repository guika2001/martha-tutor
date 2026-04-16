(function (root) {
  function createSimulationRun({ taskIds, durationMinutes, startedAt, context = {} }) {
    const start = startedAt ?? Date.now();
    return {
      taskIds: [...taskIds],
      durationMinutes,
      startedAt: start,
      endsAt: start + durationMinutes * 60 * 1000,
      answers: {},
      completedTaskIds: [],
      context,
    };
  }

  function buildSimulationTaskIndexes(view) {
    if (!view || view.kind !== "block" || !Array.isArray(view.items)) return [];
    return view.items
      .map((item) => item.representativeIndex)
      .filter((value) => Number.isInteger(value));
  }

  function recordSimulationAnswer(run, taskId, answer) {
    run.answers[taskId] = answer;
    if (!run.completedTaskIds.includes(taskId)) run.completedTaskIds.push(taskId);
    return run;
  }

  function getRemainingMs(run, now = Date.now()) {
    return Math.max(0, (run && run.endsAt ? run.endsAt : 0) - now);
  }

  function formatRemainingTime(remainingMs) {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function isSimulationExpired(run, now = Date.now()) {
    return getRemainingMs(run, now) <= 0;
  }

  const api = {
    createSimulationRun,
    buildSimulationTaskIndexes,
    recordSimulationAnswer,
    getRemainingMs,
    formatRemainingTime,
    isSimulationExpired,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSimulation = api;
})(typeof window !== "undefined" ? window : globalThis);
