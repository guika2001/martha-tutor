# Martha Proxy Worker

This Worker protects the LLM proxy behind Supabase Auth.

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

## Notes

- `ALLOWED_EMAILS` is a comma-separated allowlist and is the recommended first rollout mode
- cache JWKS via `createRemoteJWKSet`, but do not treat keys as permanently static
- GitHub Pages deployment must use the production redirect URL in Supabase Auth settings
