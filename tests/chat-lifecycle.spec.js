const {
  invalidateChatEpoch,
  createRequestToken,
  isRequestTokenCurrent,
} = require("../chat-lifecycle.js");

describe("chat lifecycle", () => {
  it("invalidates epochs monotonically", () => {
    const state = { chatEpoch: 0 };

    expect(invalidateChatEpoch(state)).toBe(1);
    expect(invalidateChatEpoch(state)).toBe(2);
  });

  it("invalidates old request tokens after a context switch", () => {
    const state = { chatEpoch: 0, chatContextKey: "block:1" };
    const token = createRequestToken(state);

    expect(isRequestTokenCurrent(state, token)).toBe(true);

    invalidateChatEpoch(state);
    state.chatContextKey = "block:2";

    expect(isRequestTokenCurrent(state, token)).toBe(false);
  });
});
