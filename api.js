(function (root) {
  async function authorizedProxyFetch(payload) {
    const token = root.MarthaAuth ? await root.MarthaAuth.getAccessToken() : "";
    if (!token) throw new Error("Authentication required.");
    const resp = await fetch(root.CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });
    return resp;
  }

  root.MarthaApi = {
    authorizedProxyFetch,
  };
})(typeof window !== "undefined" ? window : globalThis);
