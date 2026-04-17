(function (root) {
  function invalidateChatEpoch(state) {
    if (!state) return 0;
    const next = Number(state.chatEpoch || 0) + 1;
    state.chatEpoch = next;
    return next;
  }

  function createRequestToken(state) {
    return {
      epoch: Number((state && state.chatEpoch) || 0),
      contextKey: String((state && state.chatContextKey) || "base"),
    };
  }

  function isRequestTokenCurrent(state, token) {
    if (!state || !token) return false;
    return Number(state.chatEpoch || 0) === Number(token.epoch || 0)
      && String(state.chatContextKey || "base") === String(token.contextKey || "base");
  }

  const api = {
    invalidateChatEpoch,
    createRequestToken,
    isRequestTokenCurrent,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaChatLifecycle = api;
})(typeof window !== "undefined" ? window : globalThis);
