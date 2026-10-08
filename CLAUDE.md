# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SkolarTrack — a full-stack scholarship tracker for Filipino students. Admins (school coordinators) post scholarship listings; students browse, save, and track their application status through a personal pipeline (Interested → Applied → Interview → Result).

## Tech Stack

- **Frontend**: React + Vite (`client/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: PostgreSQL on Neon.tech (hosted, no local install)
- **Auth**: JWT + bcrypt, role-based access control (RBAC)
- **Deploy**: Render (backend) + Vercel (frontend)

## Development Commands

```bash
# Server
cd server && npm run dev     # nodemon index.js
cd server && npm start       # node index.js
cd server && npm test        # node --test — full API suite
cd server && npm run create-admin -- <email> <password> [name]

# Client
cd client && npm run dev     # vite
cd client && npm run build   # vite build
cd client && npm run lint    # eslint — must stay at 0 problems
cd client && npm test        # node --test — unit tests for src/utils and src/services/auth.js
```

### Tests

- **Server** (`server/test/`): `node:test` + `supertest` against the real Express app. `test/helpers/testApp.js` swaps `pool.query` for an in-memory Postgres (PGlite) loaded from `db/schema.sql`, so tests run the real SQL and constraints and can never reach Neon. Run one file with `node --test test/auth.test.js`.
- **Client** (`client/test/`): `node:test` on pure modules only (no DOM, no React). Anything that needs a browser is checked by hand.
- Write the failing test first when changing server behavior or a client util.

## Architecture

### Backend (MVC)

```
server/
  index.js          ← Entry point only — calls app.listen()
  src/
    app.js          ← Express setup: middleware, route mounting (no listen here)
    config/env.js   ← The ONLY place process.env is read; validates required vars at boot
    config/db.js    ← The single pg Pool
    routes/         ← HTTP verb + path mapping only, delegates to controllers
    controllers/    ← Request/response logic, calls models
    models/         ← All SQL queries live here, nothing else
    middleware/     ← auth, roles, rateLimit, validateId, errorHandler
    utils/validation.js ← Pure input validators; each returns { error } or { value }
```

**Pattern**: `routes/` only maps paths → `controllers/` handles req/res → `models/` runs SQL. Never write SQL in controllers. Never write req/res logic in models.

**Validation**: a controller's first step on any write is `const { error, value } = validateX(req.body)`; pass `value` (trimmed, blanks → `null`) to the model, never raw `req.body`. `router.param("id", validateIdParam)` rejects non-numeric ids with `400` before they reach SQL.

**Errors**: every error response is `{ error: "message" }` JSON. `notFound` and `errorHandler` are mounted last in `app.js`.

### Frontend

```
client/src/
  App.jsx           ← React Router setup, all routes defined here
  main.jsx          ← ReactDOM.render entry point
  pages/            ← One file per route (Login, Register, Scholarships, etc.)
  components/       ← Reusable UI pieces (styles.js holds shared Tailwind class strings)
  context/          ← AuthContext.jsx (AuthProvider) + useAuth.js (the hook)
  hooks/useApi.js   ← Load-on-mount hook: { data, error, isLoading, retry, setData }
  utils/            ← Pure helpers: dates, format, scholarships (filter/sort), stages, personalEntry (form conversions)
  services/api.js   ← ALL API calls go here — never inline fetch() in components
  services/auth.js  ← Token storage + decoding (the only code that touches localStorage)
```

- Load data with `useApi(path)`, not a hand-written `useEffect` + `fetch` — calling `setState` synchronously inside an effect fails the `react-hooks/set-state-in-effect` lint rule.
- Read auth with `useAuth()` (`token`, `role`, `userId`, `sessionExpired`, `login`, `logout`). Never read `localStorage` in a component.
- Deadlines are `"YYYY-MM-DD"` strings end to end. Use `utils/dates.js`; `new Date("2026-12-31")` is midnight **UTC** and shifts the day in Manila.
- Design tokens live in `client/design-tokens.md` and the `@theme` block of `src/index.css`.

### Auth Flow

- JWT issued on login/register, stored in `localStorage` on the client
- Every protected request sends `Authorization: Bearer <token>`
- `middleware/auth.js` verifies the token
- `middleware/roles.js` checks `req.user.role` — admin routes reject student tokens with 401
- On the client, `apiFetch` treats a `401` on a request that carried a token as "session over": it calls the handler `AuthContext` registered, which clears the token, and `ProtectedRoute` redirects to `/login`. Because a wrong-role request is also a `401`, a page must never call an endpoint its role can't use (see `ScholarshipDetail` passing `null` to `useApi` for non-students).
- Logging out goes through the `/logout` route (`pages/Logout.jsx`), not a direct `logout()` call from a protected page.

### Database (3 tables)

- `users` — both roles, `role` column is `'admin'` or `'student'`
- `scholarships` — created by admins, soft-deleted by setting `status: 'closed'` (never hard delete)
- `applications` — student's tracker entries, `status` is `'interested'|'applied'|'interview'|'result'`. An entry is either a saved listing (`scholarship_id` set) or a **personal** one the student added themselves (`scholarship_id` is `NULL`, details in the `personal_*` columns); a `CHECK` forbids mixing the two

## Environment Variables

Copy `server/.env.example` → `server/.env` and fill in real values. Required vars:

- `DATABASE_URL` — Neon.tech connection string
- `JWT_SECRET` — any strong random string (at least 32 characters when `NODE_ENV=production`)
- `CORS_ORIGINS` — comma-separated frontend origins allowed to call the API
- `PORT` — defaults to 3000
- `JWT_EXPIRES_IN` — defaults to `7d`
- `AUTH_RATE_LIMIT_MAX` (optional, default 30) and `TRUST_PROXY` (optional, default 1)

The client needs none. `VITE_API_URL` (in `client/.env.local`) optionally overrides the API base URL; if the production API URL ever changes, update it in `client/src/services/api.js` **and** in the `connect-src` of the Content-Security-Policy in `client/vercel.json`.

## Key Constraints

- Ownership is enforced in the SQL `WHERE` clause using the id from the verified token (`posted_by = $n` for scholarships, `student_id = $n` for applications). "Not found" and "not yours" both return the same `404`.
- Never return `applications.notes` to admins — they are the student's private notes.
- Registration never reads `role` from the request; admins are created only by `scripts/createAdmin.js`.
- No schema changes without a migration plan: `db/schema.sql` must match what is live on Neon. The `ALTER` statements go in `server/db/migrations/` and are run on Neon before the code that needs them.
- Personal tracker entries are private to the student who added them: they never go in `scholarships`, and no admin query may return them.
- Soft delete only — never `DELETE FROM scholarships`. Set `status = 'closed'`.
- All API calls go through `client/src/services/api.js`, not inline in components.
- `server/index.js` is the only file that calls `app.listen()`.
- Admin routes must return `401` for non-admin JWT tokens.
- Passwords must be hashed with bcrypt — never stored plain.
