(function (root) {
  let client = null;
  let session = null;
  let callbacks = { onAuthenticated: null, onSignedOut: null };

  function logAuth(level, event, payload = {}) {
    if (root && root._marthaLogEvent) root._marthaLogEvent(level, "auth", event, payload);
  }

  function hasConfig() {
    return !!(root.CONFIG && root.CONFIG.SUPABASE_URL && root.CONFIG.SUPABASE_ANON_KEY);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setVisible(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
  }

  function renderState(kind, extra) {
    const loginBtn = document.getElementById("authLoginBtn");
    const logoutBtn = document.getElementById("authLogoutBtn");
    const authBar = document.getElementById("authBar");
    if (loginBtn) loginBtn.disabled = kind === "loading" || kind === "missing_config";
    if (logoutBtn) logoutBtn.disabled = kind === "loading";
    setVisible("authBar", kind === "authenticated");
    setVisible("authLoginWrap", kind !== "authenticated");
    if (kind === "missing_config") {
      setText("authStatus", "Supabase config hiányzik");
      setText("authHint", "Állítsd be a SUPABASE_URL és SUPABASE_ANON_KEY értékeket a CONFIG-ban.");
      if (authBar) authBar.style.display = "none";
    } else if (kind === "loading") {
      setText("authStatus", "Bejelentkezés ellenőrzése...");
      setText("authHint", "A Google session állapotának betöltése folyamatban van.");
    } else if (kind === "signed_out") {
      setText("authStatus", "Bejelentkezés szükséges");
      setText("authHint", "A feladatok és a chat használatához Google bejelentkezés kell.");
      setText("authUserEmail", "");
    } else if (kind === "authenticated") {
      setText("authStatus", "Bejelentkezve");
      setText("authHint", extra && extra.user ? extra.user.email || "" : "");
      setText("authUserEmail", extra && extra.user ? extra.user.email || "Google user" : "Google user");
    } else if (kind === "error") {
      setText("authStatus", "Bejelentkezési hiba");
      setText("authHint", extra || "Nem sikerült inicializálni az auth klienst.");
    }
  }

  function getClient() {
    if (client) return client;
    if (!hasConfig()) return null;
    if (!root.supabase || !root.supabase.createClient) return null;
    client = root.supabase.createClient(root.CONFIG.SUPABASE_URL, root.CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  }

  async function signInWithGoogle() {
    const authClient = getClient();
    if (!authClient) {
      renderState("missing_config");
      return;
    }
    renderState("loading");
    const redirectTo = root.location.origin + root.location.pathname;
    const result = await authClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (result.error) {
      logAuth("error", "auth_signin_failed", { error: result.error.message || "signin_failed" });
      renderState("error", result.error.message);
      throw result.error;
    }
    logAuth("info", "auth_signin_started", { provider: "google", redirectTo });
  }

  async function signOut() {
    const authClient = getClient();
    if (!authClient) return;
    await authClient.auth.signOut();
    session = null;
    logAuth("info", "auth_signed_out");
    renderState("signed_out");
    if (callbacks.onSignedOut) callbacks.onSignedOut();
  }

  async function getAccessToken() {
    const authClient = getClient();
    if (!authClient) return "";
    if (!session) {
      const result = await authClient.auth.getSession();
      session = result.data && result.data.session ? result.data.session : null;
    }
    return session && session.access_token ? session.access_token : "";
  }

  async function initAuth(options) {
    callbacks = Object.assign({}, callbacks, options || {});
    if (!hasConfig()) {
      logAuth("warn", "auth_missing_config");
      renderState("missing_config");
      if (callbacks.onSignedOut) callbacks.onSignedOut();
      return { ok: false, reason: "missing_config" };
    }
    const authClient = getClient();
    if (!authClient) {
      logAuth("error", "auth_client_unavailable");
      renderState("error", "Supabase script nem töltődött be.");
      if (callbacks.onSignedOut) callbacks.onSignedOut();
      return { ok: false, reason: "client_unavailable" };
    }

    renderState("loading");
    const result = await authClient.auth.getSession();
    session = result.data && result.data.session ? result.data.session : null;

    authClient.auth.onAuthStateChange((_event, nextSession) => {
      session = nextSession || null;
      logAuth("info", "auth_state_changed", {
        event: _event,
        hasSession: Boolean(session),
      });
      if (session && session.user) {
        renderState("authenticated", session);
        if (callbacks.onAuthenticated) callbacks.onAuthenticated(session);
      } else {
        renderState("signed_out");
        if (callbacks.onSignedOut) callbacks.onSignedOut();
      }
    });

    if (session && session.user) {
      logAuth("info", "auth_session_restored", {
        email: session.user.email || "",
      });
      renderState("authenticated", session);
      if (callbacks.onAuthenticated) callbacks.onAuthenticated(session);
      return { ok: true, session };
    }

    logAuth("info", "auth_signed_out_state");
    renderState("signed_out");
    if (callbacks.onSignedOut) callbacks.onSignedOut();
    return { ok: true, session: null };
  }

  root.MarthaAuth = {
    initAuth,
    signInWithGoogle,
    signOut,
    getAccessToken,
    hasConfig,
  };
})(typeof window !== "undefined" ? window : globalThis);
