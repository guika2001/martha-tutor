const {
  buildChatHistoryKey,
  buildTaskRenderKey,
  createChatContextKey,
} = require("../chat-context.js");

describe("chat context isolation", () => {
  it("namespaces history keys by chat context", () => {
    expect(buildChatHistoryKey({ chatContextKey: "forecast:1", selectedBlockId: "GK::A", selectedIdx: 3 }))
      .toBe("forecast:1::GK::A");
    expect(buildChatHistoryKey({ chatContextKey: "simulation:2", selectedBlockId: "", selectedIdx: 3 }))
      .toBe("simulation:2::3");
  });

  it("builds task render keys that change with chat context", () => {
    const base = buildTaskRenderKey({
      chatContextKey: "base",
      selectedBlockId: "block-1",
      taskId: "Aufgabe",
      taskIndex: 4,
      lang: "de",
      questionSource: "a)\nQ1",
    });
    const simulation = buildTaskRenderKey({
      chatContextKey: "simulation:99",
      selectedBlockId: "block-1",
      taskId: "Aufgabe",
      taskIndex: 4,
      lang: "de",
      questionSource: "a)\nQ1",
    });
    expect(simulation).not.toBe(base);
  });

  it("creates deterministic prefixed chat context ids", () => {
    expect(createChatContextKey("forecast", 123)).toBe("forecast:123");
  });
});
