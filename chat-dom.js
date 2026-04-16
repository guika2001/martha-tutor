(function (root) {
  function ensureChatHosts(container, doc) {
    if (!container) return { taskHost: null, messagesHost: null };
    const owner = doc || container.ownerDocument;
    container.innerHTML = "";
    const taskHost = owner.createElement("div");
    taskHost.className = "task-context-host";
    const messagesHost = owner.createElement("div");
    messagesHost.className = "chat-history-host";
    container.appendChild(taskHost);
    container.appendChild(messagesHost);
    return { taskHost, messagesHost };
  }

  function getChatHosts(container, doc) {
    if (!container) return { taskHost: null, messagesHost: null };
    let taskHost = container.querySelector(".task-context-host");
    let messagesHost = container.querySelector(".chat-history-host");
    if (!taskHost || !messagesHost) {
      return ensureChatHosts(container, doc);
    }
    return { taskHost, messagesHost };
  }

  const api = { ensureChatHosts, getChatHosts };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaChatDom = api;
})(typeof window !== "undefined" ? window : globalThis);
