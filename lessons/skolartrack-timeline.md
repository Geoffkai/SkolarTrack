# SkolarTrack — Full Build Timeline

*A no-dates, phase-by-phase history of how this project came together, for context in future sessions.*

---

## 1. The "Big 3" decision

The starting point was bigger than SkolarTrack itself. Research into what employers actually look for led to three portfolio projects identified as necessary to be job-ready. SkolarTrack is **Project 1: Full Stack CRUD App**.

Coming in with Java, SQL, and HTML/CSS/JS from coursework, but no experience shipping a real, *deployed* web app — a prior "Dorm System" project only ever ran against a local database, which doesn't count as production-ready. That gap is exactly what this project was designed to close.

The stack was chosen deliberately, based on actual market research, not comfort:
- **Backend:** Node.js + Express
- **Frontend:** React
- **Database:** PostgreSQL via Neon
- **Auth:** JWT
- **Deploy (planned):** Railway (backend), Vercel (frontend)

A conscious decision was made *not* to fall back on a Java backend just because it was the familiar option — the market signal pointed at Node.js, so that's what got learned.

---

## 2. Dev tooling setup

Before any application code got written:
- Node.js, npm
- Git + GitHub — treated explicitly as two different things: Git is the tool, GitHub is the website it talks to
- VS Code + Prettier, with format-on-save wired up project-wide from a root-level config
- Thunder Client, for testing API routes before any frontend existed to call them

**Claude Code was deliberately set aside for this project.** The explicit goal was understanding every line written, not delegating code generation — that tool was earmarked for Project 2 or later.

---

## 3. "How senior engineers start a project"

A planning lesson before touching code. The core idea: seniors build in **dependency order**, not visible-feature order —

1. Database schema (everything else depends on the shape of the data)
2. Project skeleton + environment
3. Server + DB connection, proven via a `/health` check
4. Auth (every protected route needs to know who's asking)
5. Backend features, fully tested in Thunder Client
6. React frontend, built on routes already proven to work
7. Deploy — early and often, not saved for the end

The explicit contrast drawn: a junior builds the UI first, discovers it has nowhere to send data, and has to throw it away and rebuild. This project committed to the senior order from day one — which is exactly why the backend was fully built and tested for eight-plus days before a single React file existed.

**Also established here:** commit at every working state, not just when a feature feels "done." A working state that isn't committed is a working state that can be lost.

---

## 4. Database schema design

Worked through normalization theory as a direct transfer from CMSC 127 coursework:
- **1NF** — atomic values, no repeating groups in a column
- **2NF** — no partial dependency on part of a composite key (a single `SERIAL PRIMARY KEY` satisfies this automatically)
- **3NF** — no transitive dependencies between non-key columns

**3NF was chosen as the right stopping point** for a project this size — deliberately not over-normalizing (e.g., not splitting `organization` into its own table before there was any real need to).

Constraint concepts learned and applied:
- `DEFAULT` (fills in a value when one is omitted) vs. `NOT NULL` (forbids omission entirely) — different jobs, often paired together (`created_at TIMESTAMP NOT NULL DEFAULT NOW()`)
- Composite `UNIQUE (student_id, scholarship_id)` — stops a student from bookmarking the same scholarship twice, enforced at the database level
- Hardening foreign keys and role columns with `NOT NULL` early, while tables are still empty and the change is free — a `NULL` role would break RBAC later

The final schema was saved to `server/db/schema.sql` and committed to the repo — a lightweight stand-in for real migration tooling (Flyway, node-pg-migrate) that a bigger project would use instead.

---

## 5. Neon setup

Understood Neon as **serverless, cloud-hosted PostgreSQL** — no local database install required, a generous free tier, and genuinely relevant features for a student (database branching, in particular). Learned the practical differences from the MySQL taught in CMSC 127: no `CREATE DATABASE` needed (Neon already provisions one per project), no `USE` statement (that's MySQL-only), and underscores instead of hyphens in unquoted identifiers.

---

## 6. The `pg` library and connection pooling

Learned what `pg` actually is — a **library/driver**, not a web-facing "API" in the sense the project would later build one — and what a **Pool** is: a set of database connections opened once and reused across requests, instead of opening and closing a fresh connection every single time. Built `db.js` around `process.env` (reading the connection string safely) and `module.exports`.

---

## 7. Express fundamentals

What Express actually is, the `app.js`/`index.js` split, middleware and `app.use()`, HTTP verbs and what a route really represents — then password hashing with `bcrypt` (salt, cost factor) as the first real security concept put into practice.

---

## 8. JWT and the full auth vertical slice

This is where JWT genuinely clicked conceptually, via the stamp/wristband analogy, before any code was written. Built:
- The `users` model
- The `register` controller, with bcrypt hashing

Hit a real debugging chain along the way: an `express.json()` ordering issue, a `text/plain` vs. `application/json` mistake in Thunder Client, a missing `await` on `bcrypt.hash`, a missing `jwt` import, and a `res.json(500)` vs. `res.status(500)` typo.

Then built `login`, plus both auth middleware files:
- `verifyToken` — identity (is this a real, valid token?)
- `requireAdmin` — role (is this specific user allowed here?)

Proved RBAC live in Thunder Client: a student token got `401` on an admin-only route; an admin token passed through. A custom quiz widget confirmed the two-phase **BUILD vs. WALK** request lifecycle model (startup wiring vs. per-request handling) had genuinely landed, not just been read and nodded along to.

---

## 9. Scholarship CRUD and Application CRUD — two full vertical slices

Each built in the same order: model → controller → routes → mounted in `app.js`.

**Real bugs hit and fixed along the way:** missing `RETURNING *`, missing `return` statements on model functions, a `result.row` vs. `result.rows` typo, incorrectly destructuring `req.params.id`, missing `await`s on async model calls, wrong HTTP verbs, dead imports left behind, and a missing `return` before a `404` causing a double-response crash.

**Concepts that landed here:** `req.params` and why identifiers ride in the URL rather than the body for `GET`, the full REST reasoning chain (resources-as-URLs + verbs-as-actions, statelessness), the distinction between resource paths and action paths, route-ordering rules (literal paths before variable ones), and the split between global and targeted middleware.

**A real security gap, found independently, not handed over:** `applicationRoutes.js` initially only had `verifyToken`, which meant an admin's valid token could hit student-only write routes (like bookmarking a scholarship) with nothing stopping them. This led directly to building `requireStudent` — RBAC's missing mirror image, proving that role guards can point in either direction, not just "block non-admins."

**A second gap, also found through questioning rather than told upfront:** a missing field on a `PUT` request would silently become SQL `NULL` (a `pg` driver behavior), which bypassed the table's own `CHECK` constraint entirely, since Postgres treats a `NULL` comparison as passing, not failing. Fixed by requiring the full body on `PUT` routes — consistent with the full-replacement convention already chosen for scholarships — with `COALESCE` explicitly parked as the correct tool for a real future `PATCH` route, not used prematurely here.

---

## 10. Admin "view applicants" feature

The first JOIN query in the project — stitching `applications` and `users` together so an admin sees a real name and email instead of a bare `student_id`. Introduced **nested resource routing** (`/scholarships/:id/applications`, rather than a query-param filter), and expressed ownership as a `WHERE scholarships.posted_by = $2` filter in the SQL itself — collapsing three different outward cases (a scholarship with zero applicants, a scholarship owned by a different admin, and a scholarship id that doesn't exist at all) into one identical, deliberately vague `200 + []` response, with zero branching logic needed in the controller.

---

## 11. Day 9 — the frontend begins

Nearly went sideways at the very start: an AI (outside this mentoring context) suggested a folder structure that got manually recreated as a set of empty files with no real tooling behind them — no `package.json`, no Vite config, nothing runnable. Caught and scrapped in favor of running the actual generator, `npm create vite@latest client`, producing a real, working scaffold.

From there, in order:
- **JSX and component fundamentals from scratch** — self-closing tags, the capitalization rule (and its silent-failure bug when broken), `export default` vs. named exports, ES Modules vs. the backend's CommonJS, and Fragments.
- **`react-router-dom` wired across all 8 spec pages** — `BrowserRouter` → `Routes` → `Route`, mirroring the backend's own routing model one layer up, plus working `<Link>`-based navigation (proven to *not* trigger a real page reload, unlike a plain `<a href>`).
- **`services/api.js` built for real** — the `apiFetch` wrapper, understanding `response.ok` (and why `fetch()` doesn't throw on its own for 4xx/5xx), and a genuine bug caught mid-build: calling `.json()` twice on the same response, which throws since a response body is a stream that can only be read once.
- **Two new categories of debugging, hit live for the first time:** `ERR_CONNECTION_REFUSED` (the backend simply wasn't running) and then a CORS block (two different localhost *ports* count as different origins to the browser) — fixed by adding the `cors` middleware, closing the loop between frontend and backend for the very first time in the project.
- **Hooks, from first principles** — why a plain `let` variable can't track form input (every re-render is a fresh function call, with no memory carried over), what a Hook actually is, and the real distinction between `useState` (a value that survives across renders, whose setter *causes* a re-render) and `useEffect` (running a side effect at a controlled moment, not on every render).
- **`Register.jsx` built completely and proven end-to-end** — controlled inputs for every field, a real submit handler calling the real backend, and a real user landing in the real Neon database. Four genuine bugs caught and fixed along the way: a copy-pasted `htmlFor`/`id` mismatch, a backend-required `role` field the form wasn't sending at all, a misleading static validation error message that named every field a guard checked without indicating which one actually failed, and the double-`.json()`-read bug resurfacing in a slightly different spot.
- **A real design decision, reasoned through rather than defaulted into:** registration deliberately does *not* auto-issue a token — a separate `/login` step is required afterward, matching the project's consistent one-job-per-function backend philosophy.

---

## Where things stand now

- **Backend:** fully built and tested through the admin view-applicants feature — auth, scholarship CRUD, application CRUD, RBAC on both sides, the first JOIN.
- **Frontend:** scaffolded, fully routed across all 8 pages, with working navigation and a proven, complete, working page (`Register.jsx`) demonstrating the entire stack connects end-to-end, from a keystroke in a React input to a real row in PostgreSQL.

**Next up:** `useNavigate` for a post-register redirect to `/login`, then building `Login.jsx`, then storing the real JWT and finally closing the last known gap in `apiFetch` — attaching an `Authorization` header for protected routes.
