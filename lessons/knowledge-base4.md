# Geoffrey's Software Engineering Knowledge Base — Part 4
 
> **Continuation of Parts 1–3.** Part 1 covered Lessons 1–23 (PostgreSQL, `pg`, Express, middleware, bcrypt, JWT concept, MVC layers, HTTP status codes, debugging). Part 2 covered Lessons 24–36 (nodemon/npm scripts, login, JWT anatomy, request lifecycle, RBAC middleware, scholarship/application CRUD, layered validation, the admin view-applicants feature with its first JOIN). Part 3 covered Lessons 37–52 (centralizing API calls, JWT storage tradeoffs, Vite scaffolding, JSX/component fundamentals, React Router, Hooks, the register/login flow, `useNavigate` and the SPA navigation model, and commit granularity). This file picks up at Lesson 53, covering the rest of the Day 10/11 frontend work: building `/my-tracker` end to end (the `useEffect`/side-effect mental model, a real JOIN query, list rendering with `.map()`/`key`), deciding how to route a freshly-logged-in user by role, and building the `/scholarships` browse page.
>
> **How to use this file:**
> Upload all five knowledge-base files to your Claude Project so every lesson is available in every chat.
> When you learn something new, tell Claude: *"Update my knowledge base with what we just learned about X"* and Claude will add it to the current part and give you an updated file to re-upload.
>
> **This file ends at Lesson 79. Lessons 80+ continue in `knowledge-base-part-5.md`.**
 
---
 
## Table of Contents (Part 4)
 
53. [SQL `SERIAL` Sequences Never Reuse Gaps — the Ticket-Dispenser Model](#lesson-53-sql-serial-sequences-never-reuse-gaps--the-ticket-dispenser-model)
54. [Why a Fetch Can't Live Directly in a Component Body — Renders, Side Effects, and the Three Ways `useEffect` Can (Not) Protect You](#lesson-54-why-a-fetch-cant-live-directly-in-a-component-body--renders-side-effects-and-the-three-ways-useeffect-can-not-protect-you)
55. [Module Scope vs. Global Scope — Why `apiFetch(...)` Fails Pasted Into DevTools](#lesson-55-module-scope-vs-global-scope--why-apifetch-fails-pasted-into-devtools)
56. [Ownership Filters Come From the Verified Token, Not the Client](#lesson-56-ownership-filters-come-from-the-verified-token-not-the-client)
57. [JOIN Column Collisions and the `a.status`/`s.status` Trap — Building `getApplicationsByStudent`'s First JOIN](#lesson-57-join-column-collisions-and-the-astatussstatus-trap--building-getapplicationsbystudents-first-join)
58. [Rendering Lists in JSX — `.map()`, the `key` Prop, and Arrow Function Body Shapes](#lesson-58-rendering-lists-in-jsx--map-the-key-prop-and-arrow-function-body-shapes)
59. [`apiFetch` Already Parses JSON — Don't Call `.json()` on What It Returns](#lesson-59-apifetch-already-parses-json--dont-call-json-on-what-it-returns)
60. [Deciding Whether to Decode a JWT Client-Side for Role-Based Redirects](#lesson-60-deciding-whether-to-decode-a-jwt-client-side-for-role-based-redirects)
61. [API Response Shape Inconsistency — Bare Array vs. Wrapped Object](#lesson-61-api-response-shape-inconsistency--bare-array-vs-wrapped-object)
62. [Building `/scholarships` — Reusing the Fetch/State/List Pattern, and a Second Bare-Identifier Bug](#lesson-62-building-scholarships--reusing-the-fetchstatelist-pattern-and-a-second-bare-identifier-bug)
63. [Template Literals for Dynamic `<Link>` Routes](#lesson-63-template-literals-for-dynamic-link-routes)
64. [`useParams` and Choosing an Honest "Not-Loaded-Yet" State](#lesson-64-useparams-and-choosing-an-honest-not-loaded-yet-state)
65. [Why a Detail Page's Fetch Needs to Re-run When `:id` Changes — Same Route Pattern, Same Component Instance](#lesson-65-why-a-detail-pages-fetch-needs-to-re-run-when-id-changes--same-route-pattern-same-component-instance)
66. [Checking "Is This Object Empty" — `Object.keys().length`, a Live Strict-Mode Sighting, and React Fragments](#lesson-66-checking-is-this-object-empty--objectkeyslength-a-live-strict-mode-sighting-and-react-fragments)
67. [Commit Granularity, Revisited — Bundling Is Right When Changes Tell One Story](#lesson-67-commit-granularity-revisited--bundling-is-right-when-changes-tell-one-story)
68. [`ProtectedRoute` — a Frontend Route Guard That Mirrors Backend RBAC](#lesson-68-protectedroute--a-frontend-route-guard-that-mirrors-backend-rbac)
69. [`navigate()` vs. `<Navigate>` — Imperative Action vs. a Render-Time Answer](#lesson-69-navigate-vs-navigate--imperative-action-vs-a-render-time-answer)
70. [`children` Is Just an Auto-Populated Prop — What Makes a Wrapper Component Reusable](#lesson-70-children-is-just-an-auto-populated-prop--what-makes-a-wrapper-component-reusable)
71. [The `requireRole`/`requiredRole` Typo — a Silent Prop Mismatch That Quietly Disabled a Guard](#lesson-71-the-requirerolerequiredrole-typo--a-silent-prop-mismatch-that-quietly-disabled-a-guard)
72. [Proving a Guard Works Means Watching Every Branch, Not Just One](#lesson-72-proving-a-guard-works-means-watching-every-branch-not-just-one)
73. [A New Ownership-Filtered Route — `GET /scholarships/mine`, Naming It, and Route-Ordering Again](#lesson-73-a-new-ownership-filtered-route--get-scholarshipsmine-naming-it-and-route-ordering-again)
74. [Two Features That Share a Filter Pattern Aren't the Same Feature — Applicants-per-Scholarship vs. Scholarships-per-Admin](#lesson-74-two-features-that-share-a-filter-pattern-arent-the-same-feature--applicants-per-scholarship-vs-scholarships-per-admin)
75. [Derived State From `.filter()` — Splitting One List Into Sections Without New `useState`](#lesson-75-derived-state-from-filter--splitting-one-list-into-sections-without-new-usestate)
76. [Honest Empty States Have to Live at the Level Where the Split Happens](#lesson-76-honest-empty-states-have-to-live-at-the-level-where-the-split-happens)
77. [A Button's Label Is a Promise — Matching UI Wording to What the Backend Actually Does](#lesson-77-a-buttons-label-is-a-promise--matching-ui-wording-to-what-the-backend-actually-does)
78. [Updating State After a User Action — Plain Click-Handlers, Not `useEffect`, and Refetch vs. Local Reconstruction](#lesson-78-updating-state-after-a-user-action--plain-click-handlers-not-useeffect-and-refetch-vs-local-reconstruction)
79. [A Pre-Existing Gap Surfaces — `status` Destructured but Never Passed Through `update`/`updateScholarship`](#lesson-79-a-pre-existing-gap-surfaces--status-destructured-but-never-passed-through-updateupdatescholarship)
*(Lessons 1–23 are in Part 1. Lessons 24–36 are in Part 2. Lessons 37–52 are in Part 3.)*
 
---
 
## Lesson 53: SQL `SERIAL` Sequences Never Reuse Gaps — the Ticket-Dispenser Model
 
**Date learned:** 2026-07-07
**Tags:** `postgresql` `serial` `sequences` `day-10`
 
Deleted two test rows from `users`, leaving ids `1`, `2`, `5` instead of `1`, `2`, `3` — prompted a real question about whether (and how) to "reset" it back to clean, sequential ids.
 
### The deli-ticket-dispenser model
 
A `SERIAL` column isn't "count the rows and add one" — it's a completely separate database object called a **sequence**, whose only job is: remember the last number handed out, hand out the next one, never look back. Exactly like a deli's take-a-number machine — it has no idea whether ticket #3 got served, walked out, or never showed up. It just keeps counting up. Deleting rows tells the sequence nothing; it already handed those numbers out.
 
### Why this isn't actually a problem
 
Gaps in ids are normal and expected in every real system — not a sign anything went wrong. Even *failed* inserts burn a number (e.g. a `409` duplicate-email rejection from Lesson 22 still consumed a sequence value, despite no row ever being created). Once foreign keys exist (`applications.applicant_id`, `scholarships.posted_by`, both pointing at `users.id`), an id stops being a display number and becomes a **reference** other rows depend on — renumbering it means finding and fixing every row elsewhere that pointed at the old value, a real risk in a live system, not a cosmetic tidy-up.
 
### If you actually want to change it anyway (fine for throwaway test data)
 
```sql
-- Option A: only affects the NEXT insert, leaves existing rows alone
ALTER SEQUENCE users_id_seq RESTART WITH 3;
 
-- Option B: renumbers an existing row directly — risky once foreign keys point at it
UPDATE users SET id = 3 WHERE id = 5;
```
 
Don't guess the sequence's name — ask Postgres directly instead of assuming the `tablename_column_seq` convention:
```sql
SELECT pg_get_serial_sequence('users', 'id');
```
 
> One line: **`SERIAL` is a separate, one-directional counter object, not a live row count — it never rewinds on delete, gaps are normal (even failed inserts burn a number), and once foreign keys exist an id is a reference to preserve, not a display number to keep clean.**
 
---
 
## Lesson 54: Why a Fetch Can't Live Directly in a Component Body — Renders, Side Effects, and the Three Ways `useEffect` Can (Not) Protect You
 
**Date learned:** 2026-07-07
**Tags:** `react` `useeffect` `side-effects` `rerender` `strict-mode` `day-11`
 
Building `MyTracker`'s data fetch surfaced the deepest "why" question of the whole frontend so far: what actually causes a rerender, why does an unprotected fetch loop forever, and why is `useEffect` specifically the fix rather than just a rule to memorize.
 
### The one and only rerender trigger
 
`apiFetch` itself does nothing to React — it's just a function that sends a request and returns a promise, with no idea a "render" even exists. **The only thing that ever triggers a rerender is calling a state setter** (`setApplications(...)`). Nothing else does it.
 
### Tracing the loop, step by step, if the fetch sat bare in the body
 
```jsx
function MyTracker() {
    const [applications, setApplications] = useState([]);
    apiFetch("/applications").then((data) => setApplications(data.applications)); // ❌
    return <div>...</div>;
}
```
 
1. React calls `MyTracker()` to render — every line runs, including the bare `apiFetch(...)` call. A real request fires.
2. `fetch` is async — the function doesn't wait. It returns the JSX and finishes rendering with `applications` still `[]`.
3. The response eventually arrives; `.then()` fires, calling `setApplications(...)`.
4. That setter call is the trigger — React reruns `MyTracker()` from scratch.
5. The fresh call hits the exact same bare `apiFetch(...)` line again — nothing gates it — a new request fires.
6. That new request resolves, calls `setApplications` again, triggers another render, hits the line again — forever.
The root cause isn't `apiFetch` itself "causing" anything — it's that **every render is a completely fresh function call with no memory of previous calls** (the same fact already learned from `useState` — a plain `let` can't track input across renders because the function body is a blank slate every time). Nothing inside the function distinguishes call #1 from call #400, so nothing skips the fetch line on later calls. The loop is just what an ordinary, memoryless function does when a side effect inside it happens to feed back into triggering another call of itself.
 
### Three distinct shapes — only one of them is actually safe
 
| Form | Behavior |
|---|---|
| No `useEffect` at all — fetch bare in the body | Runs on **every render**, unconditionally — no protection at all |
| `useEffect(() => {...})` — **no** second argument | Runs **after every render**, unconditionally — same infinite loop, just one render-cycle removed |
| `useEffect(() => {...}, [])` — **empty array** | Runs **exactly once**, right after the first render, never again |
 
Leaving the dependency array out entirely is a genuinely separate way to reproduce the identical failure — not a smaller version of the mistake, the same loop, just mediated through `useEffect` instead of the raw function body. The empty array is doing real, specific work: "nothing in here to compare, so never run again."
 
One refinement worth keeping precise: the array doesn't control *whether* the effect runs at all (it always fires once, right after mount, no matter what's in it) — it controls whether it runs **again** on later renders.
 
### The deeper reason, beyond just avoiding the loop
 
A component function is only supposed to answer one question: "given current state, what JSX should show up right now?" — a fast, predictable calculation. A network call is a **side effect** — it reaches into the real world, takes unpredictable time, and has consequences outside "what does the screen look like." Mixing the two breaks the model React is built on. `useEffect` is React's deliberate escape hatch: "compute your JSX purely and safely; *then*, separately, after rendering finishes, you may do your messy real-world side effect over here."
 
**A concrete consequence of this, not just a hypothetical:** in development, React's **Strict Mode** deliberately calls a component function **twice in a row**, instantly, for what's conceptually one render — specifically to expose bugs like this one. A bare, unprotected fetch in the body would genuinely fire twice for a single logical render under Strict Mode. An effect wrapped correctly is designed to tolerate this double-invocation safely; a side effect sitting loose in the body has no such protection.
 
### Why controlled inputs (`onChange`) don't have this problem, despite also calling a setter
 
```jsx
<input onChange={(e) => setEmail(e.target.value)} />
```
 
Every render **defines** a fresh arrow function and hands it to `onChange` — but *defining* a function is not the same as *calling* it, same as writing `function foo() {}` doesn't execute `foo`. Render's job stops at "here's the function to call *if* a change event happens" — it never invokes it itself. The actual call only happens when the browser fires a real `change` event — an actual keystroke, external to React's render cycle entirely. So: one keystroke → one real external event → one setter call → one rerender → render defines a fresh handler → waits for the next real keystroke. The bare-fetch bug is different specifically because render itself was the thing directly *calling* the side-effect-triggering code, with nothing external gating it.
 
> One line: **only a state-setter call ever triggers a rerender; a fetch left unprotected in a component's body reruns on every render because renders have no memory of previous calls, and this happens whether `useEffect` is missing entirely or present with no dependency array — only `useEffect(() => {...}, [])` genuinely runs once; React separates rendering (a pure calculation) from side effects (real-world actions) on purpose, and Strict Mode's dev-only double-invoke exists specifically to expose unprotected side effects early; controlled inputs never loop because render only *defines* the `onChange` handler, it never *calls* it — only a real browser event does.**
 
---
 
## Lesson 55: Module Scope vs. Global Scope — Why `apiFetch(...)` Fails Pasted Into DevTools
 
**Date learned:** 2026-07-07
**Tags:** `modules` `scope` `debugging` `devtools` `day-11`
 
Trying to sanity-check `apiFetch("/applications")` by pasting it straight into the browser console produced confusion about *where* to actually run it.
 
### Why it fails as written
 
`apiFetch` is defined inside `services/api.js` and only reachable via `export default` / `import apiFetch from '../services/api'` — the *only* things that can see it are files that explicitly import it. The browser console runs in the page's **global (`window`) scope**, entirely separate from any individual module's internal variables. Pasting `apiFetch(...)` directly into DevTools throws `ReferenceError: apiFetch is not defined` — the exact same category of bug as Lesson 51's bare `token` identifier: reading a name that was never declared in the scope you're actually running in.
 
### Two real ways to actually run it
 
**Quick throwaway check** — temporarily expose it on `window`:
```javascript
window.apiFetch = apiFetch;   // TEMPORARY — delete once confirmed
```
Save, let Vite hot-reload, then the console command works — because it's genuinely sitting on `window` now, which the console can see. Delete the line afterward; it's a debugging scaffold, not real code.
 
**The better option, most of the time** — don't test in isolation at all. Put the call where it's actually going to live for real: inside the component via `useEffect`, exactly as `MyTracker` needed it to be built anyway. This isn't a test harness to throw away — it *is* the real feature, just with `console.log` standing in for real rendering until that part's built too.
 
> One line: **module-scoped code (`apiFetch`) is invisible to the browser console's global scope unless deliberately exposed on `window`; when the "test" and the "real" code are the same shape anyway, prefer writing the real code in its real location over building a throwaway console check.**
 
---
 
## Lesson 56: Ownership Filters Come From the Verified Token, Not the Client
 
**Date learned:** 2026-07-07
**Tags:** `jwt` `req-user` `authorization` `ownership-filter` `day-11`
 
A real question worth answering explicitly: nowhere in `Login.jsx` or `apiFetch` does anything ever say "student #7's applications" — so how does `GET /applications` know which rows are "mine"?
 
### The trace, tying three previously-separate pieces together
 
1. **At login**, `jwt.sign({ userId: user.id, role: user.role }, ...)` (Lesson 25) bakes the student's own `userId` into the token's payload, permanently, until it expires.
2. **`apiFetch`** attaches that exact token to every request: `Authorization: Bearer <token>`.
3. **On the backend**, `verifyToken` (Lesson 29) runs first, verifies the signature, and sets `req.user` to the decoded payload — so `req.user.userId` is available, straight out of the token that was sent.
4. **The controller** never receives a student id as a URL param or query string — it pulls it from `req.user.userId` and uses *that* as the filter value:
```javascript
const studentId = req.user.userId;   // from the verified token, not from anything the client controls
const applications = await getApplicationsByStudent(studentId);
```
 
### Why this is the identical shape as a pattern already built once
 
Same idea as the admin view-applicants feature's `posted_by = $2` ownership filter — the row-filtering value comes from the **verified token**, never from something the client typed into a URL or body. If a student could instead send `GET /applications?studentId=7`, nothing would stop changing that number to `8` to read someone else's data. Pulling it from `req.user` ties the filter to something cryptographically unforgeable (Lesson 20's signature guarantee) — it's mine *because* the token proves it's mine, and the token can't be forged to claim otherwise.
 
> One line: **a protected route's ownership filter should always come from `req.user` (set by `verifyToken` after verifying the signature), never from a client-supplied id in the URL or body — the token's tamper-proof signature is what makes the filter trustworthy.**
 
---
 
## Lesson 57: JOIN Column Collisions and the `a.status`/`s.status` Trap — Building `getApplicationsByStudent`'s First JOIN
 
**Date learned:** 2026-07-07
**Tags:** `sql` `join` `column-collision` `postgresql` `day-11`
 
`getApplicationsByStudent` originally only selected from `applications` — real rows, but nothing beyond a bare `scholarship_id` number, no title, no deadline, no organization. Since the entire point of `/my-tracker` is showing a student's pipeline in a meaningful way, decided to add a JOIN now rather than ship something close to meaningless and fix it later.
 
### The JOIN itself — not new syntax, just a new place to use it
 
CMSC 127 already covered Postgres JOINs; the shape carried over directly:
```sql
SELECT ...
FROM applications AS a
JOIN scholarships AS s ON a.scholarship_id = s.id
WHERE a.student_id = $1
```
 
### The real danger, caught before it shipped: two tables, one shared column name
 
`applications` has a `status` column (`'interested'`/`'applied'`/...); `scholarships` **also** has a `status` column (`'open'`/`'closed'`) — a genuinely different fact that happens to share a name. `SELECT applications.*, scholarships.*` (or any unaliased `*` on both sides) collapses both into one JS object with a single `status` key — whichever comes second **silently overwrites** the other. No error, no warning; the result would just quietly show the wrong status with no indication the other value ever existed. Same silent-failure category as Lesson 34's RBAC gap and Lesson 42's capitalization bug.
 
**The fix:** name every column explicitly, and alias the colliding ones:
```sql
SELECT
    a.id, a.status AS application_status, a.notes, a.updated_at,
    s.title, s.organization, s.description, s.amount,
    s.slots, s.requirements, s.deadline, s.status AS scholarship_status
FROM applications AS a
JOIN scholarships AS s ON a.scholarship_id = s.id
WHERE a.student_id = $1
```
 
### Two real bugs actually caught building this
 
1. **A comma instead of a dot:** `WHERE a,student_id = $1` — a plain typo, but a real SQL syntax error (`syntax error at or near ","`), not a silent one. `a.student_id` (dot) means "the `student_id` column on table `a`"; `a,student_id` isn't valid SQL at all.
2. **The collision itself, present in the first draft:** both `a.status` and `s.status` listed with no alias on either. Caught before running it, by re-reading the column list against the exact warning given beforehand — proof that naming the danger explicitly *before* writing code helps catch it during review, not just after a bug shows up.
Confirmed fixed via direct Thunder Client inspection (not just "no error") — the real response showed `"application_status": "applied"` and `"scholarship_status": "closed"` as genuinely separate keys with correct, distinct values.
 
### What *didn't* need to change
 
Neither the controller nor the route needed any edit at all — same function name, same return shape (an array of rows), just richer rows. Direct payoff of Lesson 21's separation of concerns: swapping the query only touched the model.
 
> One line: **once two joined tables share a column name, `SELECT *` on either side lets one silently overwrite the other in the merged JS object — always name columns explicitly and alias collisions (`a.status AS application_status`) once tables might share a field name; and a JOIN query change should never require touching the controller or route if the layers are properly separated.**
 
---
 
## Lesson 58: Rendering Lists in JSX — `.map()`, the `key` Prop, and Arrow Function Body Shapes
 
**Date learned:** 2026-07-07
**Tags:** `react` `map` `key-prop` `arrow-functions` `jsx` `day-11`
 
Rendering `MyTracker`'s (and later `Scholarships`') list surfaced three things that needed unpacking together: the `.map()`-to-JSX pattern itself, why `key` is mandatory and not just a lint nag, and a lingering confusion about arrow function syntax that turned out to be a false alarm.
 
### The full syntax, piece by piece
 
```jsx
{applications.map((app) => (
    <li key={app.id}>...</li>
))}
```
 
- **`applications.map(...)`** — already known from plain JS/CMSC 127: takes an array, runs a function on every item, returns a **brand-new array** built from what that function returned each time. Here, an array of application objects goes in; an array of JSX elements comes out.
- **`(app) => ( ... )`** — an arrow function, same shape as `(e) => setEmail(e.target.value)`. `app` represents one single item, fresh on each call.
- **The outer `{ }`** — Lesson 39's JSX rule: curly braces mean "what's inside is real JavaScript, not literal text." `applications.map(...)` evaluates to an array of JSX elements, and React is specifically fine rendering an array handed to it this way — each element in order, same as if typed out by hand.
Full sentence: *take the array, build one `<li>` per item, collect them into a new array, drop that array here — React renders every element in it.*
 
### Why `key` is mandatory — the nametag, not the seat number
 
Picture tracking a specific person across changing lineups: **"seat 3"** is useless once the lineup shifts — seat 3 belonged to someone else yesterday. A **nametag** travels with the person regardless of where they end up sitting. `key` is React's nametag: given an array of rendered items, React needs to tell "same item, possibly moved" apart from "genuinely new item," so it can update correctly instead of rebuilding everything from scratch on every change.
 
**Concrete trace of what breaks with position-based keys (`key={index}`) once a list actually changes:**
```
Render 1:  [ DOST(id 5), CHED(id 8), SM(id 12) ]
            key=0        key=1        key=2
```
Delete CHED (`id 8`, position 1):
```
Render 2:  [ DOST(id 5), SM(id 12) ]
            key=0        key=1
```
SM used to be `key=2`; now it's `key=1`. From the key alone, React can't tell SM *moved* — it looks like "key=1" simply got *edited in place* from CHED's data into SM's data, not that item 2 slid up to fill a gap. Invisible today with plain read-only `<li>`s, but a real, well-known bug source once rows become editable (status updates, notes) or deletable — state or inputs can end up attached to the wrong row after the list changes shape. Using the real database `id` instead of position fixes this completely: the key travels with the data itself, not with wherever it lands in the array.
 
### Arrow function body shapes — only two exist, not three
 
A moment of confusion: is `(app) => (<li>...</li>)` some new syntax, different from `() => {}`? It isn't — there are exactly two shapes, and this is the same one already known:
 
| Shape | Example | Behavior |
|---|---|---|
| **Implicit return** | `(e) => setEmail(e.target.value)` | Whatever follows `=>` is returned automatically, no `return` keyword, no braces |
| **Explicit block body** | `(app) => { return <li>...</li>; }` | Curly braces mean "a block of statements" — nothing auto-returns; `return` must be written |
 
`(app) => ( <li>...</li> )` is **implicit return** — identical category to the input handler, just with the returned JSX wrapped in plain `( )` for readability when it spans multiple lines. The parentheses aren't special syntax; they're the same kind of optional grouping as wrapping `(2 + 3) * 4` for visual clarity. On one line, they're entirely optional: `(app) => <li key={app.id}>{app.title}</li>` is equally valid.
 
> One line: **`.map()` builds one JSX element per array item inside the required `{ }` JS-escape; `key` must be a stable value from the data itself (a database `id`), never array position, because React uses it to tell "same item, moved" apart from "new item" — position-based keys silently misattribute state once a list is edited or has items removed; and `(app) => (<jsx>)` is the same implicit-return arrow-function shape as `(e) => setEmail(...)`, not a separate syntax — the parentheses are just readability grouping for a multi-line return.**
 
---
 
## Lesson 59: `apiFetch` Already Parses JSON — Don't Call `.json()` on What It Returns
 
**Date learned:** 2026-07-07
**Tags:** `apifetch` `json` `debugging` `day-11`
 
`MyTracker`'s first draft wrote:
```javascript
apiFetch("/applications").then((data) => data.json()).catch(...)
```
 
### Why this is a genuine bug, not just unnecessary
 
`services/api.js`'s `apiFetch` already calls `.json()` **internally**, once, and returns the already-parsed plain object — that was the entire point of building the wrapper (Lesson 37): every caller gets to skip dealing with `Response` objects and stream-reading entirely. By the time `.then((data) => ...)` runs, `data` is **not** a `Response` — it's a plain object, already matching the controller's shape (`{ applications: [...] }`). Plain objects don't have a `.json()` method; that method only exists on real `Response` objects, one layer down, already consumed.
 
**What actually happens:** `TypeError: data.json is not a function` — a real crash, caught silently by the surrounding `.catch()`, logged as a generic failure — the same "loud underneath, quiet on the surface" shape as Lesson 51's `ReferenceError`.
 
### A second, independent bug hiding on the same line
 
Even setting the first bug aside, the `.then()` never called `setApplications(...)` anywhere — nothing updates state regardless of what `data.json()` did or didn't return. Two separate problems stacked in one line.
 
### The fix
 
```javascript
apiFetch("/applications")
    .then((data) => setApplications(data.applications))
    .catch((error) => console.error("Failed to load applications:", error));
```
 
> One line: **once a wrapper like `apiFetch` already calls `.json()` internally, everything downstream receives the plain parsed object, not a `Response` — calling `.json()` again throws `TypeError: ... is not a function`; and always double-check a `.then()` callback actually calls the state setter, not just processes the data and discards it.**
 
---
 
## Lesson 60: Deciding Whether to Decode a JWT Client-Side for Role-Based Redirects
 
**Date learned:** 2026-07-07
**Tags:** `jwt` `atob` `client-side-decode` `design-decision` `security-boundary` `day-11`
 
After login, students need to land on `/my-tracker` and admins on `/admin/dashboard` — but the login response only ever returns `{ token }` (Lesson 25), no `role` field. A genuine two-option design decision, worth weighing rather than defaulting into.
 
### The two real options
 
**Option A** — change the backend to also send `role` explicitly: `res.status(200).json({ token, role: user.role })`.
 
**Option B** — decode the role straight out of the token that's already being stored, since it's already there in the payload (Lesson 20).
 
### Why Option B was chosen
 
Two concrete reasons, not just preference:
1. **Avoids the same fact living in two places.** Option A means `role` exists both inside the token's payload *and* as a separate top-level field in the same response — nothing enforces those two copies staying in sync if the code ever changes later. Option B has exactly one source of truth.
2. **Doesn't touch an already-proven backend file.** The login controller has been solid since Day 3; the frontend already has everything it needs without reopening working code.
### The decode syntax, read right to left
 
```javascript
const payload = JSON.parse(atob(token.split(".")[1]));
```
`token.split(".")` — cuts the token into its three real dot-separated chunks (the same three visible on jwt.io). `[1]` — grabs the middle one, the payload. `atob(...)` — a browser built-in that reverses base64 encoding back into a plain string. `JSON.parse(...)` — turns that string back into a real object: `{ userId, role }`.
 
### Centralized into a shared helper, same reasoning as `apiFetch`
 
```javascript
// services/auth.js
export function getRoleFromToken(token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
}
```
This decode logic will be needed again soon (e.g. a nav bar that hides/shows links by role) — centralizing it now avoids duplicating the same three-step decode in multiple files later, mirroring exactly why `apiFetch` itself got centralized (Lesson 37).
 
### The critical caveat — restated because it matters every time this pattern is reused
 
Decoding the role client-side is **only ever a UX nicety** — "which page should I show you" — never a security check. Nothing stops a user from opening DevTools and faking a decoded `role: "admin"` locally. That's fine, because the actual gate is still the backend's `requireAdmin`/`requireStudent` middleware, which can't be bypassed this way (Lesson 39). This decode never replaces that gate; it only decides where to *point* someone, not what they're *allowed* to do once they get there.
 
### Testing discipline — a two-branch conditional needs both branches watched
 
Same principle as RBAC testing (Lessons 32/34): a conditional isn't proven by watching only one path. Confirmed both outcomes directly — logging in as a student landed on `/my-tracker` with real rendered data; logging in as an admin landed on `/admin/dashboard` (still a Day-9 placeholder, but the *routing* itself was the thing under test).
 
> One line: **a JWT's payload is already-readable data (never secret, per Lesson 20) — decode it client-side with `JSON.parse(atob(token.split(".")[1]))` rather than having the backend send the same fact twice; centralize the decode into a shared helper for reuse; and remember this decode is strictly a UX convenience — the backend's role guards remain the only real security boundary, and a role-based conditional isn't proven until both branches have actually been watched firing.**
 
---
 
## Lesson 61: API Response Shape Inconsistency — Bare Array vs. Wrapped Object
 
**Date learned:** 2026-07-07
**Tags:** `api-design` `consistency` `rest` `day-11`
 
Before building `/scholarships`, checking `scholarshipController.js`'s `getAll` revealed it returns a **bare array** (`res.status(200).json(scholarships)`), while `applicationController.js`'s `getAll` returns a **wrapped object** (`res.status(200).json({ applications })`) — a real inconsistency, not a deliberate split.
 
### Why it likely happened
 
`scholarshipController.js` was built on Day 6, before any convention existed. `applicationController.js` came later (Day 7–8) and happened to get written differently. Same category as Lesson 52's commit-granularity point: not every inconsistency is a bug, but it's worth noticing rather than assuming it was intentional.
 
### The actual tradeoff between the two styles
 
**Bare array** — simpler to consume (`setScholarships(data)` directly, no unwrapping) — but no room to add anything alongside the list later (a total count, a pagination flag) without breaking every existing caller that assumes the response *is* the array.
 
**Wrapped object** — one extra unwrapping step (`data.scholarships`) — but leaves room to grow (`{ scholarships: [...], totalCount: 12 }`) without changing the top-level shape anyone already depends on.
 
Neither is objectively "correct" — plenty of real APIs do it either way. What matters more than the choice itself is **picking one and staying consistent**, so a future reader doesn't have to re-check each endpoint's shape individually.
 
### The decision made
 
Standardized `scholarshipController.js` to also wrap its response (`{ scholarships }`), matching `applications`' shape, rather than leaving the inconsistency in place.
 
> One line: **a bare array response is simpler but can't grow without breaking callers; a wrapped object costs one extra unwrapping step but leaves room to add sibling fields later — neither is objectively better, but an accidental inconsistency between two endpoints is worth deliberately resolving rather than leaving to chance.**
 
---
 
## Lesson 62: Building `/scholarships` — Reusing the Fetch/State/List Pattern, and a Second Bare-Identifier Bug
 
**Date learned:** 2026-07-07
**Tags:** `react` `pattern-reuse` `debugging` `day-11`
 
`/scholarships` is structurally the same recipe as `/my-tracker` — `useEffect` fetch on mount, `useState` to hold the result, `.map()` + `key` to render — the first time attempting the full shape mostly independently, since the pattern had already been proven once.
 
### Two real bugs caught in the first draft
 
**1. A stacked typo + invalid destructuring:**
```javascript
cosnt[(scholarships, setScholarship)] = useState([]);   // ❌
```
`cosnt` is a typo for `const`; separately, the brackets are wrong — `[( )]` (a parenthesized comma expression inside square brackets) instead of a plain `[ ]` array-destructuring pattern. Since `cosnt` was never a real keyword, this would throw before the component even finished defining state. Fixed to:
```javascript
const [scholarships, setScholarship] = useState([]);
```
 
**2. A bare, undeclared identifier used as a `key`:**
```jsx
<li key={key}>   // ❌ — same category as Lesson 51's localStorage(token, ...) bug
```
`key` here isn't a variable that exists anywhere in the function — it's a bare word, same mistake shape as Lesson 51's unquoted `token`. Caught this time by being asked to self-diagnose rather than told outright, and correctly identified — the fix reaches for what's actually available inside the `.map()` callback, the item itself: `key={sch.id}`.
 
Successfully recognizing a previously-learned bug *shape* in a completely new file is a genuine sign of transfer — not memorizing one specific fix, but recognizing the underlying pattern ("a bare identifier is a variable lookup, not a string/value") wherever it shows up next.
 
> One line: **the fetch/state/list pattern proven once in `MyTracker` transferred directly to a new page with no new concepts needed; and a bare, unquoted identifier used where a real value belongs (`key={key}`, `localStorage.setItem(token, ...)`) is a recognizable, recurring bug shape — recognizing it in a brand-new file, unprompted, is real evidence of understanding transferring, not rote memorization.**
 
---
 
## Lesson 63: Template Literals for Dynamic `<Link>` Routes
 
**Date learned:** 2026-07-07
**Tags:** `react-router` `template-literals` `link` `day-11`
 
Each scholarship card needs to link to its own detail page:
```jsx
<Link to={`/scholarships/${sch.id}`}>View Details</Link>
```
 
### Nothing new — a tool already used once, applied to a new spot
 
Backtick template literals were already written once, in `services/api.js`: `` `${BASE_URL}${path}` ``. Same mechanism here — anything inside `${ }` is evaluated as real JavaScript and spliced into the string; everything else stays literal text. For a scholarship with `id: 3`, `` `/scholarships/${sch.id}` `` evaluates to the plain string `"/scholarships/3"`. Different item in the same `.map()`, different `id`, same template — a different resulting string each time.
 
### Why `to={...}` needs curly braces at all
 
Lesson 39's JSX rule again: curly braces mean "evaluate this as JavaScript." `<Link to="/login">` needs no braces — a fixed string, same as `src="cat.jpg"`. `<Link to={`/scholarships/${sch.id}`}>` needs them specifically because the value isn't fixed — it's a JS expression (the template literal) that must be evaluated first. React evaluates it, gets back a real string like `"/scholarships/3"`, and that's what `to` actually receives. From `<Link>`'s own point of view, a computed string and a hand-typed one are indistinguishable — it has no idea, and no reason to care, that this one was built rather than written literally.
 
### What clicking it does — no new mechanism
 
Same as every other `<Link>` already understood (Lesson 44): a real URL change via the History API, zero network request, `Routes` re-renders to match. The only difference from `<Link to="/login">` is that the destination differs per item in the list instead of being identical for all of them.
 
### What this sets up next
 
Landing on a URL like `/scholarships/3` doesn't automatically give the component rendered there any way to know `3` is sitting in its own address — it has to explicitly ask. That's exactly what `useParams` is for, and it's the next concept needed to build `ScholarshipDetail.jsx`.
 
> One line: **`to={`/path/${item.id}`}` reuses the same template-literal tool already used in `apiFetch`, just building a per-item URL from data instead of a fixed constant; curly braces are required because the value must be evaluated as JS first, but `<Link>` receives a finished string either way and can't tell it was computed; and reading a value like this back out of the URL, once landed, is the job of `useParams` — the next Hook to learn.**
 
---
 
## Lesson 64: `useParams` and Choosing an Honest "Not-Loaded-Yet" State
 
**Date learned:** 2026-07-07
**Tags:** `react-router` `useparams` `usestate` `day-11`
 
Building `ScholarshipDetail.jsx` needed the id straight out of its own URL — `useParams()` is the frontend mirror of `req.params` on the backend: the route pattern (`/scholarships/:id`) matches, but the *component* still has to explicitly ask for what matched, exactly like a controller still has to destructure `req.params.id` even after the route matched.
 
```jsx
const { id } = useParams(); // pulls "id", matching :id from the route definition
```
Worth remembering: `id` always comes back as a **string** (`"3"`), never a number — URLs are text, no exceptions.
 
**Choosing the initial `useState` value mattered more than it first looked.** `useState("")` doesn't crash (reading `.title` off a string just returns `undefined`, rendered as nothing) — but it isn't an *honest* description of "a scholarship that hasn't loaded yet." `useState(null)` is more honest but would crash immediately on `.title` before the fetch resolves, since properties can't be read off `null`. `useState({})` was the actual right call: property access on an empty object is always safe, and an empty object is a genuinely accurate empty version of the real shape — not just a value that happens not to explode.
 
> One line: **`useParams()` is `req.params` for the frontend — the route match and reading the matched value are two separate steps; and an initial `useState` value should honestly represent "not loaded yet," not just avoid crashing — `{}` beats both `""` and `null` for an object you'll eventually fetch.**
 
---
 
## Lesson 65: Why a Detail Page's Fetch Needs to Re-run When `:id` Changes — Same Route Pattern, Same Component Instance
 
**Date learned:** 2026-07-07
**Tags:** `react-router` `useeffect` `useparams` `day-11`
 
`ScholarshipDetail`'s `useEffect` dependency array is `[id]`, not `[]` — worth tracing exactly why, since the reason is genuinely different from every previous `[]` fetch-on-mount so far.
 
### The scenario `[id]` protects against
 
Imagine a "Similar Scholarships" link sitting directly on the detail page itself, pointing at a *different* id: `<Link to="/scholarships/7">`. Clicking it while already viewing `/scholarships/3` does **not** unmount and remount `ScholarshipDetail` — both URLs match the exact same `<Route path="/scholarships/:id">`, so React Router treats it as the same component instance with new params, not a new page. `useParams()`'s return value quietly changes underneath the still-mounted component, from `{ id: "3" }` to `{ id: "7" }`.
 
With `[]`, the effect would think "I already ran once, done" and never fetch again — the page would keep showing scholarship 3's data forever, with `/scholarships/7` sitting in the address bar. `[id]` tells React "re-run specifically when `id` changes," which correctly re-fires the fetch and swaps in scholarship 7's real data.
 
### The testing nuance worth keeping straight
 
Clicking "Browse Scholarships" back to the list page, then into a different card, **does** unmount and remount `ScholarshipDetail` — a genuinely different test than the one above, since it goes through a different component in between. That test proves "fetch works per id," but doesn't specifically exercise the same-instance-different-params case `[id]` was built for — worth knowing the difference between "tested" and "correctly built for a case nothing in the UI triggers yet."
 
> One line: **two URLs matching the same route pattern (`/scholarships/:id`) keep the same component instance mounted and only change what `useParams()` returns — `useEffect(..., [id])` re-fires the fetch when that happens; `useEffect(..., [])` would silently keep stale data forever; and testing via a full page-to-page navigation doesn't exercise this same-instance case, since that path unmounts and remounts instead.**
 
---
 
## Lesson 66: Checking "Is This Object Empty" — `Object.keys().length`, a Live Strict-Mode Sighting, and React Fragments
 
**Date learned:** 2026-07-07
**Tags:** `objects` `debugging` `react-fragment` `strict-mode` `day-11`
 
Building a real "scholarship not found" state surfaced two real bugs in a row, plus a first live sighting of something only read about before.
 
### Bug 1 — `.length` doesn't exist on a plain object
 
```jsx
{scholarshipDetail.length === 0 ? (...)}   // ❌ always false
```
`.length` is array-specific; a plain object simply doesn't have one, so this reads `undefined`, and `undefined === 0` is always `false` — the "not found" branch could never fire, for any object, empty or full. Not a crash — just dead code that looks like it's guarding something while doing nothing.
 
### Bug 2 — passing the wrong thing into `Object.keys()`
 
```jsx
Object.keys(scholarshipDetail.length)   // ❌ Object.keys(undefined) → throws
```
Reading `.length` off the object *first* (still `undefined`), then handing that into `Object.keys()` — which requires a real object and cannot accept `undefined` at all — threw `TypeError: Cannot convert undefined or null to object`, right inside the `return` statement. Unlike a `.then()`/`.catch()` bug, there's no `catch` around JSX rendering — an uncaught render error takes down the *whole component*, which is why the entire page went blank instead of just showing wrong content.
 
**The actual fix** — pass the object itself into `Object.keys()`, then read `.length` off the *array* that comes back:
```jsx
{Object.keys(scholarshipDetail).length === 0 ? (...)}
```
 
### A live Strict Mode sighting
 
Testing a bad id produced the `404` and the caught error **twice**, back to back — this is React Strict Mode's dev-only double-invoke (Lesson 54) actually observed for the first time, not just read about: the effect genuinely ran twice for one logical mount.
 
### React Fragments — grouping siblings without adding a real DOM node
 
The "found" branch needed several sibling elements (`<h3>`, several `<p>`s) with nothing wrapping them — violating the one-root-element rule from Lesson 42. `<>...</>` (shorthand for `<React.Fragment>`) satisfies that rule without adding an actual extra element to the rendered HTML, unlike wrapping in another `<div>` would.
 
> One line: **plain objects have no `.length` — check emptiness with `Object.keys(obj).length === 0`, and watch argument order carefully, since `Object.keys(obj.length)` passes `undefined` in and throws, crashing the whole component's render with no `catch` to save it; a duplicated error in the console for one action is Strict Mode's dev-only double-invoke, not a real double-firing bug; and `<>...</>` groups sibling JSX elements to satisfy the one-root-element rule without adding a real node to the DOM.**
 
---
 
## Lesson 67: Commit Granularity, Revisited — Bundling Is Right When Changes Tell One Story
 
**Date learned:** 2026-07-07
**Tags:** `git` `commit-hygiene` `day-11`
 
Lesson 52 established splitting unrelated changes into separate `feat:`/`chore:`/`docs:` commits. Committing `Scholarships.jsx`, `ScholarshipDetail.jsx`, and `scholarshipController.js`'s response-wrapping change together, in one commit, might look like the same mistake Lesson 52 caught — but it isn't.
 
**The actual rule was never "always split"** — it's "does each commit tell one coherent, describable story." Lesson 52's `client_old/` deletion and docs update were unrelated to the login feature they got bundled with. Here, the three files are related *by construction*: the pages can't work without the controller's shape change, and the shape change was made specifically to support them. One commit, one true story — bundling was the correct call, not a shortcut.
 
> One line: **atomic commits mean "one describable story per commit," not "one file per commit" — when several files change *because of* the same feature, bundling them is accurate, not lazy; splitting only helps when the changes are genuinely unrelated.**
 
---
 
## Lesson 68: `ProtectedRoute` — a Frontend Route Guard That Mirrors Backend RBAC
 
**Date learned:** 2026-07-08
**Tags:** `react-router` `protected-route` `rbac` `frontend` `day-12`
 
Day 12 opened with the piece Lesson 39 had deliberately deferred back on Day 9: an actual route guard, now that a real second role exists to guard against.
 
### The gap it closes
 
Without a guard, React Router will happily render *any* matched component for *any* URL — it has no concept of "allowed here." A logged-in student typing `/admin/dashboard` into the address bar gets the component rendered; only the *data fetch inside it* eventually fails against the backend's `requireAdmin` (Lesson 34), producing a broken-looking page (empty boxes, console errors) rather than a clean redirect. The backend was always safe — this gap was a UX problem, not a security one.
 
### The final component
 
```jsx
// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getRoleFromToken } from "../services/auth";
 
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
 
  if (!token) {
    return <Navigate to="/login" />;
  }
 
  const role = getRoleFromToken(token);
  if (role !== requiredRole) {
    return <Navigate to="/login" />;
  }
 
  return children;
}
 
export default ProtectedRoute;
```
 
Wired around each protected route in `App.jsx`:
 
```jsx
<Route
  path="/my-tracker"
  element={
    <ProtectedRoute requiredRole="student">
      <MyTracker />
    </ProtectedRoute>
  }
/>
```
 
### Why this is the exact same shape as backend RBAC, on a different mechanism
 
| | Backend | Frontend |
|---|---|---|
| "Are you logged in?" | `verifyToken` | `if (!token)` |
| "Are you allowed to do *this*?" | `requireAdmin`/`requireStudent` | `if (role !== requiredRole)` |
| How a failure is expressed | `res.status(401).json(...)` | `return <Navigate to="/login" />` |
| How a pass is expressed | `next()` | `return children` |
 
Same two-question shape (Lesson 34/39), same ordering (authentication before authorization), but no request/response cycle exists on the client — there's no `next()`, no middleware chain, just a component's own function body picking one of two things to return. It's middleware in *role*, not in *mechanism* — worth stating precisely rather than calling it "frontend middleware" outright.
 
### Why it's reusable without knowing any page's name
 
`ProtectedRoute` never references `MyTracker` or `AdminDashboard` anywhere in its own code — it only ever deals with the generic `children` prop (Lesson 70) and whatever `requiredRole` string it's handed. *Which* page is being protected is decided entirely at each call site in `App.jsx`, not inside `ProtectedRoute` itself — the same separation of concerns as `requireStudent`/`requireAdmin` not needing to know which controller function they're guarding.
 
> One line: **`ProtectedRoute` closes the gap where React Router would otherwise render any matched page regardless of who's asking — it checks token existence then role match, in that order, returning `<Navigate to="/login" />` on either failure and `children` on success; it mirrors the backend's `verifyToken`/`requireAdmin` two-question shape conceptually, but is implemented as a plain component choosing a return value, not real middleware — the backend RBAC remains the actual security boundary, this is strictly a UX layer on top of it.**
 
---
 
## Lesson 69: `navigate()` vs. `<Navigate>` — Imperative Action vs. a Render-Time Answer
 
**Date learned:** 2026-07-08
**Tags:** `react-router` `usenavigate` `navigate-component` `render-vs-side-effect` `day-12`
 
Building `ProtectedRoute` surfaced real confusion between two same-sounding tools from `react-router-dom` that solve genuinely different-shaped problems — worth separating precisely rather than treating as two spellings of one idea.
 
### `useNavigate()` — call it, in reaction to something that already happened
 
```jsx
const navigate = useNavigate();          // a function, handed to you
navigate("/my-tracker");                 // called inside a handler, after an event
```
This is the tool already used in `Login.jsx`'s post-login redirect: an event occurs (login request resolves), and *in response*, code imperatively tells the router to move. It belongs inside an event handler or a `useEffect` — somewhere that runs *after* a render has already completed.
 
### `<Navigate>` — return it, as the answer to "what renders here"
 
```jsx
if (!token) {
  return <Navigate to="/login" />;
}
```
No event occurred. Nothing was clicked. The component is being asked, for the first time, "what should appear in your spot?" — and the answer, in this branch, is simply *a redirect* rather than the real content. `<Navigate>` is a real component (same category as `<div>` or `<MyTracker />` — see Lesson 70's broader point about what "component" means), returned as JSX during the component's own normal render pass, not called as a side effect afterward.
 
### Why the imperative version is actually unsafe here
 
Calling `navigate(...)` directly, loose in a component body during render (not inside a handler or effect), tries to trigger a URL change — and therefore a re-render of whatever's listening to that URL (`Routes`) — **while the current component is still mid-render**. React disallows updating one component while a different one is still being computed, and will warn accordingly (something like *"Cannot update a component while rendering a different component"*). This is the same category of mistake as an unprotected `apiFetch` sitting bare in a component body (Lesson 54) — a side effect placed somewhere React never signed up to run it safely. Wrapping it in `useEffect` avoids the warning but introduces a different cost: the real content renders first, then the effect fires and redirects a moment later — a visible flash of content that shouldn't have been shown. `<Navigate>` resolves in the same render pass, with no flash and no separate effect.
 
### The precise contrast
 
| | `navigate("/x")` | `<Navigate to="/x" />` |
|---|---|---|
| What it is | A function, called | JSX, returned |
| When it's safe | Inside a handler, or `useEffect` — *after* a render | As a component's own return value — *during* its render |
| Mental cue | "Something just happened — go there now." | "This is what belongs here instead of the real content." |
 
> One line: **`useNavigate()` gives you a function to *call* in reaction to an event, after a render has completed; `<Navigate>` is a component you *return* as the answer to "what renders here," resolved within the same render pass — calling `navigate()` bare in a component body tries to update one component while another is still rendering (the same class of bug as an unguarded fetch, Lesson 54), while `<Navigate>` sidesteps it entirely by never touching anything outside its own return value.**
 
---
 
## Lesson 70: `children` Is Just an Auto-Populated Prop — What Makes a Wrapper Component Reusable
 
**Date learned:** 2026-07-08
**Tags:** `react` `jsx` `props` `children` `fundamentals` `day-12`
 
Understanding `ProtectedRoute` required backing all the way up to what "component" and "prop" actually mean underneath the JSX syntax — worth writing down precisely, since the syntax alone obscures how ordinary the mechanism is.
 
### JSX is not a separate language
 
`<div>Hello</div>` is shorthand that a build tool (Vite) converts, before the browser ever sees it, into `React.createElement("div", null, "Hello")` — a plain function call building a description of what should appear. Every "tag" — `<div>`, `<MyTracker />`, `<BrowserRouter>`, `<Route>`, `<Navigate>` — is JSX for the same kind of function call underneath. There is no separate category of "router tags" versus "real components"; `BrowserRouter`, `Routes`, `Route`, and `Navigate` are ordinary components, just ones written by the `react-router-dom` authors rather than by you — same rule (a function returning JSX), different author, different job.
 
### One props object, sometimes destructured
 
A component technically always receives one single object — conventionally called `props`. Writing:
```jsx
function ProtectedRoute({ children, requiredRole }) { ... }
```
is destructuring shorthand for:
```jsx
function ProtectedRoute(props) {
  const children = props.children;
  const requiredRole = props.requiredRole;
}
```
— the exact same pattern as `const { status, notes } = req.body` on the backend: pulling named fields out of one incoming object, rather than a new mechanism specific to React.
 
### `children` specifically — whatever got nested inside the tags
 
React has one built-in rule: whatever JSX is nested *between* a component's opening and closing tags gets passed to that component automatically as a prop literally named `children` — never written explicitly as `children={...}` by hand. So in:
```jsx
<ProtectedRoute requiredRole="student">
  <MyTracker />
</ProtectedRoute>
```
`children`, inside `ProtectedRoute`'s own function body, is concretely `<MyTracker />` for *this* usage. A different call site nesting `<AdminDashboard />` instead gives `ProtectedRoute` a completely different `children` value on that render — same component, same code, different content each time, because `children` is just a stand-in for "whatever this particular caller handed me."
 
### Why this is *the* reason `ProtectedRoute` is reusable
 
`ProtectedRoute` never needs an `if (childrenIsMyTracker) ...` branch — that would defeat the entire point. Its job (return `children`, once both checks pass) is identical no matter what page it's guarding; *which* page is decided fresh, at each call site, in `App.jsx` — never inside `ProtectedRoute` itself.
 
> One line: **JSX is syntax sugar for `React.createElement(...)` calls, and every "tag" — including router-provided ones like `<Route>` or `<Navigate>` — is the same category of component as one you wrote yourself; `props` is one object per component, and `children` is simply the prop React auto-fills with whatever JSX got nested between a component's tags — which is exactly what lets `ProtectedRoute` stay generic across every page it guards, never needing to know a single page's name.**
 
---
 
## Lesson 71: The `requireRole`/`requiredRole` Typo — a Silent Prop Mismatch That Quietly Disabled a Guard
 
**Date learned:** 2026-07-08
**Tags:** `bug` `props` `typo` `silent-failure` `rbac` `day-12`
 
Wiring `ProtectedRoute` around all three admin-only routes surfaced a real bug, caught by inspection rather than a crash — worth tracing fully, since it's the same family of mistake as Lesson 51's bare-identifier bug, just wearing a JSX costume.
 
### The bug, as actually written
 
```jsx
<Route
  path="/admin/scholarships/:id/edit"
  element={
    <ProtectedRoute requireRole="admin">   {/* ❌ missing the "d" */}
      <EditScholarship />
    </ProtectedRoute>
  }
/>
```
 
`ProtectedRoute` is defined as `function ProtectedRoute({ children, requiredRole })` — it destructures a prop named `requiredRole`. This call site supplied `requireRole` instead — a different string, as far as JavaScript is concerned, not a fuzzy near-match. No error, no warning; JSX props are just object keys, and a missing key resolves to `undefined` silently.
 
### Tracing the consequence all the way through
 
For *any* logged-in user hitting this specific route (admin or not):
1. `token` exists → first check (`!token`) is `false` → passes silently, nothing returned.
2. `role = getRoleFromToken(token)` → a real value, e.g. `"student"` or `"admin"`.
3. `requiredRole`, for this call site only, is `undefined` (the typo'd prop was never read).
4. `if (role !== requiredRole)` → e.g. `if ("student" !== undefined)` → `true` in every real case, since `role` is never literally the string `undefined` → the guard would actually **always redirect**, for admin and student alike, on this one route only — the opposite failure mode from "no guard at all," but still wrong, and would have been easy to mistake for "working" the moment an admin test happened to also fail for an unrelated reason.
### Caught by comparison, not by running it
 
The fix came from lining up all four `<ProtectedRoute>` call sites side by side and noticing one spelled the prop differently — the same debugging move as literally reading a `catch` block's actual error text (Lesson 51) rather than trusting "no crash" as proof of correctness. A typo'd prop name is invisible at a glance and produces no runtime error of its own; it only shows up as *wrong behavior*, discoverable by deliberately tracing what a mismatched name resolves to (`undefined`), not by staring at the line that has the typo in isolation.
 
> One line: **a JSX prop name is just an object key — passing `requireRole` where `requiredRole` is destructured doesn't error, it silently resolves to `undefined`, and depending on the comparison this can either bypass a guard entirely or (as here) make it fail closed for everyone; catching this required lining up all call sites and comparing prop names directly, the same "read the actual text, don't trust the absence of a crash" discipline as Lesson 51.**
 
---
 
## Lesson 72: Proving a Guard Works Means Watching Every Branch, Not Just One
 
**Date learned:** 2026-07-08
**Tags:** `testing` `debugging-discipline` `rbac` `day-12`
 
`ProtectedRoute` has two independent checks, each with two outcomes — meaning four real combinations exist, not one "does it work" question. This session was the first time all four were actually watched deliberately, rather than inferred from one successful click.
 
### The four combinations, and what each one actually proves
 
| Token | Role vs. `requiredRole` | Expected | What it specifically proves |
|---|---|---|---|
| None | — | Redirect to `/login` | Check 1 alone, in isolation |
| Valid | Matches | Real page renders | Both checks pass correctly together |
| Valid | Doesn't match | Redirect to `/login` | Check 2 fires even when check 1 already passed — the subtler branch, since a real token exists and only the role comparison is doing the work |
| — | — | (mirror-image of the row above, other role) | Confirms the guard isn't accidentally one-directional |
 
### Why "I think it's working" isn't the same claim as "I tested it"
 
Deleting the `token` key from `localStorage` and directly navigating to a guarded URL — rather than just clicking around and noticing nothing broke — is what turns "seems fine" into an actual, falsifiable observation: a known starting state, deliberately set, with a specific predicted outcome checked against what actually happened. This is the same discipline already established for RBAC on the backend (Lessons 32/34's "watch both branches" principle) and for two-branch conditionals generally (Lesson 60's login-redirect testing) — carried forward correctly into the frontend guard rather than relearned from scratch.
 
### The gap still open
 
Only three of the four rows above were actually observed this session (no token; admin token on an admin route; student token on both an admin route and `/my-tracker`). The fourth — an admin token deliberately tested against `/my-tracker` — is the mirror case and hasn't been watched directly yet, though the mechanism is now understood well enough to predict it correctly on paper.
 
> One line: **a guard with two independent checks has (at minimum) four real combinations to verify, not one — the subtlest branch is usually "has a valid token, but the wrong one," since that's the case a naming bug (Lesson 71) can most easily disguise as working; deliberately setting a known state (e.g. actually deleting the token) and checking the specific predicted outcome is what makes a test a real observation rather than an inference from "nothing looked broken."**
 
---
 
## Lesson 73: A New Ownership-Filtered Route — `GET /scholarships/mine`, Naming It, and Route-Ordering Again
 
**Date learned:** 2026-07-08
**Tags:** `rest` `route-naming` `route-order` `ownership-filter` `day-12`
 
Building `AdminDashboard` needed a route that didn't exist yet: "scholarships posted by *me*, the logged-in admin" — not all scholarships (the existing public `GET /scholarships`), not one scholarship by id (`GET /scholarships/:id`).
 
### Why the existing `GET /scholarships` couldn't be reused
 
Filtering the *existing* public endpoint's results down in the browser was considered and rejected on two grounds, both worth being able to state precisely: **security** — `myOwnId` would have to come from somewhere in that version, and any client-suppliable source (a hardcoded value, a URL param) is spoofable, echoing Lesson 56's ownership-filter principle exactly; and **efficiency** — fetching every scholarship in the table just to discard most of them client-side wastes a request on data that's immediately thrown away.
 
### The naming decision
 
Landed on `GET /scholarships/mine` over alternatives (`/scholarships/my-listings`, `/admin/scholarships`) for a specific reason: every existing scholarship route (`POST /scholarships`, `PUT /scholarships/:id`) is already organized by **resource** (what thing it's about), with the role restriction living in middleware, not the URL — `POST /scholarships` is admin-only today but still lives under `/scholarships`, not `/admin/scholarships`. `/mine` keeps that same consistency; it's still fundamentally a question about the `scholarships` resource, just filtered differently. A `/admin/...`-prefixed backend route would have been the *only* route organized by role instead of resource — a new, inconsistent pattern, not a neutral alternative.
 
### The route-ordering trap, hit again in a new spot
 
```javascript
router.get("/", getAll);
router.get("/mine", verifyToken, requireAdmin, getMyScholarships);
router.get("/:id/applications", verifyToken, requireAdmin, getApplicants);
router.get("/:id", getOne);
```
 
`/mine` has to sit **above** `/:id` for the same reason as Lesson 25's original route-ordering rule: `:id` is a named wildcard, matching *any* string in that URL position — including the literal word `"mine"`. If `/:id` came first, `GET /scholarships/mine` would match it, `getOne` would run, `req.params.id` would literally equal the string `"mine"`, and the query would silently return zero rows (a `404`-shaped "not found," not a crash) instead of the admin's actual scholarship list — the same "quiet, not loud" failure shape as several other bugs this project has hit.
 
> One line: **a route needing "just the current user's own resources" is a new endpoint, not a client-side filter on an existing public one — `myOwnId` must come from `req.user.userId`, never the client; naming it `/scholarships/mine` (not `/admin/scholarships`) keeps the existing resource-based URL convention intact, since role restriction already lives in middleware, not the path; and any new literal path added to a router file still has to sit above any pre-existing `:id`-style variable route, or the wildcard will silently swallow it.**
 
---
 
## Lesson 74: Two Features That Share a Filter Pattern Aren't the Same Feature — Applicants-per-Scholarship vs. Scholarships-per-Admin
 
**Date learned:** 2026-07-08
**Tags:** `mvc` `feature-boundaries` `day-12`
 
Real confusion surfaced momentarily between two backend pieces that both filter by `posted_by = adminId` — worth writing down the distinction precisely, since "same filter pattern" was mistaken for "same feature."
 
### The two, side by side
 
| | `getApplicantsByScholarshipId` (already built, Day 7–8) | `getScholarshipsByAdmin` (new, this session) |
|---|---|---|
| Answers | "For scholarship #5 specifically, who applied?" | "Which scholarships have I posted, across the board?" |
| Tables touched | `applications` JOIN `users` JOIN `scholarships` | `scholarships` alone, no JOIN |
| Feature | View Applicants (CRUD map's admin "Read") | The data behind `AdminDashboard`'s main list |
| Input | one specific `scholarshipId` **and** `adminId` | just `adminId` |
 
Building the new function doesn't touch, replace, or duplicate the old one — they'll likely end up linked later (a "View Applicants" button per row on `AdminDashboard`, leading to a screen that calls the existing, already-tested function), but that link is separate, later work, not something resolved by building `AdminDashboard` itself.
 
> One line: **two backend functions can share an identical ownership-filter shape (`WHERE posted_by = $adminId`) while answering completely different questions over different tables — "who applied to this one" and "which ones are mine" are separate features that happen to reuse the same security pattern, not the same feature built twice.**
 
---
 
## Lesson 75: Derived State From `.filter()` — Splitting One List Into Sections Without New `useState`
 
**Date learned:** 2026-07-08
**Tags:** `react` `useState` `derived-state` `filter` `day-12`
 
`AdminDashboard` needed to split one `scholarships` array into "Active" and "Closed" sections. The instinct to reach for a *second* piece of state (e.g. `useState` for each section) was avoided correctly, on the first attempt, without it needing to be pointed out.
 
### The pattern
 
```jsx
const activeScholarships = scholarships.filter((sch) => sch.status === "open");
const closedScholarships = scholarships.filter((sch) => sch.status === "closed");
```
 
These two lines sit directly in the component body — not inside `useState`, not inside `useEffect` — because they're not *new information*. They're a pure **computation on** data that's already in state (`scholarships`). Every time `scholarships` changes and the component re-renders, these two lines simply re-run, fresh, producing an always-current split with zero extra state to keep in sync.
 
### Why this matters for what comes later (Lesson 78)
 
Because the split is *derived*, not stored, updating `scholarships` correctly after a Close/Reopen action (via `setScholarship(...)`) automatically moves the affected item between sections on the next render — no additional code needed to "move" anything. The section membership was never really separate data; it was always just a live view over `scholarships`. This is the same principle as `Object.keys(scholarshipDetail).length === 0` (Lesson 66) not needing its own tracked boolean — it's a computation performed fresh each render, not a fact that needs remembering.
 
> One line: **when new information is fully computable from state you already have, compute it directly in the component body (a plain `.filter()`, no `useState`/`useEffect`) rather than duplicating it into separate state — this keeps it automatically in sync forever, since it re-runs fresh on every render rather than needing to be manually updated whenever the source state changes.**
 
---
 
## Lesson 76: Honest Empty States Have to Live at the Level Where the Split Happens
 
**Date learned:** 2026-07-08
**Tags:** `ux` `empty-states` `spec-compliance` `day-12`
 
Splitting `scholarships` into two sections (Lesson 75) created a real gap: the original top-level check (`scholarships.length === 0 ? <p>No scholarship posted</p> : ...`) only covers "nothing posted at all" — it says nothing about the case where *some* scholarships exist but one section is empty (e.g. 3 posted, all closed). In that case `scholarships.length` is `3`, the top-level check passes, both sections render, and "Active Scholarships" shows a heading followed by silence — visually identical to a bug (failed fetch, broken render) with no way for the person looking at the screen to tell the difference.
 
### The fix, and what it made redundant
 
Each section needs its **own** empty-state check, scoped to its own filtered array:
```jsx
{activeScholarships.length === 0 ? (
  <p>No Active Scholarships</p>
) : (
  <ul>{/* .map() */}</ul>
)}
```
Once both sections have honest, independent empty states, the original top-level `scholarships.length === 0` check became genuinely redundant — if there are zero scholarships total, both section-level checks fire on their own and communicate that together; a third, higher-level check saying the same thing added nothing. It was correctly removed rather than left in "just in case."
 
Ties directly to the spec's own stated requirement (`scholarship-tracker-ph.md`'s error-handling section: *"Empty states → 'No scholarships found' message, not a blank screen"*) — that requirement doesn't stop applying just because a list got split into two.
 
> One line: **an empty state has to be checked at whatever level the person is actually looking — splitting one list into sections means each section needs its own "nothing here" message, or a technically-correct top-level check can still leave an indistinguishable-from-broken blank space one level down; once every section speaks honestly for itself, a redundant top-level catch-all can be removed rather than kept as unnecessary belt-and-suspenders.**
 
---
 
## Lesson 77: A Button's Label Is a Promise — Matching UI Wording to What the Backend Actually Does
 
**Date learned:** 2026-07-08
**Tags:** `ux` `soft-delete` `naming` `day-12`
 
The obvious first label for the CRUD map's "Delete listing" action was **"Delete."** Reasoning through what the backend route (`DELETE /scholarships/:id`) *actually* does surfaced a mismatch worth catching before shipping it.
 
### The mismatch
 
Per the schema and Lesson 33's confirmed behavior, `DELETE /scholarships/:id` is a **soft** delete — it flips `status` to `'closed'`, and the row stays in the table, still returned by `WHERE posted_by = $1` with no status filter. An admin clicking a button labeled "Delete" would reasonably expect the row to *vanish*. Instead it would remain, visible, in the exact same list — which is confusing at best, and at worst reads as a broken feature ("I deleted it and it's still here").
 
### The fix: separate sections, honest verb
 
Once `AdminDashboard` split into Active/Closed sections (Lesson 75/76), the honest label became obvious: **"Close"** for moving an active listing to closed (matches the schema's actual `status` value), and **"Reopen"** for the reverse — not "Delete" reused with opposite meaning in the closed section, which would have been actively misleading (clicking "Delete" on an already-closed item, expecting removal, but nothing removable exists).
 
> One line: **a button's label is a claim about what will happen when it's clicked — when the backend's real behavior is a soft delete (row survives, just recategorized), the honest UI verb is "Close"/"Reopen," not "Delete," because "Delete" promises something (disappearance) that never actually occurs; catching this required tracing the button's label against the actual database effect, not just against the CRUD map's generic action name.**
 
---
 
## Lesson 78: Updating State After a User Action — Plain Click-Handlers, Not `useEffect`, and Refetch vs. Local Reconstruction
 
**Date learned:** 2026-07-08
**Tags:** `react` `useeffect` `event-handlers` `state-update` `day-12`
 
Wiring the Close/Reopen buttons was the first time this project needed to update state **after a user-triggered action succeeds**, rather than once on mount — a genuinely new shape, easy to reach for the wrong tool on.
 
### Why this isn't a `useEffect` problem
 
The instinct to modify the existing fetch-on-mount `useEffect`'s dependency array (adding `scholarships` to it, to "make it run again after a change") was considered and correctly rejected by tracing it fully: adding `scholarships` to the dependency array would create the exact infinite-loop shape from Lesson 54, just via the dependency array instead of a bare unprotected call — the effect fetches → calls `setScholarship` → changes `scholarships` → which is now a dependency → fires the effect again → forever.
 
The actual fix: recognize that a button click is a **user-triggered event**, not a lifecycle moment — the same category as `Login.jsx`'s `handleSubmit`, which was never inside a `useEffect` either. A plain function, defined in the component body, called via `onClick`, handles the request and the resulting state update directly:
 
```jsx
async function handleClose(scholarshipId) {
  try {
    await apiFetch(`/scholarships/${scholarshipId}`, { method: "DELETE" });
 
    const updatedScholarships = scholarships.map((sch) =>
      sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
    );
 
    setScholarship(updatedScholarships);
  } catch (error) {
    console.error("Failed to close scholarship: ", error);
  }
}
```
The existing mount-`useEffect` doesn't change at all — it keeps doing its one job (initial load), completely separate from this new function.
 
### Refetch (Approach A) vs. local reconstruction (Approach B)
 
Both approaches start identically (call the mutating request, wait for it to succeed) and both end in a rerender (any call to `setScholarship(...)` triggers one — Lesson 54's one true trigger). They differ in exactly one place: where the *new array* handed to `setScholarship` comes from.
 
| | Requests fired | Source of the new array | Risk |
|---|---|---|---|
| **A — refetch** | 2 (the mutation, then `GET /scholarships/mine` again) | The server, freshly | None — guaranteed to match reality |
| **B — local reconstruction** | 1 (just the mutation) | Built by hand from state already held | If built incorrectly, the UI can *look* correct while silently diverging from the database |
 
Chosen: **B**, since it fits the derived-state pattern (Lesson 75) perfectly — updating `scholarships` correctly automatically moves the item between sections with zero extra code, no second network round-trip needed. The tradeoff accepted knowingly: correctness now depends on building the local update correctly, not on re-asking the server.
 
### The object-spread bug and its fix, and why order matters
 
First attempt used invalid object-literal syntax (`{...sch, status = 'closed'}` — `=` instead of `:`, an assignment operator where a key/value pair was needed). Corrected to `{ ...sch, status: "closed" }`. Worth internalizing precisely *why* this produces the right result: spreading `...sch` first copies every existing field (including its old `status`) into the new object, and the explicit `status: "closed"` written **after** it in the same literal **overwrites** that copied value, because JavaScript's rule for repeated keys in one object literal is "last one wins." Reversing the order (`{ status: "closed", ...sch }`) would silently do the opposite — the spread's old `status` would come last and overwrite the explicit one.
 
> One line: **updating state in response to a user action belongs in a plain function called via `onClick`, never inside `useEffect` (which exists for lifecycle moments, not events) or by adding the changed state to an effect's dependency array (which reintroduces Lesson 54's infinite-loop shape); choosing to reconstruct the new array locally rather than refetching trades a guaranteed-correct server round-trip for a faster, no-extra-request update whose correctness now depends entirely on getting the local reconstruction right — including object-spread key order, since a later key in the same literal always overwrites an earlier one.**
 
---
 
## Lesson 79: A Pre-Existing Gap Surfaces — `status` Destructured but Never Passed Through `update`/`updateScholarship`
 
**Date learned:** 2026-07-08
**Tags:** `bug` `put` `full-replacement` `silent-gap` `day-12`
 
Building `handleReopen` (sending `{ ...sch, status: "open" }` via `PUT`, per the project's full-replacement convention, Lesson 35) exposed a genuine, pre-existing gap in the backend — not a new bug introduced this session, just never triggered until now, since nothing had previously needed to change a scholarship's `status` through `PUT`.
 
### Tracing it fully, in two separate places
 
**Controller (`update`):** destructured `status` from `req.body` — a real variable, holding the sent value — but the call to `updateScholarship(...)` below it never included `status` as an argument. No error is thrown for destructuring a variable and never using it; it simply has no effect on anything downstream.
 
**Model (`updateScholarship`):** even had the controller passed it, the function's own parameter list had no `status` parameter, and the SQL's `SET` clause didn't mention the `status` column at all. The value would have nowhere to go even one layer deeper.
 
### The fix, and where it was placed
 
`status` added as a new parameter **appended at the end** of `updateScholarship`'s parameter list (rather than inserted mid-list) — a deliberate placement choice that meant only the *new* placeholders (`$8`, `$9`) needed adding, with zero renumbering of the seven already-correct existing ones. The controller's call to `updateScholarship(...)` then had `status` added as its final argument, matching the model's new order.
 
### The validation gap this exposed, and the fix
 
`update` had no validation on `status` at all — unlike `create`'s existing `if (!title || !organization || !deadline)` check. Added, matching the same early-fail-fast placement (before the `getScholarshipById` existence check, since there's no point querying the database to check "does this exist" if the request body is already malformed):
```javascript
if (!status || (status !== "open" && status !== "closed")) {
  return res.status(400).json({ error: "invalid status" });
}
```
(Noted, not fixed: `!status` is technically redundant here, since `status !== "open" && status !== "closed"` already evaluates `true` on its own when `status` is `undefined`/falsy — left as a readability choice, not a bug.)
 
> One line: **a variable destructured from `req.body` but never passed to the next function down the chain doesn't error — it silently has no effect, the same "quiet, not loud" failure shape as several bugs this project has hit before; this specific gap (missing `status` support in `update`) existed unnoticed since Day 5–6 because nothing had needed to change status via `PUT` until this session's Reopen feature actually exercised that path — a reminder that untested code paths can carry real gaps regardless of how long ago they were written.**
 
---
## Part 4 Cheatsheet Additions
 
| Term | One-line definition |
|---|---|
| `SERIAL` sequence | A separate, one-directional counter object backing an auto-increment column — never rewinds on delete, gaps are normal and expected |
| `ALTER SEQUENCE ... RESTART WITH n` | Resets what the *next* insert will use, without touching any existing row |
| `pg_get_serial_sequence('table', 'col')` | Asks Postgres directly for a sequence's real name instead of assuming the `table_col_seq` naming convention |
| render vs. side effect | Rendering should be a pure calculation of "what JSX given current state"; a side effect (network call, timer, subscription) is different work that belongs in `useEffect`, not the component body |
| React Strict Mode double-invoke | A dev-only behavior where React calls a component function twice in a row for one logical render, specifically to expose unprotected side effects early |
| defining vs. calling a function | Assigning a function to `onChange` during render only *defines* it — it isn't *called* until a real external event (a keystroke) fires it; this is why controlled inputs never loop |
| module scope | Variables/functions declared in one file (e.g. `apiFetch`) are invisible everywhere else unless explicitly exported/imported — including the browser console's global scope |
| ownership filter from `req.user` | A protected route's row-filtering value (e.g. `student_id`) should come from the verified token (`req.user.userId`), never from a client-supplied id in the URL/body |
| JOIN column collision | When two joined tables share a column name (e.g. both have `status`), `SELECT *` on either side lets one silently overwrite the other in the merged object — alias with `AS` |
| `key` prop | A stable, unique value (a real database `id`) that lets React tell "same item, possibly moved" apart from "new item" across re-renders of a list — never use array position |
| implicit vs. explicit arrow return | `(x) => expr` or `(x) => (expr)` auto-returns (parens are just readability grouping); `(x) => { return expr; }` requires an explicit `return` — only two shapes exist |
| `atob()` | Browser built-in that reverses base64 encoding back into a plain string — used to read a JWT's payload chunk client-side |
| client-side JWT decode | Reading a token's payload in the browser (e.g. for UX routing) is only ever a convenience — it proves nothing to the server and never replaces a real backend role guard |
| response shape consistency | Whether an endpoint returns a bare array or a `{ key: [...] }` wrapped object matters less than picking one convention and using it consistently across all endpoints |
| `useParams()` | The frontend mirror of `req.params` — reads named values (e.g. `:id`) out of the current URL; always returns strings, never numbers |
| honest "not-loaded-yet" state | An initial `useState` value should accurately represent "nothing here yet," not just avoid crashing — `{}` for an eventual object beats both `""` and `null` |
| same route, different params | Two URLs matching the same route pattern (e.g. `/scholarships/3` and `/scholarships/7`) keep the same component instance mounted — only `useParams()`'s return value changes, which is exactly what a `[id]` dependency array is for |
| `Object.keys(obj).length === 0` | The correct way to check if a plain object is empty — objects have no `.length` of their own; convert to an array of keys first, then check *that* array's length |
| React Fragment `<>...</>` | Groups multiple sibling JSX elements to satisfy the one-root-element rule, without adding an extra node to the actual rendered DOM (unlike wrapping in a `<div>`) |
| `ProtectedRoute` | A reusable component wrapping a page: checks token existence then role match, returns `<Navigate to="/login" />` on either failure, else returns `children` — the frontend's conceptual (not mechanical) mirror of backend RBAC |
| `useNavigate()` vs. `<Navigate>` | The first is a function you *call* after an event, inside a handler or `useEffect`; the second is a component you *return* as part of a normal render — calling `navigate()` bare in a component body risks updating one component mid-render of another |
| JSX under the hood | All JSX — including library tags like `<Route>`/`<Navigate>` — compiles to `React.createElement(...)` calls; there's no separate "framework tag" category |
| `children` prop | Whatever JSX is nested between a component's opening/closing tags, auto-passed in as a prop named `children` — the mechanism that lets a wrapper like `ProtectedRoute` stay generic across every page it guards |
| silent prop-name typo | A misspelled JSX prop (e.g. `requireRole` vs. `requiredRole`) doesn't error — it resolves to `undefined` on the receiving end, which can silently disable or invert a guard depending on the comparison it feeds |
| testing a two-check guard | A guard with 2 independent checks has ≥4 real combinations to verify; the subtlest is usually "valid token, wrong role," since a naming bug can most easily disguise itself there as "seems to work" |
| `/scholarships/mine` | New ownership-filtered route, named to match the existing resource-based (not role-based) URL convention; must sit above `/:id` in the router file or the wildcard silently swallows it |
| derived state via `.filter()` | Compute a split/subset directly in the component body from state already held — no new `useState`/`useEffect` needed; it re-runs fresh every render, automatically staying in sync |
| scoped empty states | An empty-state check needs to live at whatever level a list actually gets split — a section-level `.filter()`'d array needs its *own* "nothing here" message, not just a top-level one |
| honest button labels | A button's label is a claim about what will happen — "Delete" on a soft-delete backend (row survives, just recategorized) is misleading; label it for what actually happens ("Close"/"Reopen") |
| post-action state update | Updating state after a user action (button click) belongs in a plain `onClick` handler, never `useEffect` — adding changed state to an effect's dependency array recreates Lesson 54's infinite loop |
| refetch vs. local reconstruction | After a mutation succeeds, either re-fetch the list from the server (guaranteed correct, costs a request) or rebuild it locally via `.map()`/spread (instant, but correctness depends on getting the reconstruction right) |
| object-spread key order | `{ ...obj, key: newVal }` overwrites `key` because it comes last in the literal; `{ key: newVal, ...obj }` would let the spread silently overwrite it instead — order matters, last key wins |
| destructured-but-unused variable | Pulling a field out of `req.body` and never passing it to the next function down the chain doesn't error — it silently has no effect, discoverable only by tracing the full call chain, not by running it once |
 
---
 
*Part 4 updated: 2026-07-08 (Lessons 73–79 added, Day 12 continued: building `AdminDashboard` end to end — a new ownership-filtered route (`GET /scholarships/mine`), its naming rationale (resource-based, matching existing convention) and route-ordering placement above `/:id`; distinguishing it from the already-built "view applicants per scholarship" feature despite both sharing a `posted_by` filter; splitting the fetched list into Active/Closed sections via `.filter()` computed live in the component body rather than new state; giving each section its own honest empty state and removing the now-redundant top-level check; renaming the "Delete" action to "Close"/"Reopen" once its actual soft-delete behavior was traced through; and building `handleClose`/`handleReopen` as plain click-handlers — not `useEffect` — choosing local state reconstruction over a refetch, tracing an object-spread key-order bug, and surfacing then fixing a genuine pre-existing gap where `status` was destructured in `update` but never passed through to `updateScholarship` or the SQL itself.)*
 
*Part 4 updated: 2026-07-08 (Lessons 68–72 added, Day 12: building `ProtectedRoute`, a reusable frontend route guard mirroring backend RBAC's two-question shape (token exists? role matches?) via `<Navigate>` on failure and `children` on success; the precise distinction between `useNavigate()` (call after an event) and `<Navigate>` (return during render), and why calling `navigate()` bare in a component body risks updating one component mid-render of another; a from-first-principles pass on JSX-as-`createElement`-calls and `children` as an auto-populated prop, which is what makes `ProtectedRoute` reusable without knowing any page's name; a real silent bug — a `requireRole`/`requiredRole` prop typo that resolved to `undefined` and disabled the guard on one route — caught by comparing call sites, not by a crash; and the testing discipline of deliberately watching every branch of a two-check guard, not just the one that happened to pass first.)*
 
*Part 4 updated: 2026-07-07 (Lessons 64–67 added: `useParams` as the frontend mirror of `req.params` and choosing `{}` as an honest "not-loaded-yet" `useState` value over `""`/`null`; why a detail page's fetch needs `[id]` in its dependency array — two URLs matching the same route pattern keep the same component instance mounted, only `useParams()`'s return value changes underneath it; two real bugs building an empty-object check — `.length` doesn't exist on plain objects, and `Object.keys(obj.length)` passes `undefined` in and crashes the whole render — plus a first live sighting of React Strict Mode's double-invoke and a note on React Fragments; and revisiting commit granularity — bundling several related files into one commit is correct when they tell one true story, not just "always split.")*
 
*Part 4 started: 2026-07-07 (Lessons 53–63: the `SERIAL`-sequence ticket-dispenser model; the full render-vs-side-effect mental model behind `useEffect`, including React Strict Mode's double-invoke and why controlled inputs never loop; module scope vs. global scope and where test code actually belongs; ownership filters coming from the verified token; the `getApplicationsByStudent` JOIN and its column-collision trap; `.map()`/`key`/arrow-function-shape fundamentals for list rendering; the `apiFetch`-already-parses-JSON bug; the JWT client-side-decode design decision for role-based redirects; the bare-array-vs-wrapped-object response-shape inconsistency; building `/scholarships` end to end; and dynamic `<Link>` routes via template literals.)*