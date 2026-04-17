import { createRemoteJWKSet, jwtVerify } from "jose";

const MAX_LOG_PAYLOAD_BYTES = 300 * 1024;
const MAX_LOG_EVENTS = 100;
const MAX_LOG_STRING_LENGTH = 4000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jwks = (env) => createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function truncateString(value, maxLength = MAX_LOG_STRING_LENGTH) {
  if (typeof value !== "string") return value;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function clampLogValue(value) {
  if (typeof value === "string") return truncateString(value);
  if (Array.isArray(value)) return value.map((item) => clampLogValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, clampLogValue(entry)]),
    );
  }
  return value;
}

function buildDiagnosticsId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `diag_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeLogPayload(payload, userPayload) {
  const events = Array.isArray(payload?.events) ? payload.events.slice(-MAX_LOG_EVENTS) : [];
  return {
    diagnosticsId: buildDiagnosticsId(),
    createdAt: truncateString(String(payload?.createdAt || new Date().toISOString()), 64),
    appVersion: truncateString(String(payload?.appVersion || "unknown"), 128),
    diagnosticsKind: truncateString(String(payload?.diagnosticsKind || "manual"), 64),
    eventCount: events.length,
    session: {
      sub: truncateString(String(userPayload?.sub || ""), 128),
      email: truncateString(String(userPayload?.email || ""), 320),
    },
    events: events.map((event) => clampLogValue(event)),
  };
}

async function handleLogs(request, env, userPayload) {
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = Number.parseInt(contentLengthHeader || "", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_LOG_PAYLOAD_BYTES) {
    return json({ error: "payload_too_large", maxBytes: MAX_LOG_PAYLOAD_BYTES }, 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_LOG_PAYLOAD_BYTES) {
    return json({ error: "payload_too_large", maxBytes: MAX_LOG_PAYLOAD_BYTES }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_error) {
    return json({ error: "invalid_json" }, 400);
  }

  const envelope = sanitizeLogPayload(payload, userPayload);

  console.log(
    JSON.stringify({
      type: "martha_diagnostics",
      diagnosticsId: envelope.diagnosticsId,
      appVersion: envelope.appVersion,
      diagnosticsKind: envelope.diagnosticsKind,
      eventCount: envelope.eventCount,
      session: envelope.session,
      events: envelope.events,
    }),
  );

  return json({
    ok: true,
    diagnosticsId: envelope.diagnosticsId,
    received: envelope.eventCount,
  });
}

async function verifyUser(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return { error: json({ error: "unauthorized" }, 401) };
  const token = auth.slice("Bearer ".length);
  try {
    const { payload } = await jwtVerify(token, jwks(env), {
      issuer: env.SUPABASE_URL + "/auth/v1",
      audience: env.SUPABASE_AUDIENCE || "authenticated",
    });
    const allowed = String(env.ALLOWED_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length) {
      const email = String(payload.email || "").toLowerCase();
      if (!allowed.includes(email)) return { error: json({ error: "forbidden" }, 403) };
    }
    return { payload };
  } catch (_error) {
    return { error: json({ error: "unauthorized" }, 401) };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const verified = await verifyUser(request, env);
    if (verified.error) return verified.error;

    if (url.pathname === "/logs") {
      return handleLogs(request, env, verified.payload);
    }

    const upstream = await fetch(env.GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + env.GROQ_API_KEY,
      },
      body: await request.text(),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        ...corsHeaders,
      },
    });
  },
};
