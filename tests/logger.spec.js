const {
  createLogger,
  truncateText,
  buildTranscriptEvent,
} = require("../logger.js");

describe("logger ring buffer", () => {
  beforeEach(() => {
    global.localStorage = {
      data: {},
      getItem(key) { return this.data[key] || null; },
      setItem(key, value) { this.data[key] = String(value); },
      removeItem(key) { delete this.data[key]; },
    };
  });

  it("keeps only the newest bounded events", () => {
    const logger = createLogger({ maxEvents: 3, maxPersistedEvents: 2 });

    logger.info("ui", "one");
    logger.info("ui", "two");
    logger.info("ui", "three");
    logger.info("ui", "four");

    expect(logger.getEvents().map((e) => e.event)).toEqual(["two", "three", "four"]);
  });

  it("truncates transcript text fields before storing", () => {
    const logger = createLogger({ maxEvents: 5, maxUserChars: 5, maxAssistantChars: 7 });
    logger.push(buildTranscriptEvent("user_message", "123456789", "user", logger.getLimits()));
    logger.push(buildTranscriptEvent("assistant_reply", "abcdefghijk", "assistant", logger.getLimits()));

    const events = logger.getEvents();
    expect(events[0].payload.text).toBe("12345");
    expect(events[1].payload.text).toBe("abcdefg");
  });

  it("persists only the configured capped subset", () => {
    const logger = createLogger({ maxEvents: 5, maxPersistedEvents: 2 });
    logger.info("state", "a");
    logger.info("state", "b");
    logger.info("state", "c");

    const persisted = JSON.parse(localStorage.getItem("martha_logs_v1"));
    expect(persisted.events).toHaveLength(2);
    expect(persisted.events.map((e) => e.event)).toEqual(["b", "c"]);
  });
});

describe("truncateText", () => {
  it("returns empty string for empty values", () => {
    expect(truncateText("", 5)).toBe("");
  });
});
