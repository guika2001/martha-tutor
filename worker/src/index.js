import { createRemoteJWKSet, jwtVerify } from "jose";

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
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const verified = await verifyUser(request, env);
    if (verified.error) return verified.error;

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
