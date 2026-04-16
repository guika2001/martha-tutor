# Martha Tutor 4.0

Working directory for Martha 4.0, the NRW Mathematik-Abitur prep app.

Base snapshot:

- `index.html` copied from `../v2.1/index.html`
- `style.css` copied from `../v2.1/style.css`
- `tasks.json` copied from `../tasks.json`

Planned scope:

- Google login
- protected proxy
- plotting fixes
- mobile-first task navigator

Current 4.0 structure:

- `index.html`: main app shell and runtime glue
- `style.css`: shared app styling
- `plot.js`: extracted plot detection / validation / rendering helpers
- `tasks-normalize.js`: task-block grouping and navigator hierarchy helpers
- `auth.js`: Supabase Google OAuth bootstrap
- `api.js`: authenticated proxy wrapper
- `ui-helpers.js`: user-visible task meta and notice helpers
- `tests/index.html`: browser-based smoke tests for the extracted helpers
- `worker/`: protected proxy worker scaffold with Supabase JWT verification

Testing:

- `npm run test:unit`: node-based unit tests for pure modules
- `npm run test:dom`: jsdom-based DOM tests with Testing Library
- `npm run test:coverage`: coverage run with thresholds and HTML report
- `npm run test:e2e:smoke`: Playwright Chromium smoke test against a local static server
- `npm test`: fast local gate for unit + DOM

Notes:

- This branch is still in transition from the old monolithic `v2.1` structure.
- Set `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` in `index.html` before using Google login.
- The Worker expects Supabase JWTs in `Authorization: Bearer ...`.
