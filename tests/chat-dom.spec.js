/**
 * @vitest-environment jsdom
 */
const { ensureChatHosts, getChatHosts } = require("../chat-dom.js");

describe("chat dom hosts", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cms"><div class="mg a">old</div></div>';
  });

  it("rebuilds the chat container with only task and message hosts", () => {
    const cms = document.getElementById("cms");
    const { taskHost, messagesHost } = ensureChatHosts(cms, document);

    expect(taskHost.className).toBe("task-context-host");
    expect(messagesHost.className).toBe("chat-history-host");
    expect(cms.children).toHaveLength(2);
    expect(cms.textContent).toBe("");
  });

  it("creates missing hosts when old message markup polluted the container", () => {
    const cms = document.getElementById("cms");
    const { taskHost, messagesHost } = getChatHosts(cms, document);

    expect(taskHost).toBeTruthy();
    expect(messagesHost).toBeTruthy();
    expect(cms.querySelector(".mg")).toBeNull();
  });

  it("rebuilds the container when stray nodes exist outside the two hosts", () => {
    document.body.innerHTML = `
      <div id="cms">
        <div class="task-context-host"></div>
        <div class="chat-history-host"></div>
        <div class="mg a">stale message</div>
      </div>
    `;
    const cms = document.getElementById("cms");

    const { taskHost, messagesHost } = getChatHosts(cms, document);

    expect(taskHost).toBeTruthy();
    expect(messagesHost).toBeTruthy();
    expect(cms.children).toHaveLength(2);
    expect(cms.querySelector(".mg")).toBeNull();
  });
});
