(function (root) {
  function createStorage(namespace) {
    const prefix = `${namespace}:v1:`;

    return {
      read(key, fallback = null) {
        const raw = localStorage.getItem(prefix + key);
        if (!raw) return fallback;
        try {
          return JSON.parse(raw);
        } catch (_) {
          return fallback;
        }
      },
      write(key, value) {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      remove(key) {
        localStorage.removeItem(prefix + key);
      },
    };
  }

  const api = { createStorage };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaStorage = api;
})(typeof window !== "undefined" ? window : globalThis);
