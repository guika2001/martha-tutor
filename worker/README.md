# Martha Proxy Worker

This Worker protects the LLM proxy behind Supabase Auth.

It also accepts bounded diagnostics uploads from the client on `POST /logs`.

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_JWKS_URL`
- `SUPABASE_AUDIENCE`
- `ALLOWED_EMAILS`
- `GROQ_API_KEY`
- `GROQ_API_URL`

## Security Contract

- frontend authenticates with Supabase Google OAuth
- frontend sends `Authorization: Bearer <access_token>`
- worker verifies the JWT against Supabase JWKS
- worker rejects unauthenticated traffic with `401`
- worker rejects unauthorized users with `403`
- worker can restrict access with `ALLOWED_EMAILS`

## Routes

- `POST /`
  forwards LLM chat payloads to the upstream Groq endpoint
- `POST /logs`
  accepts authenticated diagnostics payloads and writes a bounded JSON envelope to Worker logs

## Diagnostics Logging Contract

- `POST /logs` requires the same Bearer token as the chat proxy
- request body must be valid JSON
- payload size is capped at `300 KiB`
- only the last `100` events are retained per upload
- string fields are truncated server-side to keep payloads bounded
- the worker returns:
  - `ok`
  - `diagnosticsId`
  - `received`

### Operational Notes

- diagnostics are written to the Worker console via structured `console.log`, not permanent storage
- use Wrangler or Cloudflare dashboard logs for troubleshooting
- this endpoint is intended for capped troubleshooting bundles, not high-volume telemetry streaming

## Notes

- `ALLOWED_EMAILS` is a comma-separated allowlist and is the recommended first rollout mode
- cache JWKS via `createRemoteJWKSet`, but do not treat keys as permanently static
- GitHub Pages deployment must use the production redirect URL in Supabase Auth settings
