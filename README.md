# Martha Tutor 3.0

New working directory for the hardened version of Martha Tutor.

Base snapshot:

- `index.html` copied from `../v2.1/index.html`
- `style.css` copied from `../v2.1/style.css`
- `tasks.json` copied from `../tasks.json`

Planned scope:

- Google login
- protected proxy
- plotting fixes
- mobile-first task navigator

Current 3.0 structure:

- `index.html`: main app shell and runtime glue
- `style.css`: shared app styling
- `plot.js`: extracted plot detection / validation / rendering helpers
- `tasks-normalize.js`: task-block grouping and navigator hierarchy helpers
- `auth.js`: Supabase Google OAuth bootstrap
- `api.js`: authenticated proxy wrapper
- `tests/index.html`: browser-based smoke tests for the extracted helpers
- `worker/`: protected proxy worker scaffold with Supabase JWT verification

Notes:

- This branch is still in transition from the old monolithic `v2.1` structure.
- Set `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` in `index.html` before using Google login.
- The Worker expects Supabase JWTs in `Authorization: Bearer ...`.
