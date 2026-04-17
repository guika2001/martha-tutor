(function (root) {
  function truncateText(text, maxLength) {
    const value = String(text || "");
    return value.length > maxLength ? value.slice(0, maxLength) : value;
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
      maxUserChars: options.maxUserChars || 6000,
      maxAssistantChars: options.maxAssistantChars || 12000,
    };
    const events = [];

    function persist() {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(
        "martha_logs_v1",
        JSON.stringify({
          events: events.slice(-limits.maxPersistedEvents),
        })
      );
    }

    function push(event) {
      events.push({ ts: Date.now(), ...event });
      while (events.length > limits.maxEvents) {
        events.shift();
      }
      persist();
    }

    return {
      getLimits() {
        return limits;
      },
      getEvents() {
        return events.slice();
      },
      push,
      info(category, event, payload = {}) {
        push({ level: "info", category, event, payload });
      },
    };
  }

  const api = { createLogger, truncateText, buildTranscriptEvent };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaLogger = api;
})(typeof window !== "undefined" ? window : globalThis);
