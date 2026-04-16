(function (root) {
  function buildChatHistoryKey({ chatContextKey, selectedBlockId, selectedIdx, useBlockScope }) {
    const baseKey = useBlockScope ? (selectedBlockId || String(selectedIdx)) : String(selectedIdx);
    return [chatContextKey || "base", baseKey].join("::");
  }

  function buildTaskRenderKey({ chatContextKey, selectedBlockId, taskId, taskIndex, lang, questionSource, useBlockScope }) {
    return [
      chatContextKey || "base",
      useBlockScope ? (selectedBlockId || taskId || taskIndex) : (taskId || taskIndex),
      lang || "de",
      questionSource || "",
    ].join("::");
  }

  function createChatContextKey(prefix, seed) {
    return [prefix || "base", String(seed || Date.now())].join(":");
  }

  const api = {
    buildChatHistoryKey,
    buildTaskRenderKey,
    createChatContextKey,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaChatContext = api;
})(typeof window !== "undefined" ? window : globalThis);
