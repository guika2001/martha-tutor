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

  function buildDiagnosticsPayload(events, limits = {}) {
    const maxUploadEvents = limits.maxUploadEvents || 100;
    const maxTranscriptEvents = limits.maxTranscriptEvents || 20;
    const transcript = (events || []).filter((e) => /assistant_reply|user_message/.test(e.event)).slice(-maxTranscriptEvents);
    const nonTranscript = (events || []).filter((e) => !/assistant_reply|user_message/.test(e.event));
    const trimmed = [...nonTranscript, ...transcript].slice(-maxUploadEvents);
    return {
      createdAt: Date.now(),
      appVersion: limits.appVersion || "martha-4.0",
      diagnosticsKind: limits.diagnosticsKind || "manual",
      events: trimmed,
    };
  }

  function shouldAutoUploadDiagnostics(event) {
    return event && event.level === "error" && ["plot", "pdf", "api", "chat"].includes(event.category);
  }

  async function uploadDiagnostics(fetchImpl, url, payload, headers = {}) {
    return fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
  }

  function createDiagnosticsUrl(apiUrl) {
    return String(apiUrl || "").replace(/\/+$/, "") + "/logs";
  }

  const api = { buildDiagnosticsPayload, shouldAutoUploadDiagnostics, summarizeReadiness, uploadDiagnostics, createDiagnosticsUrl };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaDiagnostics = api;
})(typeof window !== "undefined" ? window : globalThis);
