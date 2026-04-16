(function (root) {
  function fold(bucket, key, success) {
    if (!key) return;
    bucket[key] ||= { attempts: 0, successes: 0, successRate: 0 };
    bucket[key].attempts += 1;
    bucket[key].successes += success ? 1 : 0;
    bucket[key].successRate = bucket[key].successes / bucket[key].attempts;
  }

  function summarizeReadiness(events) {
    const summary = { topics: {}, operators: {}, toolModes: {}, examParts: {} };

    for (const event of events || []) {
      fold(summary.topics, event.topic, event.success);
      fold(summary.operators, event.operator, event.success);
      fold(summary.toolModes, event.toolMode, event.success);
      fold(summary.examParts, event.examPart, event.success);
    }

    return summary;
  }

  const api = { summarizeReadiness };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaDiagnostics = api;
})(typeof window !== "undefined" ? window : globalThis);
