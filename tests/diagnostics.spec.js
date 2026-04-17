const {
  buildDiagnosticsPayload,
  shouldAutoUploadDiagnostics,
  summarizeReadiness,
  uploadDiagnostics,
} = require("../diagnostics.js");

describe("diagnostics", () => {
  it("builds readiness scores by topic and operator", () => {
    const summary = summarizeReadiness([
      { topic: "Analysis", operator: "begruenden", success: false },
      { topic: "Analysis", operator: "begruenden", success: true },
      { topic: "Stochastik", operator: "bestimmen", success: false },
    ]);

    expect(summary.topics.Analysis.successRate).toBeCloseTo(0.5);
    expect(summary.operators.begruenden.attempts).toBe(2);
  });
});

describe("diagnostics payload", () => {
  it("caps total uploaded events and transcript events", () => {
    const events = Array.from({ length: 120 }, (_, idx) => ({
      event: idx % 2 ? "assistant_reply" : "ui_click",
      payload: { text: "x".repeat(50) },
      level: "info",
      category: "chat",
      ts: idx,
    }));

    const payload = buildDiagnosticsPayload(events, {
      maxUploadEvents: 100,
      maxTranscriptEvents: 20,
    });

    expect(payload.events.length).toBeLessThanOrEqual(100);
    expect(payload.events.filter((e) => /reply|message/.test(e.event))).toHaveLength(20);
  });

  it("uploads automatically only for high-value failures", () => {
    expect(shouldAutoUploadDiagnostics({ category: "plot", level: "error" })).toBe(true);
    expect(shouldAutoUploadDiagnostics({ category: "ui", level: "info" })).toBe(false);
  });
});

describe("uploadDiagnostics", () => {
  it("posts the payload as json with headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const payload = { events: [{ event: "ui_click" }] };

    await uploadDiagnostics(fetchImpl, "/diagnostics", payload, { Authorization: "Bearer x" });

    expect(fetchImpl).toHaveBeenCalledWith("/diagnostics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer x",
      },
      body: JSON.stringify(payload),
    });
  });
});
