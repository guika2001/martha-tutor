(function (root) {
  async function authorizedFetch(url, init = {}) {
    const token = root.MarthaAuth ? await root.MarthaAuth.getAccessToken() : "";
    if (!token) throw new Error("Authentication required.");
    const startedAt = Date.now();
    const requestUrl = url || root.CONFIG.API_URL;
    const method = init.method || "POST";
    if (root._marthaLogEvent) {
      root._marthaLogEvent("info", "api", "request_start", {
        url: requestUrl,
        method,
      });
    }
    try {
      const resp = await fetch(requestUrl, {
      ...init,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        ...(init.headers || {}),
      },
      body: init.body,
    });
      if (root._marthaLogEvent) {
        root._marthaLogEvent(resp.ok ? "info" : "error", "api", resp.ok ? "request_success" : "request_failure", {
          url: requestUrl,
          method,
          status: resp.status,
          durationMs: Date.now() - startedAt,
        });
      }
      return resp;
    } catch (error) {
      if (root._marthaLogEvent) {
        root._marthaLogEvent("error", "api", "request_exception", {
          url: requestUrl,
          method,
          durationMs: Date.now() - startedAt,
          error: String(error && error.message || error),
        });
      }
      throw error;
    }
  }

  async function authorizedProxyFetch(payload) {
    return authorizedFetch(root.CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  root.MarthaApi = {
    authorizedFetch,
    authorizedProxyFetch,
  };
})(typeof window !== "undefined" ? window : globalThis);
