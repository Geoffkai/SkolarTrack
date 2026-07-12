# SkolarTrack — Full Build Timeline

*A no-dates, phase-by-phase history of how this project came together, for context in future sessions and as a personal reference for how a project like this should be built, in order, and why.*

---

## 1. The "Big 3" decision

The starting point was bigger than SkolarTrack itself. Research into what employers actually look for led to three portfolio projects identified as necessary to be job-ready. SkolarTrack is **Project 1: Full Stack CRUD App**.

Coming in with Java, SQL, and HTML/CSS/JS from coursework, but no experience shipping a real, *deployed* web app — a prior "Dorm System" project only ever ran against a local database, which doesn't count as production-ready. That gap is exactly what this project was designed to close.

The stack was chosen deliberately, based on actual market research, not comfort:
- **Backend:** Node.js + Express
- **Frontend:** React
- **Database:** PostgreSQL via Neon
- **Auth:** JWT
- **Deploy (planned):** Railway (backend), Vercel (frontend) — later revised; see Section 12

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

*(Sections 12 onward, below, pick up several build days later — the frontend was completed in full: `useNavigate`, `Login.jsx`, JWT storage, `apiFetch`'s `Authorization` header, `MyTracker`, `useParams`, `ProtectedRoute`, and the complete `AdminDashboard` build, matching the corresponding lesson ranges in the knowledge-base files. Those pages exist and are working, feeding directly into Day 13's polish and deployment work below.)*

---

## 12. Day 13 — Polish, then full deployment

The final planned day before the app went live. Two distinct phases: a polish pass over the already-complete frontend, then the actual deployment itself, which turned out to have far more real substance than "click deploy."

### 12.1 Polish phase — real loading states, and two bugs found while adding them

Added a consistent `isLoading` / `error` / Retry pattern across `Scholarships.jsx`, `MyTracker.jsx`, `ScholarshipDetail.jsx`, and `AdminDashboard.jsx` — fetch logic pulled into a named function, called from both `useEffect` on mount and a Retry button. `apiFetch` was updated to attach `err.status = response.status` to every thrown error, so callers could branch on the actual HTTP status (`MyTracker` redirects to `/login` specifically on a `401`, since retrying with an expired token can never succeed).

Real bugs surfaced while doing this, not looked for on purpose:
- **`ScholarshipDetail`'s Rules-of-Hooks violation** — a `useEffect` sitting after two early `return`s, meaning it never ran on the very first render and the fetch never fired at all
- **A real race condition in `AdminDashboard`'s Close/Reopen handlers** — two concurrent actions on different list items could each read a stale closure snapshot of `scholarships`, letting one action's update silently overwrite the other's; fixed with the functional `setState` form, `setScholarships(current => ...)`, guaranteeing each update builds on true latest state
- **A silent-catch audit**, prompted by finding the race condition: `Login`, `Register`, and `NewScholarship` were each checked against the same precise two-ingredient definition (does it call `setState` after an `await`, on state something else could concurrently update) — `Login` and `Register` and `NewScholarship` were confirmed *not* to qualify (a "no, and here's why" is a complete, valid audit result), but `Login.jsx` turned out to have a *different*, real bug in the same area: every login failure was being silently swallowed with only `console.error`, with no feedback shown to the user at all — fixed with the same error-state pattern already used elsewhere

A second, separate bug was found and fixed by actually testing the `PUT` route live, not just reading the code: a whitespace-only title (`"   "`) passed both the frontend's `required` attribute and the backend's `!title` check, since neither one tests for anything beyond literal emptiness — confirmed directly by checking the row it produced in Neon's SQL Editor. Fixed with `.trim()` on both layers (`title?.trim()`, optional-chained to also guard against the field being missing entirely), storing the *trimmed* value everywhere downstream, not just in the validation check. `EditScholarship.jsx`'s submit handler had the same silent-catch problem as `Login.jsx` and got the same fix.

### 12.2 Branching before deployment — why `main` stopped being safe

Before touching any host, `git checkout -b dev` was run. Reasoning, understood precisely rather than just followed as a rule: once a hosting platform auto-deploys on every push to `main`, `main` stops being a safe place for in-progress, experimental work — a branch is just a movable pointer at a commit, not a duplicate of the files, so committing itself works identically regardless of which branch is checked out; only *where the commit lands*, and what's watching that branch, differs.

### 12.3 Re-checking a stale plan — Railway to Render

The original plan (`CLAUDE.md`, decided early in the project) named Railway as the backend host. Checked against current pricing before acting on it, and found Railway no longer has an ongoing free tier — a 30-day $5 trial, then a $1/month credit (not enough for a real service) or a $5/month Hobby plan minimum. **Render** was chosen instead: a genuine, ongoing free tier, no credit card required, traded off against the free instance sleeping after 15 minutes of inactivity with a ~30–50 second cold-start delay on the next request — judged an acceptable tradeoff for a portfolio project without live 24/7 traffic. Vercel's plan for the frontend needed no re-check; its free tier is genuinely indefinite for a non-commercial project.

The general principle drawn out here: a decision made earlier in a project (which host, which library, which approach) can go stale by the time it's actually executed — worth a quick current check before acting on an old plan, not just trusting it because it was already decided.

### 12.4 Deploying the backend to Render

Configured as a new Web Service: **Branch** set to `dev` (not the default `main`); **Root Directory** set to `server`, since the repo is a monorepo with `client/` and `server/` as siblings — this scopes both which folder commands run from *and* which file changes count as a reason to auto-deploy at all; **Build Command** `npm install`, **Start Command** `npm start` (resolving to the already-correct `"start": "node index.js"` script, confirmed back in Section 3's original planning to be distinct from the dev-only `nodemon` script); **Region** deliberately changed from the Oregon default to Singapore, since the actual users are Filipino students; **Instance Type** Free.

**Environment variables were re-derived from the actual code**, not assumed from memory: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (found in the login controller's `jwt.sign` call), and later `CORS_ORIGINS` (see 12.5). Pasted in via Render's "Add from .env" import rather than retyped by hand, specifically to avoid a typo like the `CORS_ORIGIN`/`CORS_ORIGINS` mismatch that did happen once during this same session. `PORT` was deliberately **excluded** — Render assigns its own port value, and the existing code (`process.env.PORT || 3000`) already handles both cases correctly without any manual override; confirmed live afterward when the boot log showed `Server running on port 10000`, not `3000`.

First deploy succeeded on the first real attempt — boot log showed `Server running on port 10000` and `Your service is live`. Verified live, not just trusted from the log: `https://skolartrack.onrender.com/health` returned `{"status":"ok","db":"connected"}`, proving the live Render server successfully reached Neon over the real internet. A separate check of the bare root path returned `Cannot GET /` — correctly diagnosed as expected Express behavior (no route was ever defined for `/`, only `/health`, `/auth`, `/scholarships`, `/applications`), not a bug.

### 12.5 CORS in production — the real mechanism, not just the fix

`app.use(cors())`, added back on Day 9 as a fix for a local-only error, was inspected properly for the first time and found to be wide open — allowing literally any origin to read API responses, not "scoped to localhost" as an old note had assumed.

**The actual mechanism, worked through properly:** CORS is a browser-enforced rule about which origins' JavaScript may *read* a response — not a wall stopping the request from being sent or processed at all. The real threat it guards against: a user logged into the real site, then visiting an unrelated malicious site in the same browser, whose script tries to silently piggyback on the user's session by calling the real API. The server still runs and responds either way; CORS controls only whether the browser hands that response back to the calling page's JS — which is also exactly why Thunder Client and Postman never trigger CORS errors, since same-origin policy is a browser-only concept.

Fixed with an explicit allowlist, read from a new `CORS_ORIGINS` environment variable (comma-separated, since two origins — local dev and the eventual Vercel URL — needed to stay valid simultaneously, ruling out a single-value swap like `DATABASE_URL` uses):
```javascript
if (!process.env.CORS_ORIGINS) {
  throw new Error("CORS_ORIGINS environment variable is not set");
}
const allowedOrigins = process.env.CORS_ORIGINS.split(",");
app.use(cors({ origin: allowedOrigins }));
```
The guard clause was added deliberately, after tracing through what would happen without it: `undefined.split(",")` throws a `TypeError` at server boot with no clear indication of the real cause; the explicit guard turns that into a self-explanatory error naming the actual missing variable — the same "fail loud, not cryptic" instinct already applied elsewhere in the project (the user-facing error pattern, the whitespace-validation fix).

Verified both directions live, not just the "it works" half: `CORS_ORIGINS` was temporarily set to a deliberately wrong value (`http://localhost:9999`), and a login attempt correctly produced a real, visible `blocked by CORS policy` console error; switched back to the correct value, the identical action succeeded cleanly, loading real data into the Admin Dashboard.

This work was committed as its own `fix:` commit (a real gap being closed, not a new feature) — kept deliberately on `dev` rather than merged to `main` immediately, reaffirming the branching decision from 12.2 rather than treating this one commit as an exception to it.

### 12.6 Deploying the frontend to Vercel

Vercel's import flow mirrored Render's in shape but differed in real specifics. **Root Directory** set to `client`. A real mistake caught before deploying: the Build Command field defaulted to `npm run dev` — the local dev-server script, not an actual build step — corrected to `npm run build` (`vite build`), the same category of mistake as pointing a production start script at `nodemon` instead of `node`.

**Branch selection worked differently than Render's:** Vercel's first-import screen has no branch field at all; it silently deploys from the repo's actual default branch (`main`), with branch tracking only becoming editable afterward, under Project Settings. This first deploy from `main` was confirmed harmless — not assumed — by running `git diff main dev -- client/` and getting empty output, proving `client/` was byte-for-byte identical between the two branches at that point (all of the session's work up to then had been backend-only).

The deploy succeeded; the live production domain, `skolar-track.vercel.app`, rendered the real nav bar successfully.

### 12.7 Deployment URL, branch URL, and production domain — untangling three different pointers

Vercel's dashboard surfaced three visually similar URLs for the same project, genuinely confusing until worked through with a concrete example. A **deployment URL** is frozen to one specific commit, permanently — pushing ten more commits never changes what it shows. A **branch URL** always reflects the newest commit on one specific branch, auto-updating on every push to it. The **production domain** (the clean one, `skolar-track.vercel.app`) is a relabeling pointer that always shows whatever branch is currently assigned as Production — moving in lockstep with that branch's own branch URL, not because they're directly linked, but because both independently track the same thing.

The analogy that made the auto-update mechanic actually land: a deployment URL is like an individual photo in a camera roll, permanent and never edited; the production domain is a "cover photo" label that keeps re-sticking itself onto whichever photo is newest from the chosen branch.

### 12.8 Switching Production tracking to `dev`, and the 404 that explained itself

Vercel's Production Branch was switched from `main` to `dev`, matching the `main`-stays-protected strategy. Visiting the production domain immediately afterward returned `404: NOT_FOUND` — correctly diagnosed, not just fixed by guessing: a settings change is only a rule change, not a deploy event. Nothing had actually been *built* under the new rule yet, since no new push had happened since the setting changed. Fixed with a one-time manual "Create Deployment," redeploying the latest existing `dev` commit and tagging it `[Production]` under the corrected rule — a catch-up step needed only because the setting changed after the last relevant push, not before it. Any future push to `dev` would trigger this automatically going forward.

### 12.9 `BASE_URL` — the deploy-time swap, first done manually

`client/src/services/api.js` had a `BASE_URL` constant with a comment explicitly flagging it as the one line to change on deployment (written against the original Railway plan — the comment text itself was also updated to reflect the actual host, Render, while making this change). Swapped from `http://localhost:3000` to `https://skolartrack.onrender.com`, confirmed with a direct check of how the rest of the file used `BASE_URL` (no trailing slash assumed anywhere downstream) before deciding not to add one.

**First full end-to-end test, live:** logging in from the still-local frontend (`localhost:5173`) against the now-live Render backend succeeded, loading real scholarship data into the Admin Dashboard. This proved every link in the chain at once — correct `BASE_URL`, correct CORS allowlist, correct Neon connection.

### 12.10 A real detour into fundamentals — `localhost`, DNS, and what hosting actually requires

Getting the live test working prompted a genuine "wait, what's actually different now" question, worked through properly rather than skipped past: `localhost` is a special hostname that always means "this exact machine," which is why a `npm run dev` server only ever existed while that one specific terminal process was running. A real host differs in every relevant way: DNS-resolvable to a real IP, running on independent physical hardware, reachable regardless of whether the developer's own laptop is even on. Confirmed, as a thought experiment, that self-hosting from a personal laptop is technically possible but requires solving router port-forwarding, a stable (usually Dynamic DNS-backed) address, and 24/7 uptime personally — exactly the bundle of problems a PaaS like Render sells as its entire product. Render's own relationship to a lower-level provider like AWS was also worked through: Render hides infrastructure decisions entirely (point at a repo, describe how to build/run it); AWS exposes individual raw building blocks (EC2, RDS, S3, Lambda, and many more) assembled manually — Render is very likely built on top of something like AWS underneath, selling convenience rather than raw compute.

### 12.11 The `dev`/`main` merge, and the real workflow behind it

A PR was opened from `dev` → `main`. The title (initially just the auto-filled branch name, "Dev") and body were both drafted deliberately, reusing the same "what changed / why / how it was verified" discipline already built for commit messages — including an explicit **Testing** section summarizing everything already confirmed live (CORS blocking a wrong origin and allowing the right one, both locally and against the live Render backend; the full end-to-end login/scholarship-fetch/admin-dashboard flow on the real deployed URLs), so the PR description itself doubled as a self-review checklist, not just a summary.

The full three-URL workflow (12.7) and the branch-switching catch-up mechanic (12.8) were both worked through again, in the context of "what happens for real, going forward" — settling on the standard convention: `main` stays the one permanent, protected branch; a temporary branch like `dev` exists only to hold inherently experimental work; once merged, both hosts' Production tracking gets switched back to `main`, and the temporary branch is deleted rather than kept as a second permanent production line (which would quietly defeat the entire purpose of protecting `main` in the first place).

Concretely, after the PR merged on GitHub: both Render's and Vercel's Production Branch settings were switched from `dev` back to `main` (requiring the same one-time manual redeploy from 12.8, since the merge and the settings change both happened after `main`'s prior state); local `main` was synced with `git checkout main && git pull origin main`, since a remote-side merge has no automatic effect on a local branch until explicitly pulled; and `dev` was deleted, both locally (`git branch -d dev`) and on the remote (`git push origin --delete dev`) — safe, since every one of its commits already lives permanently inside `main`'s history via the merge.

### 12.12 `import.meta.env.DEV`/`PROD` — removing the manual `BASE_URL` swap for good

The manual `BASE_URL` edit from 12.9 raised a real, ongoing problem: testing any *new* full-stack feature locally would require manually flipping the value back to `localhost:3000` before every local test, and back to the Render URL before every commit — an easy step to forget in either direction, indefinitely.

Fixed using two Vite-provided build-time constants, `import.meta.env.DEV` and `import.meta.env.PROD` (always exact opposites):
```javascript
const BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://skolartrack.onrender.com";
```
**A real misconception was corrected before this could be trusted:** the initial assumption was that `DEV` might reflect whether Render itself was reachable/awake — wrong. `import.meta.env.DEV` is a literal value Vite substitutes into the code once, at build time, based purely on which command produced the build (`npm run dev` vs. `vite build`) — confirmed as a thought experiment that running `npm run dev` fully offline still yields `DEV = true`, with Render never consulted at all, at any point.

Verified in both directions, live: `npm run dev` locally (with the local backend also running) showed the Network tab request correctly hitting `localhost:3000` with a `200 OK` and a matching CORS response header; `npm run build && npm run preview` (replicating exactly what Vercel's build step does, served locally on port `4173`) correctly targeted the live Render URL instead, confirmed by a CORS rejection explicitly naming `skolartrack.onrender.com` as the (correctly resolved) target — the rejection itself was expected and left as-is, since `localhost:4173` is a one-off local sanity-check port, not a real, permanent origin worth adding to the allowlist.

Committed directly to `main` (judged low-risk enough, and already thoroughly tested both ways, to skip a dedicated feature branch for a single-line change) as a `feat:`, not a `fix:` — the previous manual-swap version technically worked, this change removes a manual step rather than correcting broken behavior.

**Pushing this commit produced one more real, correctly-diagnosed observation:** Vercel rebuilt automatically (the change was inside `client/`, which Vercel watches); Render showed no new deploy activity at all — correctly explained, not treated as a bug, by the same Root Directory scoping mechanism from 12.4: Render only treats changes *inside* `server/` as a reason to redeploy, and this commit touched nothing there.

### Where things stand now

- **Backend:** live on Render, tracking `main`, connected to Neon, CORS locked down to real production origins, environment variables configured directly on the host.
- **Frontend:** live on Vercel, tracking `main`, `BASE_URL` automatically resolving between local and production without any manual edit.
- **Branch workflow:** `main` is the single permanent, protected, always-deployed branch; `dev` served its purpose as a temporary deployment-staging branch and has been deleted; the going-forward pattern is one short-lived, descriptively-named branch per unit of work, tested locally, merged via its own self-reviewed PR, then discarded.
- **Verified live, end to end, more than once:** registration and login, scholarship browsing and detail views, the student tracker, and the full admin dashboard (create/edit/close/reopen) all working against the real deployed URLs — `skolar-track.vercel.app` → `skolartrack.onrender.com` → Neon — with no `localhost` anywhere in the live chain.

SkolarTrack, as originally scoped, is complete and deployed.