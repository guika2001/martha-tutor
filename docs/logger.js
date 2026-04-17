(function (root) {
  const STORAGE_KEY = "martha_logs_v1";

  function truncateText(text, maxLength) {
    const value = String(text || "");
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  function clampStringFields(value, maxLength = 1000) {
    if (typeof value === "string") return truncateText(value, maxLength);
    if (Array.isArray(value)) return value.map((item) => clampStringFields(item, maxLength));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, clampStringFields(item, maxLength)])
      );
    }
    return value;
  }

  function buildTranscriptEvent(event, text, role, limits) {
    const maxLength = role === "assistant" ? limits.maxAssistantChars : limits.maxUserChars;
    return {
      level: "info",
      category: "chat",
      event,
      payload: {
        role,
        text: truncateText(text, maxLength),
      },
    };
  }

  function createLogger(options = {}) {
    const limits = {
      maxEvents: options.maxEvents || 300,
      maxPersistedEvents: options.maxPersistedEvents || 200,
      maxTranscriptEvents: options.maxTranscriptEvents || 30,
      maxUserChars: options.maxUserChars || 6000,
      maxAssistantChars: options.maxAssistantChars || 12000,
      maxStringChars: options.maxStringChars || 1000,
    };
    const events = [];

    function normalizeEvent(event) {
      return {
        id: event.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: event.ts || Date.now(),
        level: event.level || "info",
        category: event.category || "ui",
        event: event.event || "unknown",
        message: event.message ? truncateText(event.message, limits.maxStringChars) : "",
        sessionId: event.sessionId || "",
        chatContextKey: event.chatContextKey || "",
        taskId: event.taskId || "",
        blockId: event.blockId || "",
        lang: event.lang || "",
        mode: event.mode || "",
        payload: clampStringFields(event.payload || {}, limits.maxStringChars),
      };
    }

    function trimEvents(list) {
      const normalized = list.slice(-limits.maxEvents);
      const transcript = normalized.filter((event) => /assistant_reply|user_message/.test(event.event));
      if (transcript.length <= limits.maxTranscriptEvents) return normalized;
      const keepIds = new Set(transcript.slice(-limits.maxTranscriptEvents).map((event) => event.id));
      return normalized.filter((event) => !/assistant_reply|user_message/.test(event.event) || keepIds.has(event.id));
    }

    function persist() {
      if (typeof localStorage === "undefined") return;
      const persisted = trimEvents(events).slice(-limits.maxPersistedEvents);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          events: persisted,
        })
      );
    }

    function push(event) {
      events.push(normalizeEvent(event));
      const trimmed = trimEvents(events);
      events.length = 0;
      events.push(...trimmed);
      persist();
    }

    return {
      storageKey: STORAGE_KEY,
      getLimits() {
        return limits;
      },
      getEvents() {
        return events.slice();
      },
      clear() {
        events.length = 0;
        if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
      },
      push,
      debug(category, event, payload = {}, message = "") {
        push({ level: "debug", category, event, payload, message });
      },
      info(category, event, payload = {}) {
        push({ level: "info", category, event, payload });
      },
      warn(category, event, payload = {}, message = "") {
        push({ level: "warn", category, event, payload, message });
      },
      error(category, event, payload = {}, message = "") {
        push({ level: "error", category, event, payload, message });
      },
    };
  }

  const api = { createLogger, truncateText, buildTranscriptEvent, clampStringFields };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaLogger = api;
})(typeof window !== "undefined" ? window : globalThis);
