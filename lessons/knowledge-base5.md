# Geoffrey's Software Engineering Knowledge Base — Part 5
 
> **Continuation of Parts 1–4.** Part 1 covered Lessons 1–23 (PostgreSQL, `pg`, Express, middleware, bcrypt, JWT concept, MVC layers, HTTP status codes, debugging). Part 2 covered Lessons 24–36 (nodemon/npm scripts, login, JWT anatomy, request lifecycle, RBAC middleware, scholarship/application CRUD, layered validation, the admin view-applicants feature with its first JOIN). Part 3 covered Lessons 37–52 (centralizing API calls, JWT storage tradeoffs, Vite scaffolding, JSX/component fundamentals, React Router, Hooks, the register/login flow, `useNavigate` and the SPA navigation model, and commit granularity). Part 4 covered Lessons 53–79 (the `/my-tracker` build, `useParams`, `ProtectedRoute` and frontend route guarding, and the full `AdminDashboard` build — a new ownership-filtered route, derived state via `.filter()`, honest empty states, and the Close/Reopen feature with its state-update and `status`-field bugs). This file picks up at Lesson 80, covering the rest of Day 12 (building `NewScholarship` and `EditScholarship`, a real production timezone bug, a reusable user-facing error pattern) and all of Day 13 (polish-phase bug fixes, then the full deployment of both backend and frontend, CORS in production, the `dev`/`main` branch workflow end to end, and an `import.meta.env`-based fix for `BASE_URL`). SkolarTrack, as originally scoped, was completed and deployed live by the end of this file.
>
> **How to use this file:**
> Upload this file (and Parts 1–4) to your Claude Project so every lesson is available in every chat.
> When you learn something new, tell Claude: *"Update my knowledge base with what we just learned about X"* and Claude will add it to the current part and give you an updated file to re-upload. Once a part file gets large (roughly 1,000+ lines), start a new part file instead of continuing to grow the current one.
 
---
 
## Table of Contents (Part 5)
 
80. [One Object as Form State — Computed Property Names for a Shared `handleChange`](#lesson-80-one-object-as-form-state--computed-property-names-for-a-shared-handlechange)
81. [The Function Form of a `useState` Setter — Building New State Out of the Old](#lesson-81-the-function-form-of-a-usestate-setter--building-new-state-out-of-the-old)
82. [Controlled vs. Uncontrolled Inputs — Why a Missing `value` Prop Looks Fine Until It Doesn't](#lesson-82-controlled-vs-uncontrolled-inputs--why-a-missing-value-prop-looks-fine-until-it-doesnt)
83. [The `pg` Date-Type Timezone Bug — a Plain `DATE` Silently Becoming a Timezone-Aware Instant](#lesson-83-the-pg-date-type-timezone-bug--a-plain-date-silently-becoming-a-timezone-aware-instant)
84. [A Reusable User-Facing Error Pattern — `useState` + `catch` + Conditional Render](#lesson-84-a-reusable-user-facing-error-pattern--usestate--catch--conditional-render)
85. [`EditScholarship` — Prefilled Controlled Forms, `async`/`useEffect` Don't Mix, and Trusting the Response Shape](#lesson-85-editscholarship--prefilled-controlled-forms-asyncuseeffect-dont-mix-and-trusting-the-response-shape)
86. [Loading / Error / Empty Are Three Different States — Plus a Reusable Retry Pattern](#lesson-86-loading--error--empty-are-three-different-states--plus-a-reusable-retry-pattern)
87. [Attaching an HTTP Status to a Thrown `Error`, and Branching on It (the 401 Redirect)](#lesson-87-attaching-an-http-status-to-a-thrown-error-and-branching-on-it-the-401-redirect)
88. [Rules of Hooks — a Hook Can Never Sit After an Early `return`](#lesson-88-rules-of-hooks--a-hook-can-never-sit-after-an-early-return)
89. [Stale Closures in Concurrent Async Handlers — the Functional `setState` Fix](#lesson-89-stale-closures-in-concurrent-async-handlers--the-functional-setstate-fix)
90. [Auditing for a Bug Pattern — What Actually Qualifies, and What Doesn't](#lesson-90-auditing-for-a-bug-pattern--what-actually-qualifies-and-what-doesnt)
91. [Whitespace-Only Input Isn't Empty — the `.trim()` Gap in Validation](#lesson-91-whitespace-only-input-isnt-empty--the-trim-gap-in-validation)
92. [Git Branching Before Deployment — Why `main` Stops Being a Safe Place to Commit Directly](#lesson-92-git-branching-before-deployment--why-main-stops-being-a-safe-place-to-commit-directly)
93. [Choosing a Free Backend Host — Why "the plan" Needed Re-checking Against Current Pricing](#lesson-93-choosing-a-free-backend-host--why-the-plan-needed-re-checking-against-current-pricing)
94. [Deploying a Monorepo Backend to Render — Root Directory, Build/Start Commands, Region](#lesson-94-deploying-a-monorepo-backend-to-render--root-directory-buildstart-commands-region)
95. [Environment Variables Don't Travel With Git — Configuring a Host's Dashboard Directly](#lesson-95-environment-variables-dont-travel-with-git--configuring-a-hosts-dashboard-directly)
96. [CORS, Properly Understood — a Browser-Enforced Read Permission, Not a Server Wall](#lesson-96-cors-properly-understood--a-browser-enforced-read-permission-not-a-server-wall)
97. [Guarding Against a Missing Env Var at Startup — Fail Loud, Not Cryptic](#lesson-97-guarding-against-a-missing-env-var-at-startup--fail-loud-not-cryptic)
98. [Deploying the Frontend to Vercel — Root Directory, the `dev`/`build` Script Mixup, and Branch Defaults](#lesson-98-deploying-the-frontend-to-vercel--root-directory-the-devbuild-script-mixup-and-branch-defaults)
99. [Deployment URL vs. Branch URL vs. Production Domain — Three Different Pointers](#lesson-99-deployment-url-vs-branch-url-vs-production-domain--three-different-pointers)
100. [Production Branch Tracking Is a Setting, Not Automatic — It Needs a Fresh Deploy to Take Effect](#lesson-100-production-branch-tracking-is-a-setting-not-automatic--it-needs-a-fresh-deploy-to-take-effect)
101. [`localhost`, DNS, and What "Hosting Your Own Server" Actually Requires](#lesson-101-localhost-dns-and-what-hosting-your-own-server-actually-requires)
102. [`import.meta.env.DEV`/`PROD` — Vite's Build-Time Constants, Not a Live Check](#lesson-102-importmetaenvdevprod--vites-build-time-constants-not-a-live-check)
103. [Root-Directory-Scoped Auto-Deploy — Why a Frontend-Only Push Didn't Redeploy the Backend](#lesson-103-root-directory-scoped-auto-deploy--why-a-frontend-only-push-didnt-redeploy-the-backend)
104. [The `main` + Feature-Branch Workflow — What `dev` Was For, and What Replaces It](#lesson-104-the-main--feature-branch-workflow--what-dev-was-for-and-what-replaces-it)
*(Lessons 1–23 are in Part 1. Lessons 24–36 are in Part 2. Lessons 37–52 are in Part 3. Lessons 53–79 are in Part 4.)*
 
---
 
## Lesson 80: One Object as Form State — Computed Property Names for a Shared `handleChange`
 
**Date learned:** 2026-07-08
**Tags:** `react` `forms` `usestate` `computed-property-names` `day-12`
 
`Register.jsx` (2–3 fields) used one `useState` per field. `NewScholarship` needed 7 fields (`title`, `organization`, `description`, `amount`, `slots`, `requirements`, `deadline`) — following the same pattern would mean 7 separate `useState` calls and 7 separate `onChange` handlers. Instead, the whole form's data was held as **one object**, matching the same shape the backend's `create` controller already destructures from `req.body`:
 
```jsx
const [formData, setFormData] = useState({
  title: "", organization: "", description: "", amount: "",
  slots: "", requirements: "", deadline: "",
});
```
 
### The problem this creates, and its solution
 
With one object, a single shared `onChange` needs to know *which* field changed, without 7 hardcoded handler functions. Two pieces solve it:
 
1. **Every `<input>` can carry a `name` attribute**, matching the corresponding key in `formData`: `<input name="title" value={formData.title} onChange={handleChange} />`. Inside the handler, `e.target.name` reads back exactly that string.
2. **JavaScript's computed property names** — `{ [someVariable]: someValue }` — let a variable's *value* become an object key, rather than a fixed literal name. If `name` holds `"title"`, then `{ [name]: value }` produces `{ title: value }`.
```jsx
function handleChange(e) {
  const { name, value } = e.target;
  setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
}
```
 
One function, reused by all 7 inputs — each input's own `name` attribute is what tells the shared handler which single key to update, leaving the other 6 untouched via the spread.
 
> One line: **when a form has many fields, one object in state (matching the shape the backend already expects) plus a single `handleChange` reading `e.target.name`/`e.target.value` and using a computed property name (`[name]: value`) replaces N separate `useState`/`onChange` pairs with one reusable pattern.**
 
---
 
## Lesson 81: The Function Form of a `useState` Setter — Building New State Out of the Old
 
**Date learned:** 2026-07-08
**Tags:** `react` `usestate` `function-form` `day-12`
 
Every prior `useState` setter call in this project passed a plain value directly (`setEmail(e.target.value)`). `handleChange` (Lesson 80) needed something different: building the *new* state **out of** the *old* state (spreading `...prevFormData` and overwriting one key) — which requires actually knowing what the current state is at the moment of the update.
 
### The mechanism
 
`useState` setters accept an alternate calling style: pass a **function** instead of a value.
```jsx
setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
```
React detects that the argument is a function (not a plain value) and, instead of storing "a function" as the new state, **calls that function itself**, automatically passing in the current state as the argument. Whatever the function **returns** becomes the actual new state. `prevFormData` isn't a special reserved name — it's just the parameter name chosen for "whatever value React handed me"; it works identically for any state shape (an array example: `setItems((prevItems) => [...prevItems, newItem])`).
 
> One line: **passing a function to a `useState` setter — rather than a plain value — lets React hand back the current state as that function's argument, which is the correct tool whenever the new state needs to be built *from* the old state (spreading and overwriting one field) rather than replacing it outright.**
 
---
 
## Lesson 82: Controlled vs. Uncontrolled Inputs — Why a Missing `value` Prop Looks Fine Until It Doesn't
 
**Date learned:** 2026-07-08
**Tags:** `react` `controlled-inputs` `forms` `debugging` `day-12`
 
A real question surfaced while wiring `NewScholarship`'s inputs: why does a controlled input need **both** `value={formData.title}` *and* `onChange={handleChange}` — what would actually go wrong if `value` were dropped, keeping only `onChange`?
 
### The two directions, and why dropping one is invisible at first
 
- `onChange` is the **input → state** direction: keeps `formData` in sync with what's typed.
- `value` is the **state → input** direction: lets React's state actually *control* what's visibly displayed.
Drop `value`, keep `onChange`, and the component becomes **uncontrolled**: the browser's own native text-box behavior takes over the visible display entirely, while `handleChange` still fires correctly and `formData` still updates correctly in state. **While typing, nothing looks wrong** — both "sides" happen to agree, purely by coincidence, because nothing has yet asked React to *push* a value back onto the screen.
 
### Where the crack actually shows
 
The cost only appears the moment something tries to use the **state → input** direction — e.g., resetting the form after a successful submit (`setFormData({...empty})`), or (directly relevant to the still-open `EditScholarship` page) pre-filling a form from fetched data. Without `value` wired up, calling `setFormData(...)` updates React's state correctly, but has **zero visible effect** on the input's displayed text — the two have quietly become disconnected sources of truth, even though casual typing made them look identical.
 
> One line: **a controlled input is a two-way binding — `onChange` keeps state in sync with what's typed, `value` lets state push back onto the display — and dropping `value` alone produces no visible symptom while typing, since the browser's native display and React's state coincidentally agree until the first moment something needs React to actively overwrite the display (a reset, or pre-filling from fetched data), which is exactly where an uncontrolled input silently fails.**
 
---
 
## Lesson 83: The `pg` Date-Type Timezone Bug — a Plain `DATE` Silently Becoming a Timezone-Aware Instant
 
**Date learned:** 2026-07-08
**Tags:** `bug` `pg` `postgres` `timezone` `date` `debugging` `day-12`
 
A real, live bug: `DOST Merit Scholarship`'s `deadline` displayed as `2026-09-13T16:00:00.000Z` on the frontend, while the database itself (confirmed directly via Neon's table view) genuinely stored `2026-09-14`. Traced fully, isolated correctly, and fixed at its actual root — not patched at the symptom.
 
### Isolating where the day actually went missing
 
Hitting `GET /scholarships/mine` directly in Thunder Client (bypassing React entirely) already showed the shifted value in the raw JSON response — proving the bug lived on the **backend**, somewhere between Postgres and the JSON response, not anywhere in React's rendering.
 
### The actual mechanism
 
A SQL `DATE` column (`deadline DATE`) represents a **plain calendar date** — no time-of-day, no timezone, ever. But `pg`'s default behavior, when reading a `DATE` column back, auto-converts it into a JavaScript `Date` **object** — and JavaScript's `Date`, built from separate year/month/day values with no explicit timezone, interprets those numbers as **midnight, in the server machine's own local timezone** (confirmed: UTC+8, Philippines).
 
So `2026-09-14` became "midnight, September 14, **Manila time**" — and when that instant is later converted to UTC for the JSON response (`Date.toISOString()`, called implicitly by `JSON.stringify`), UTC+8 midnight rolls back across the day boundary: `2026-09-14 00:00 (UTC+8)` minus 8 hours = `2026-09-13 16:00 (UTC)` — exactly the `2026-09-13T16:00:00.000Z` observed. The underlying *instant* was mathematically correct the whole time; the bug is that a plain date was ever converted into "a specific instant" at all, when it was never meant to represent one.
 
### Why this project doesn't need to solve the harder version of this problem
 
A real follow-up question worth recording: does "Sept 14 in the Philippines" versus "still Sept 13 elsewhere" matter here? Reasoned through and deliberately scoped out, the same way Lesson 35/38 named and accepted real limitations: a scholarship deadline is a **label** set by a Philippine organization (DOST, Ayala Foundation, etc.) for a Philippines-scoped platform — like a birthday or a national holiday, it's meant to be one fixed calendar date, not a globally-synchronized precise instant. Solving true cross-timezone deadline synchronization (relevant to things like flight bookings or live auctions) is explicitly out of scope; the actual goal was narrower: stop the date from being silently corrupted into the wrong label at all.
 
### The fix — global, not per-query
 
Considered per-query `::text` casts in SQL versus a single global `pg` configuration change, using the same global-vs-targeted reasoning as Lesson 28 (`express.json()` global, `verifyToken`/`requireAdmin` targeted). Chosen: global — since **no** query in this project ever wants `DATE` columns auto-converted into JS `Date` objects, a per-query cast risks being forgotten on any future query touching a date column, while a global fix protects every query, present and future, automatically.
 
```javascript
// config/db.js
const { types } = require("pg");
 
// DATE columns (OID 1082) should stay as plain strings — never
// auto-converted into JS Date objects, since that silently attaches
// a timezone interpretation to values that were never meant to have one.
types.setTypeParser(1082, (value) => value);
 
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```
 
Confirmed fixed by re-hitting the same `GET /scholarships/mine` request: `"deadline": "2026-09-14"`, exact plain string, matching the database precisely.
 
> One line: **`pg` auto-converts SQL `DATE` columns into JS `Date` objects using the server machine's own local timezone to interpret "midnight," and converting that instant to UTC for JSON can visibly shift the printed calendar day backward — the fix is a single global `pg.types.setTypeParser(1082, value => value)` in the shared `db.js`/pool config, which stops the conversion at its source for every query, present and future, rather than patching it per-query or on the frontend.**
 
---
 
## Lesson 84: A Reusable User-Facing Error Pattern — `useState` + `catch` + Conditional Render
 
**Date learned:** 2026-07-08
**Tags:** `react` `error-handling` `ux` `spec-compliance` `day-12`
 
Both `Register.jsx` and `NewScholarship.jsx` had the identical gap: a `catch` block that only did `console.error(...)` — meaning failures (network errors, backend `400`s) were silently invisible to the actual person using the app, directly violating the spec's own stated requirement (*"Network failure → user-facing error, not a silent failure"*).
 
### The three-piece fix, applied identically to both files
 
```jsx
const [error, setError] = useState("");   // 1. new state to hold a message
 
async function handleSubmit(e) {
  e.preventDefault();
  try {
    // ...
  } catch (err) {                          // 2. renamed from `error` — avoids
                                            //    shadowing the state variable
                                            //    of the same name
    console.error("...:", err);
    setError("Something went wrong. Please try again.");
  }
}
 
return (
  <>
    {error && <p style={{ color: "red" }}>{error}</p>}   {/* 3. conditional render */}
    {/* ...form... */}
  </>
);
```
 
Worth noting explicitly why the `catch` parameter was renamed from `error` to `err`: naming a component's own error-message *state* `error`, while also naming the caught exception object in `catch (error)` the exact same thing, works (different scopes, no actual bug) but reads confusingly — two different things sharing one name in the same function.
 
### A real gotcha hit while applying this
 
Writing `const [error, setError] = useState;` (missing the call parentheses) doesn't destructure correctly — `useState` needs to actually be *called*, with a starting value (`useState("")`), same as every other `useState` line. Referencing the function itself instead of calling it is a small, easy-to-miss slip, caught only once the component actually tried to render and threw.
 
> One line: **a silent `catch (error) { console.error(...) }` leaves the person using the app with zero feedback when something fails; the fix is one new `useState("")` for an error message, setting it inside `catch`, and conditionally rendering it near the top of the form — a small, reusable three-piece pattern worth applying to every form's submit handler across the project.**
 
---
 
## Lesson 85: `EditScholarship` — Prefilled Controlled Forms, `async`/`useEffect` Don't Mix, and Trusting the Response Shape
 
**Date learned:** 2026-07-09
**Tags:** `react` `useeffect` `async-await` `promises` `hoisting` `debugging` `day-12`
 
The last Day-12 page, `EditScholarship`, needed a genuinely new pattern versus `NewScholarship`: a controlled form that starts **pre-filled** from data fetched by `:id`, not from empty strings. Getting there surfaced three real, separate bugs — each worth keeping as its own lesson, since each generalizes far beyond this one page.
 
### The shape that makes it work: `useState({})` + a dedicated `isLoading` flag
 
On first render, the real scholarship data doesn't exist yet — it's still in flight. Initializing `formData` to `{}` is the honest choice (no fake placeholder data), but by itself it reintroduces exactly the Lesson 82 controlled-input trap: `formData.title` is `undefined` on that first render, React locks the input in as "uncontrolled," and flipping it to controlled once the fetch resolves throws a warning.
 
The fix is a **second, separate state variable that answers a different question** — not "what's the data?" but "have we heard back from the server at all?":
 
```jsx
const [formData, setFormData] = useState({});
const [isLoading, setIsLoading] = useState(true);
 
useEffect(() => {
  apiFetch(`/scholarships/${id}`)
    .then((data) => setFormData({ ...data.scholarship }))
    .catch((err) => console.error("Failed to get the details of the scholarship: ", err))
    .finally(() => setIsLoading(false));
}, []);
 
if (isLoading) {
  return <p>Loading...</p>;
}
// form JSX below only renders once isLoading is false —
// so formData.title is already a real string the very first
// time any input ever sees it. React never has a chance to
// see `undefined` and lock in "uncontrolled" at all.
```
 
Using the *data's own shape* (`Object.keys(scholarshipDetail).length === 0`, as done elsewhere in this project for `ScholarshipDetail`/`MyTracker`) to mean "not loaded yet" was considered and rejected here — it can't tell "genuinely no data" apart from "haven't asked yet." A dedicated `isLoading` boolean answers a question the data's shape structurally cannot.
 
### Bug 1 — `async` cannot go on the `useEffect` callback itself
 
The natural first instinct, once `await` felt needed, was `useEffect(async () => { await apiFetch(...) }, [])`. This is legal JavaScript syntax, but it breaks a rule specific to `useEffect`: its callback is only allowed to return `undefined` or a cleanup function — never a Promise. Since **any `async` function always returns a Promise**, even with no explicit `return` and even if nothing inside it is ever awaited, marking the effect callback `async` violates that contract and produces a real console warning ("An effect function must not return anything besides a function...").
 
The fix: keep the `useEffect` callback a plain (non-`async`) function, and use `.then()/.catch()/.finally()` instead of `await` inside it. If `async/await`-style sequential logic is ever genuinely needed inside an effect, the correct pattern is a separate `async` helper function defined *inside* the effect, called by the (still non-`async`) effect callback — never mark the effect callback itself `async`.
 
A related, easy-to-conflate mistake along the way: writing `await` with **no** `async` anywhere in scope isn't silently ignored — it's a **hard syntax error**, and none of the code around it runs at all. That's a different failure shape than "the await did nothing," worth being able to tell apart when debugging.
 
### Bug 2 — never assume a fetch response's shape; log it once
 
Once the `useEffect`/`async` issue was fixed, the form still rendered completely blank — no errors anywhere. The actual cause: `GET /scholarships/:id` returns `{ scholarship: { title: ..., amount: ..., ... } }`, not the fields directly at the top level. `setFormData({ ...data })` produced a `formData` with none of the expected keys — silently, with no crash, since spreading an object with the wrong shape is not an error, just useless data. The fix was `setFormData({ ...data.scholarship })`, confirmed only by actually looking (a live screenshot showing every input blank, then a `console.log(data)` check would have caught it just as fast). Worth generalizing: **the first time any new endpoint's response is consumed, log it once rather than assuming its shape matches a sibling endpoint** — `GET /scholarships/mine` (an array under `data.scholarships`) and `GET /scholarships/:id` (a single object under `data.scholarship`) look similar but nest differently.
 
### A non-bug worth understanding anyway: function-declaration hoisting
 
`handleChange` was defined (as `function handleChange(e) {...}`) *after* the early `if (isLoading) return ...` line, which raised a fair question: does JS run top-to-bottom, and would this throw since the function is "defined too late"? The resolution: `function` declarations (unlike `const fn = () => {}`) are **hoisted** — fully defined before any code in their scope starts executing — but hoisting only means the function *exists* early, not that it's *called* early. `handleChange` is never actually invoked until an `onChange` event fires, which can't happen before the form itself (and therefore the early return) has already resolved. Placement after an early return is harmless for a hoisted function declaration; it would only matter if something tried to *call* it before that point in execution order, not before it in reading order on the page.
 
> One line: **a prefilled controlled form needs an honest `useState({})` plus a *separate* `isLoading` flag (not derived from the data's shape) so the form never renders until real data exists; `useEffect`'s callback must never be marked `async` (use `.then/.catch/.finally` instead, since any `async` function always returns a Promise and `useEffect` only accepts `undefined`/a cleanup function back); and a fetch response's shape should be confirmed with a quick log the first time it's consumed, never assumed from a similar-looking sibling endpoint.**
 
---
 
## Lesson 86: Loading / Error / Empty Are Three Different States — Plus a Reusable Retry Pattern
 
**Date learned:** 2026-07-11
**Tags:** `react` `loading-states` `error-handling` `ux` `day-13`
 
Several pages (`Scholarships`, `MyTracker`, `ScholarshipDetail`) fetched a list or item on mount but had no `isLoading`/`error` state at all — only the real data, starting as `[]` or `{}`. The problem: an empty array/object renders **identically** whether the fetch hasn't resolved yet, failed outright, or genuinely succeeded with nothing to show. A user can't tell "give it a second" from "there's nothing here" from "something's broken" — and for a scholarship-tracking app specifically, a user wrongly concluding "no scholarships available" and leaving is a worse outcome than almost any other UI bug.
 
### The three-state shape
 
```jsx
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
 
function fetchThing() {
  setIsLoading(true);
  setError(null); // clear any stale error from a previous failed attempt
  apiFetch("/thing")
    .then((data) => setThing(data.thing))
    .catch((err) => setError(err))
    .finally(() => setIsLoading(false));
}
 
useEffect(() => { fetchThing(); }, []);
 
if (isLoading) return <p>Loading...</p>;
if (error) return (
  <div>
    <p>{error.message}</p>
    <button onClick={fetchThing}>Retry</button>
  </div>
);
// real data render below — an empty array here now correctly means "genuinely nothing"
```
 
Checking `isLoading` **before** `error` matters: `isLoading` answers "has the fetch settled at all yet, one way or another" — `finally()` is the one part of the chain guaranteed to run regardless of outcome, which is exactly why `setIsLoading(false)` belongs there.
 
### Retry needs the fetch pulled into its own named function
 
A `useEffect` callback can't be re-invoked directly from a button's `onClick` in a way that also resets `isLoading`/`error` cleanly — so the fetch logic gets pulled out into its own function (`fetchThing` above), called both from `useEffect` on mount *and* from the Retry button. `setError(null)` at the top of that function is what prevents a stale error from a first failed attempt still showing after a second, successful attempt.
 
> One line: **loading, error, and genuinely-empty are three distinct states that all look identical as a blank/empty render unless tracked separately — `isLoading` + `error` state, checked in that order, with the fetch pulled into a reusable function so a Retry button can re-trigger it (resetting `error` first) is the reusable shape for every fetch-on-mount page.**
 
---
 
## Lesson 87: Attaching an HTTP Status to a Thrown `Error`, and Branching on It (the 401 Redirect)
 
**Date learned:** 2026-07-11
**Tags:** `react` `error-handling` `auth` `api-design` `day-13`
 
`apiFetch` only ever threw `new Error(data.error || ...)` — a plain string message, with the original HTTP status code (401 vs. 500 vs. 400) thrown away. `MyTracker` needed to tell those apart: a 401 means the JWT is missing/expired, and the honest response is redirecting to `/login` (retrying with the same bad token just 401s again) — a completely different situation from a genuine server error, where Retry is the right move.
 
### The fix: a plain property, not a special constructor feature
 
`Error` objects are still just objects — nothing stops attaching an arbitrary extra property after creating one:
 
```js
if (!response.ok) {
  const err = new Error(data.error || `Request failed ${response.status}`);
  err.status = response.status;
  throw err;
}
```
 
Every thrown error now carries both a human-readable `.message` and a machine-checkable `.status`, usable anywhere a `.catch()` receives it.
 
### Branching with a fallback, not a chain of exact matches
 
```js
.catch((error) => {
  if (error.status === 401) {
    navigate("/login");
    return; // skip setError — a redirect is happening, no error UI needed
  }
  setError(error);
})
```
 
The same shape recurred in `Login.jsx`, but there the specific statuses that mattered were different (`400` = missing fields, `401` = wrong credentials) and *every* case needed a message — including ones with no special branch (500, network failure). The fix there was an `if/else if/else`, where the final bare `else` catches anything unrecognized, rather than stopping at the last known status and leaving unmatched codes to silently do nothing (the same silent-failure shape flagged in Lesson 84, recurring in a new spot).
 
> One line: **`new Error(msg)` only preserves a string in `.message` — attaching `err.status = response.status` before throwing gives every catch site a machine-checkable status to branch on; branching logic needs a bare `else`/fallback for unrecognized codes, not just handlers for the specific ones anticipated, or an unmatched status silently produces no user-facing feedback at all.**
 
---
 
## Lesson 88: Rules of Hooks — a Hook Can Never Sit After an Early `return`
 
**Date learned:** 2026-07-11
**Tags:** `react` `hooks` `rules-of-hooks` `bug` `day-13`
 
Adding `isLoading`/`error` early-return blocks to `ScholarshipDetail` (Lesson 86's pattern) initially left the page's `useEffect` call sitting **below** both early returns:
 
```jsx
if (isLoading) { return <p>Loading...</p>; }
if (error) { return ( ... ); }
useEffect(() => { fetchScholarshipDetail(); }, [id]); // never reached on first render
```
 
React requires every Hook to run in the exact same order on every render, with no exceptions — never inside a conditional, never after an early `return`. On the very first render, `isLoading` starts `true`, so the function returns `<p>Loading...</p>` **before execution ever reaches the `useEffect` line below it**. The concrete consequence wasn't a warning-only issue — `fetchScholarshipDetail()` never got called at all, `isLoading` never had anything to flip it to `false`, and the page was stuck on "Loading..." permanently.
 
The fix: move `useEffect` above both early returns, so it always executes regardless of what state is set at the time. The bug isn't really about vertical position in the file — it's about a Hook being *conditionally skipped*. A Hook sitting below returns that never fire yet would be just as broken the moment a later render's conditions changed and the return started firing.
 
> One line: **every Hook (`useState`, `useEffect`, etc.) must execute on every single render, unconditionally — placing one after an early `return` means it silently never runs on whichever render path hits that return first, which is a functional bug (the effect never fires), not just a lint warning.**
 
---
 
## Lesson 89: Stale Closures in Concurrent Async Handlers — the Functional `setState` Fix
 
**Date learned:** 2026-07-11
**Tags:** `react` `closures` `race-condition` `usestate` `async` `day-13`
 
`AdminDashboard`'s `handleClose`/`handleReopen` each read `scholarships` from the closure, then built an updated array from it *after* an `await`:
 
```jsx
async function handleClose(scholarshipId) {
  await apiFetch(`/scholarships/${scholarshipId}`, { method: "DELETE" });
  const updatedScholarship = scholarships.map((sch) => // reads pre-await snapshot
    sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
  );
  setScholarship(updatedScholarship);
}
```
 
This looked structurally identical to a case already checked and ruled safe (`ScholarshipDetail`'s `id` from `useParams()`, read after an `await`) — but the two aren't actually the same shape. `id` can only change via a URL navigation, which nothing inside that component's own async flow can trigger — so there's no way for a second, concurrent instance of the same closure to interleave. `scholarships`, by contrast, **can** be changed by a *different* invocation of this same pattern: if an admin clicks Close on one item and Reopen on another before the first request finishes, both handlers pause at their own `await` holding their own frozen, identical pre-click snapshot of `scholarships`. Whichever one's request resolves first calls `setScholarship` correctly — but when the second one resumes, it's still building its update from its own **stale** snapshot, silently overwriting the first one's already-correct change.
 
### The fix: the functional form of the setter
 
```jsx
setScholarship((currentScholarships) =>
  currentScholarships.map((sch) =>
    sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
  ),
);
```
 
Passing a *function* instead of a precomputed value (same mechanism as Lesson 81, applied here for a new reason) means React hands back the **true current state at the moment the update is actually applied**, not whatever was sitting in the handler's closure when it was first called. Each concurrent update now correctly builds on top of whatever came immediately before it, regardless of which request resolves first.
 
### The general test for whether this risk applies anywhere
 
Two ingredients are both required: **(1)** a `setSomething(...)` call built from state read *before* an `await`/async gap, where **(2)** something else could plausibly call `setSomething` again on that same piece of state before the first call resumes. A one-shot action with no list state at all (`Login`, `Register`, `NewScholarship` — all just `navigate()` away on success, no `setSomething` after their `await`) fails ingredient 1 outright. A per-item action on a list, where only one action can ever be in flight at a time, would still fail ingredient 2. It's specifically "list state" + "multiple concurrent per-item actions" that creates the risk.
 
> One line: **reading list state from a closure and building a `setState` update from it *after* an `await` is only safe if nothing else could plausibly update that same state while the first call is paused — for anything shaped like "concurrent per-item actions on a shared list," use the functional setter form (`setX(current => ...)`) instead, so each update is guaranteed to build on the true latest state rather than a stale pre-await snapshot.**
 
---
 
## Lesson 90: Auditing for a Bug Pattern — What Actually Qualifies, and What Doesn't
 
**Date learned:** 2026-07-11
**Tags:** `debugging` `process` `code-review` `day-13`
 
After fixing Lesson 89's race condition, the natural next question was whether the same pattern existed elsewhere in the project. Rather than guessing or re-checking every file identically, each candidate got tested against the same two-ingredient definition from Lesson 89, and each conclusion was stated with its actual reason rather than a blanket "seems fine":
 
- **`Login.jsx`** — no `setSomething(...)` at all after its `await`; only `localStorage.setItem`, `navigate()`. Ruled out on ingredient 1. (It *did* have a different, real bug — the exact silent-`console.error`-only pattern from Lesson 84 recurring — found and fixed separately, but that's a different bug category from the race condition being audited for.)
- **`Register.jsx`, `NewScholarship.jsx`** — same shape: `await` then `navigate()`, no list state touched at all. Ruled out on ingredient 1.
- **`AdminDashboard`'s `handleClose`/`handleReopen`** — the one real instance; already fixed (Lesson 89).
- **A page that doesn't exist yet** (`ViewApplicants.jsx`, referenced in the spec but never built) — not a candidate, since a bug can't exist in code that hasn't been written.
The useful distinction that came out of this: **finding "this file doesn't have Bug X" is a legitimate, complete audit result** — it's not the same as finding nothing at all. Confirming a specific risk *isn't* present, with the actual reasoning for why, is exactly as valuable as finding and fixing a real instance of it, and prevents wasted effort "fixing" code that was never actually broken.
 
> One line: **auditing a codebase for a specific bug pattern means testing every candidate against that pattern's precise, minimal definition (not "does this feel similar") — and a confirmed "this doesn't qualify, and here's specifically why" is a real, useful audit result, not a non-answer.**
 
---
 
## Lesson 91: Whitespace-Only Input Isn't Empty — the `.trim()` Gap in Validation
 
**Date learned:** 2026-07-11
**Tags:** `validation` `sql` `forms` `bug` `day-13`
 
The backend's `update` controller had `if (!title || !organization || !deadline)`, and the frontend's `title` input had `required` — both looked like solid coverage. Live-testing it anyway (rather than trusting the code on sight) surfaced a real gap: typing only spaces into the Title field and submitting produced a scholarship row saved to the database with a blank-looking title, confirmed directly in Neon's SQL Editor.
 
### Why both layers missed it, for the same underlying reason
 
- **HTML's `required` attribute** only checks "is this field's value the empty string" — `"   "` (three spaces) is a non-empty string as far as the browser is concerned, so `required` never blocks it.
- **`!title`** relies on JS's falsy values (`""`, `0`, `null`, `undefined`, `NaN`, `false`) — but `"   "` is a non-empty string, so it's truthy, and `!"   "` is `false`. The check never fires.
Both layers were correctly checking "is this literally empty," when the real requirement was "is this *meaningfully* empty."
 
### The fix, and a `const`-reassignment trap along the way
 
```js
const { title, organization, deadline, /* ... */ } = req.body;
const trimmedTitle = title?.trim();
const trimmedOrganization = organization?.trim();
 
if (!trimmedTitle || !trimmedOrganization || !deadline) {
  return res.status(400).json({ error: "missing input" });
}
// ...use trimmedTitle / trimmedOrganization in the later model call too —
// not the original title/organization — or the check validates one value
// while a different, untrimmed one gets saved.
```
 
`title?.trim()` (optional chaining) matters here specifically because `title` could be `undefined` if the field were omitted from the request body entirely — plain `title.trim()` would throw on `undefined` (no `.trim()` method exists on `undefined`), turning a clean 400 into a confusing 500 from the generic `catch` block. `deadline` didn't need the same treatment — it comes from a `type="date"` input, which doesn't produce whitespace-only garbage the way a free-text field does.
 
The first instinct — reassigning `title = title?.trim()` directly — failed immediately, since `title`/`organization` were destructured with `const`, and `const` bindings can never be reassigned. New variables (`trimmedTitle`/`trimmedOrganization`) sidestepped this without touching the rest of the function's `const`s.
 
**Both layers still needed the fix** — frontend validation is for immediate UX feedback, but it can always be bypassed (Thunder Client, a modified request), so the backend check is the one that actually gates what reaches the database.
 
> One line: **neither HTML's `required` nor a plain `!value` check catches whitespace-only text, since both only test for literal emptiness — `.trim()` the value before checking it (optional-chained, in case the field is missing entirely) and use the *trimmed* value everywhere downstream, not just inside the check, so the saved data can't retain the stray whitespace the check was supposed to reject.**
 
---
 
## Lesson 92: Git Branching Before Deployment — Why `main` Stops Being a Safe Place to Commit Directly
 
**Date learned:** 2026-07-11
**Tags:** `git` `deployment` `ci-cd` `workflow` `day-13`
 
Every commit so far had gone straight to `main`, which was fine — nothing downstream of `main` cared what was in it. Deployment changes that: Railway/Vercel-style platforms watch a specific branch (typically `main`) and auto-deploy on every push to it. Once that's wired up, **anything pushed to `main` goes live** — a typo, a half-finished feature, or a bug like Lesson 91's whitespace gap would ship the moment it's pushed, with no review step in between.
 
### The fix: do deployment (and future risky work) on a separate branch
 
```
git checkout -b dev
```
 
A branch is a lightweight named pointer to a commit, not a duplicate copy of every file — `dev` and `main` point at the identical commit the moment it's created, which is why the working directory looks unchanged right after running this. Committing itself is completely branch-agnostic: the same commits, same messages, same sequence, would happen regardless of which branch is checked out. What differs is only *where those commits land* and *what's downstream of them*.
 
The real workflow: do work and push freely on `dev` (pushing a non-`main` branch doesn't trigger a deploy), and only merge into `main` — via a Pull Request, reviewed one more time as a full diff before merging — once the work is actually confirmed working. For a solo project, the PR reviewer is just yourself, but the branch separation is still valuable alone: it guarantees `main` always reflects "what's actually live," and provides one deliberate checkpoint to catch a stray debug line or typo before it ships, the same kind of thing already caught mid-session today (a leftover `setScholarship(updatedScholarship)` line from an in-progress edit).
 
> One line: **once a hosting platform auto-deploys on push to `main`, `main` stops being a safe place for in-progress work — do the work on a separate branch (`git checkout -b dev`), push and iterate there freely, and only merge to `main` via a reviewed PR once it's confirmed working, since a branch is just a movable pointer and committing itself works identically regardless of which branch is checked out.**
 
---
 
## Lesson 93: Choosing a Free Backend Host — Why "the Plan" Needed Re-checking Against Current Pricing
 
**Date learned:** 2026-07-11
**Tags:** `deployment` `railway` `render` `vercel` `decision-making` `day-13`
 
`next-session-todo.md` had named Railway as the backend host, decided earlier without checking current pricing. Before acting on it, checking turned up that **Railway no longer has an ongoing free tier** — a one-time 30-day, $5 trial, after which it drops to a $1/month credit (not enough to run a real service) or the Hobby plan at $5/month minimum. Vercel's free Hobby tier for the frontend, by contrast, is genuinely free indefinitely for a non-commercial project like this one — no re-check needed there.
 
**Render** was the better fit for the backend specifically: a real, ongoing free tier with no time limit and no credit card required, at the cost of the free web service sleeping after 15 minutes of inactivity and taking roughly 30–50 seconds to "wake" on the next request. For a portfolio project without live 24/7 traffic, that cold-start trade-off was judged acceptable in exchange for staying at $0/month — a deliberate choice, not a default.
 
> One line: **a plan decided earlier in a project (which host, which library, which approach) can go stale by the time it's actually acted on — pricing, defaults, and availability all change, so it's worth a quick check against current information before executing on an old decision rather than assuming it's still accurate.**
 
---
 
## Lesson 94: Deploying a Monorepo Backend to Render — Root Directory, Build/Start Commands, Region
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `render` `monorepo` `day-13`
 
With Railway ruled out (Lesson 93), the actual Render Web Service got configured and deployed. Since `server/` and `client/` live as siblings in one repo, Render needed to be told explicitly which one it was building — this is what **Root Directory** does: "run every subsequent command from inside this folder, not the repo root," and, as a side effect, "only changes inside this folder trigger an auto-deploy" (this second half becomes important later — see Lesson 103).
 
Fields that needed real values instead of Render's placeholder defaults:
- **Branch** — defaulted to `main`; changed to `dev`, per the Lesson 92 branching decision (`main` shouldn't receive raw, unverified deploys mid-setup)
- **Root Directory** — set to `server`
- **Build Command** — `npm install`, run from inside `server/` because of the Root Directory setting, so it only installs backend `dependencies`
- **Start Command** — `npm start`, which resolves to the `"start": "node index.js"` script already confirmed correct back at the very start of Day 13
- **Region** — Singapore (Southeast Asia) chosen deliberately over the default Oregon, since the app's actual users are Filipino students; free tier limits region choice, but this was still the better available option
- **Instance Type** — Free (512 MB RAM, 0.1 CPU) — the tier decided on in Lesson 93, sleeps after 15 minutes of inactivity, ~30–50s cold start on wake
A separate, related setting worth understanding even though it wasn't touched this session: **Auto-Deploy**, defaulting to "On Commit" — this is the actual mechanism behind "the host watches GitHub." Render doesn't run anything *on* GitHub; it clones the repo and rebuilds on its own machines every time a new commit lands on the tracked branch. GitHub's only role is being the source of truth Render polls/gets notified from — a genuinely different thing from GitHub Pages (a separate, static-only hosting product GitHub itself offers, incapable of running a live Express server).
 
> One line: **for a monorepo, a host's Root Directory setting scopes every subsequent command (build, start) to that one subfolder and also scopes which file changes trigger an auto-deploy — set it once, correctly, before touching Build/Start commands, and pick the branch deliberately rather than accepting the default (usually `main`).**
 
---
 
## Lesson 95: Environment Variables Don't Travel With Git — Configuring a Host's Dashboard Directly
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `environment-variables` `render` `day-13`
 
`.env` is, by design, never committed (Lesson 8, Part 1) — which means it also never reaches a deployed host through a `git push`. A host has no way to read a file that was never in the repo. Every environment variable the backend needs had to be manually re-entered into Render's dashboard, separately from the codebase entirely.
 
The actual list was derived by re-reading the code, not by trusting memory or the `.env.example` file blindly: `process.env.DATABASE_URL` (in `db.js`), `process.env.JWT_SECRET` and `process.env.JWT_EXPIRES_IN` (in the login controller's `jwt.sign` call), `process.env.PORT` (in `index.js`), and — added later this session — `process.env.CORS_ORIGINS` (Lesson 96/97). Confirming this list meant actually opening each relevant file and searching for `process.env`, rather than assuming the `.env.example` file was exhaustive or current.
 
**`PORT` deserved special handling, and was ultimately excluded.** Render (like most hosts) assigns its own port to a deployed service and expects the app to listen on whatever value it injects — not a value the developer chooses. The existing code, `const PORT = process.env.PORT || 3000`, already handled this gracefully: Render's real injected value wins whenever it's present (truthy), and the `3000` fallback only ever fires locally, where `process.env.PORT` is `undefined`. Manually setting `PORT` in Render's dashboard risked overriding Render's real assignment with a stale local value, so it was deliberately left out — confirmed live afterward, when the boot log showed `Server running on port 10000` (not `3000`), proving Render's own value had been picked up correctly.
 
Render's dashboard offered an **"Add from .env"** import option — paste the whole local `.env` file's contents, and it auto-parses each `KEY=value` line into a separate row. Used deliberately over manual retyping specifically to avoid a repeat of an earlier typo bug (`CORS_ORIGIN` vs. `CORS_ORIGINS`, see Lesson 97) — a paste can't introduce a spelling mismatch a keystroke can.
 
> One line: **`.env` never leaves the local machine via git, so every variable a deployed backend needs must be manually configured in the host's own dashboard — derive the real list by re-reading `process.env.X` references in the actual code, use an "import from .env" feature over manual retyping to avoid typos, and deliberately leave out any variable (like `PORT`) that the host is responsible for assigning itself.**
 
---
 
## Lesson 96: CORS, Properly Understood — a Browser-Enforced Read Permission, Not a Server Wall
 
**Date learned:** 2026-07-12
**Tags:** `cors` `security` `browsers` `day-13`
 
CORS had been added back on Day 9 (Part 3) as a fix for a specific local error, but its actual mechanism — and the real reason it exists — only got fully worked through this session, once the code (`app.use(cors())`, no arguments) was inspected and found to be wide open.
 
### What CORS is actually protecting against
 
The mental model corrected this session: CORS is not primarily "keeping hackers out" in a general sense — it's a **browser-enforced rule about which websites' JavaScript is allowed to *read* a response**, specifically to stop this scenario: a user is logged into a real site (holding a valid session/token in that browser), then visits an unrelated malicious site in the same browser. That malicious site's JS quietly tries to call the real API, hoping to piggyback on the logged-in user's session. Browsers block this by default (same-origin policy); CORS headers are how an API owner explicitly grants specific other origins permission to read responses.
 
**The bouncer analogy that made it click:** the CORS middleware is a bouncer at the API's door, checking each request's stated origin against an allow-list. Critically — **the bouncer doesn't stop the request from being sent or processed.** The server still runs the logic and generates a response either way. What CORS actually blocks is whether the *browser* hands that response back to the requesting page's JavaScript. This is also exactly why Thunder Client and Postman never hit CORS errors: they aren't browsers, and same-origin policy is a browser-only concept.
 
### `cors()` with no arguments means "no allow-list at all"
 
`app.use(cors())` — zero arguments — was discovered to mean **every origin is allowed**, not "scoped to localhost" as an earlier note had assumed (the note was stale/wrong; checking the actual code, not trusting a prior written assumption, is what caught this). The real fix required passing an explicit `origin` option.
 
### Handling two required origins with one env var
 
The production setup needed **two** simultaneously-valid origins — local dev (`http://localhost:5173`) and the live Vercel frontend — which ruled out a single-value swap-per-environment pattern like `DATABASE_URL` uses. The `cors` package's `origin` option accepts an **array** of strings, so the fix combined that with a comma-separated env var, split at runtime:
 
```javascript
const allowedOrigins = process.env.CORS_ORIGINS.split(",");
app.use(cors({ origin: allowedOrigins }));
```
```dotenv
CORS_ORIGINS=http://localhost:5173,https://skolar-track.vercel.app
```
 
### Verified both directions, live
 
Rather than trusting the fix by reading the code, it was tested both ways: `CORS_ORIGINS` was temporarily set to a wrong value (`http://localhost:9999`) and a login attempt correctly produced a real `blocked by CORS policy` console error; switched back to the correct value, the same login succeeded cleanly. Proving both the "blocks the wrong thing" and "allows the right thing" halves, not just one.
 
> One line: **CORS is a browser-only rule about whether JavaScript on one origin may *read* a response from another — not a server-side wall stopping the request itself — and `cors()` with no arguments means every origin is allowed; fix it by passing an explicit `origin` array (built from a comma-separated env var when more than one origin needs to stay valid at once), and verify the fix both ways, not just the "it works" direction.**
 
---
 
## Lesson 97: Guarding Against a Missing Env Var at Startup — Fail Loud, Not Cryptic
 
**Date learned:** 2026-07-12
**Tags:** `error-handling` `defensive-coding` `day-13`
 
Once `CORS_ORIGINS` became something the code depended on (`.split(",")` on it), a real question came up: what happens if a future deploy forgets to set it — deliberately traced through rather than left to chance. `undefined.split(",")` throws `TypeError: Cannot read properties of undefined (reading 'split')` — and since that line runs at module load time (outside any request handler, outside any try/catch), the whole server crashes on boot, with an error message that names the symptom but not the cause.
 
The fix: an explicit guard, checked before the `.split()` call, throwing a message that states the actual problem in plain language.
 
```javascript
if (!process.env.CORS_ORIGINS) {
  throw new Error("CORS_ORIGINS environment variable is not set");
}
const allowedOrigins = process.env.CORS_ORIGINS.split(",");
```
 
The value of this, stated precisely: without the guard, a missing env var produces `TypeError: Cannot read properties of undefined (reading 'split')` — technically correct, but requires tracing back through the code to find the real cause. With the guard, the error message *is* the diagnosis — `CORS_ORIGINS environment variable is not set` — readable by future-self (or anyone) without opening a single source file. This is the same "silent failure vs. a real, visible error" instinct already applied repeatedly this project (Lesson 84's user-facing error pattern, the whitespace-validation fix in Lesson 91) — just applied here to startup configuration instead of user input.
 
**A real bug this same discipline caught immediately afterward:** the guard was first written checking `process.env.CORS_ORIGIN` (missing the trailing `S`) while the actual `.env` key was `CORS_ORIGINS` — an exact-match mismatch invisible to a quick read but fatal to `process.env`, which does no typo tolerance. Caught by comparing the two lines side by side, not by running the code and seeing it fail.
 
> One line: **when something *will* eventually fail (a missing required config value), add an explicit guard that throws with a message stating the actual problem in plain language — a diagnosable error at startup beats a cryptic one three function calls deep, and `process.env` keys must match exactly, with no typo tolerance.**
 
---
 
## Lesson 98: Deploying the Frontend to Vercel — Root Directory, the `dev`/`build` Script Mixup, and Branch Defaults
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `vercel` `vite` `day-13`
 
Vercel's import flow mirrored Render's in shape but differed in specifics worth telling apart.
 
**Root Directory** — same concept as Render's (Lesson 94), set to `client` this time, so Vercel only builds/watches the frontend half of the monorepo.
 
**A real config mistake caught before deploying:** the Build Command field defaulted to `npm run dev` — the *local development* script (Vite's dev server, hot-reload, stays running). This is categorically the wrong thing for a host: Vercel doesn't want a live process, it wants a one-time **build** producing static files it can serve. The correct command, `npm run build` (→ `vite build`), was substituted in. This is the same category of mistake as accidentally pointing a `start` script at `nodemon` instead of `node` (Part 5-era backend concept) — a dev-only tool where a production-only tool belongs.
 
**Branch selection worked differently than Render's.** Render let branch be chosen on the very first config screen; Vercel's first-import flow has no such field — it silently deploys from whatever the repo's actual default branch is (`main`), and branch tracking only becomes editable *afterward*, under Project Settings → Environments → Production. This isn't a bug or an oversight in Vercel — it's just a different point in the flow for the same decision, and the deploy this produced was harmless *only* because `client/` was confirmed identical between `main` and `dev` at that moment (checked directly via `git diff main dev -- client/`, returning nothing — not assumed).
 
**Environment Variables** — Vercel offered the same kind of dashboard as Render, but nothing needed to go there this session, since `BASE_URL` was still a hardcoded string in source at this point (later replaced — see Lesson 102), not read from `import.meta.env.VITE_*`.
 
> One line: **a host's Build Command must be an actual *build* step (`vite build`), never a dev-server script (`npm run dev`) — same mistake-shape as confusing `nodemon` for `node` in a start script — and different hosts may expose branch selection at different points in their setup flow, so check rather than assume it mirrors a previously-used host.**
 
---
 
## Lesson 99: Deployment URL vs. Branch URL vs. Production Domain — Three Different Pointers
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `vercel` `git` `day-13`
 
Vercel surfaces three different URLs per project, easy to conflate until they're seen diverging. The distinction, worked through via a concrete before/after example (two hypothetical commits, `aaa111` then `bbb222`, both pushed to the same branch):
 
- **Deployment URL** (e.g. `skolar-track-g6ssk3jyd-....vercel.app`) — frozen to **one specific commit**, permanently. Pushing ten more commits never changes what this exact URL shows. A new deployment URL is generated fresh for every single build; old ones are never retroactively updated, just left behind, unused but not deleted.
- **Branch URL** (e.g. `skolar-track-git-main-....vercel.app`) — always reflects whatever the **latest commit on that specific branch** currently is. Auto-updates on every push to that branch. A different branch (`dev`, a feature branch) gets its own, independently-updating branch URL.
- **Production domain** (`skolar-track.vercel.app`, the clean one with no branch/commit info baked into the name) — a pointer that always shows whatever branch is currently assigned as **Production Branch** in project settings. It moves in lockstep with that one designated branch's branch URL — not because they're directly linked, but because both are independently tracking the same thing.
The analogy that made the auto-update mechanic click: a deployment URL is like an individual photo in a camera roll — permanent, never edited. The production domain is a "cover photo" label that automatically re-sticks itself onto whichever photo is newest from the chosen branch, every time a new one is taken.
 
**The practical consequence:** two of these three URLs can show *identical* content for a long time, purely by coincidence (production domain tracking `main`, and nothing having diverged between `main`'s branch URL and it) — which is exactly what caused real confusion this session, since every deploy up to that point had only ever involved one branch.
 
> One line: **a deployment URL is a permanent, frozen snapshot of one exact commit; a branch URL auto-updates to match the newest commit on one specific branch; the production domain is a relabeling pointer that always follows whichever branch is currently assigned as Production — two of the three can look identical for a long time simply because nothing has diverged yet, not because they're the same mechanism.**
 
---
 
## Lesson 100: Production Branch Tracking Is a Setting, Not Automatic — It Needs a Fresh Deploy to Take Effect
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `vercel` `git` `day-13`
 
Switching Vercel's Production Branch setting from `main` to `dev` (matching the deployment-safety branch strategy from Lesson 92/94) produced an immediate, informative failure: visiting the production domain right after saving the setting returned `404: NOT_FOUND`.
 
**The actual cause:** a settings change is not itself a deploy event. Vercel needs a real triggering event — a new push, or a manual deploy — to actually *build something* under the new rule and assign it to Production. Since no new commit had landed on `dev` since the setting changed, there was, briefly, nothing eligible to serve as the production build at all — hence the 404, a genuinely different failure than a routing bug.
 
**The fix:** Vercel's Deployments tab offers a manual "Create Deployment" action, letting an existing commit (the latest one already on `dev`) be explicitly redeployed and tagged `[Production]` under the new branch rule — a one-time catch-up step, needed specifically because the setting was changed *after* the last relevant push rather than before it. Any *future* push to `dev` would trigger this automatically, with no manual step required.
 
The same underlying idea recurred once more, later in the session: switching Production Branch *back* to `main` after the PR merge also required this same manual trigger, for the identical reason — the merge itself happened as a GitHub-side event, and the settings change happened after it, so nothing had yet rebuilt under the corrected rule.
 
> One line: **changing which branch a host treats as "Production" is only a rule change — it doesn't retroactively promote an existing build — so if the setting is changed after the branch's last push, a one-time manual deploy is needed to actually produce something under the new rule; any push after that point triggers it automatically.**
 
---
 
## Lesson 101: `localhost`, DNS, and What "Hosting Your Own Server" Actually Requires
 
**Date learned:** 2026-07-12
**Tags:** `networking` `dns` `localhost` `concepts` `day-13`
 
Once the backend was live on a real domain (`skolartrack.onrender.com`) rather than `localhost:3000`, a genuine "wait, what actually changed" question came up — worth answering precisely, since it's foundational and easy to hand-wave past.
 
**`localhost` is a special hostname that always means "this same machine, right now."** A request to `localhost:3000` never leaves the computer it's typed on — it's the network equivalent of writing your own address as the recipient. This is *why* `localhost:3000` only ever worked while `npm run dev` was actively running in that exact terminal: there was no server there except the one specific Node process, and it stopped existing the moment that process was killed.
 
**A real host works differently in every one of these ways at once:** a domain like `skolartrack.onrender.com` is registered in **DNS** (the internet's phone book — resolving a name to a real IP address), points at an actual physical machine in a real data center, and runs independent of whether the developer's own laptop is even turned on.
 
**The actual request path, once hosted:** browser → asks DNS to resolve the domain to an IP → opens a real network connection over the internet to that IP → Render's infrastructure routes the request to the specific running container → that container's `node index.js` process (the exact one whose boot log showed `Server running on port 10000`) handles it → response travels back the same path.
 
**Is self-hosting from a personal laptop actually possible?** Technically yes — the laptop already runs a real server process during `npm run dev`. What's missing is router port-forwarding (home routers block unsolicited incoming connections by default), a stable address (home IPs are usually dynamic, requiring a service like Dynamic DNS to stay reachable under one consistent name), the machine staying physically on and connected 24/7, and someone handling HTTPS/security/uptime personally. This is exactly the bundle of problems a host like Render sells as its entire product — the free-tier cold-start tradeoff (Lesson 93) is the price of not having to solve any of it personally. (A lightweight middle ground exists for quick demos — `ngrok`, which tunnels a public URL to a local `localhost` port without touching router config — but it shares the same "laptop has to stay on" fragility and isn't meant for anything long-term.)
 
**Where Render fits relative to something like AWS:** Render is a PaaS (Platform as a Service) — it deliberately hides almost all infrastructure decisions (point at a repo, say how to build/start it, done). AWS is a much lower-level catalog of individual building blocks (EC2 = a raw virtual machine you configure yourself; RDS = managed databases; S3 = file storage; Lambda = serverless functions, among many others) that get assembled manually — and Render itself is very likely built *on top of* a provider like AWS underneath, selling convenience rather than raw compute. For a portfolio project, Render/Vercel's convenience is the right tradeoff; AWS becomes more relevant later for roles that specifically want that lower-level infrastructure skill.
 
> One line: **`localhost` never leaves the machine it's typed on, which is why a dev server only exists while its process is running; a real host is different in every relevant way — DNS-resolvable, running on independent hardware, reachable regardless of the developer's own machine's state — and self-hosting personally is technically possible but requires solving router config, a stable address, and 24/7 uptime, which is exactly the bundle of problems a PaaS like Render sells as its product.**
 
---
 
## Lesson 102: `import.meta.env.DEV`/`PROD` — Vite's Build-Time Constants, Not a Live Check
 
**Date learned:** 2026-07-12
**Tags:** `vite` `environment-variables` `frontend` `day-13`
 
After deployment, `BASE_URL` in `api.js` (a single hardcoded string) became a real, recurring annoyance: testing any new full-stack feature locally required manually editing it back to `http://localhost:3000`, then manually editing it back to the live Render URL before every commit — an easy step to forget in either direction.
 
**The fix uses two built-in Vite constants**, injected automatically with no setup required: `import.meta.env.DEV` (`true` whenever the code is currently running via `npm run dev`) and `import.meta.env.PROD` (`true` whenever the code has been through `vite build` — exactly what both Vercel's build step and a local `npm run build` do) — always exact opposites of each other.
 
```javascript
const BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://skolartrack.onrender.com";
```
 
**The critical misconception this required correcting:** `import.meta.env.DEV` is **not** a live check of anything — not of whether Render is awake, not of network connectivity, not of anything happening while the app runs. It is a **literal value Vite substitutes into the code once, at build time**, based purely on *which command started the build* (`npm run dev` vs. `vite build`). Running `npm run dev` completely offline still produces `DEV = true`; that fact alone (verified as a thought experiment) is what separates this from a runtime check. `vite build` bakes `false` into the compiled output permanently — that exact file, wherever it's deployed, will always evaluate to the Render branch, forever, until it's rebuilt.
 
**Verified in both directions, live, not just read as correct:**
- `npm run dev` locally, with the local backend also running → Network tab confirmed the request hit `localhost:3000`, `200 OK`, with a matching `Access-Control-Allow-Origin: http://localhost:5173` response header
- `npm run build && npm run preview` (simulating exactly what Vercel does, served locally on port `4173`) → the request correctly targeted `https://skolartrack.onrender.com`, confirmed by a CORS rejection specifically naming that URL as the target (rejected only because `localhost:4173` was never added to `CORS_ORIGINS` — deliberately not fixed, since that port is a one-off local sanity check, not a real, permanent origin anyone will ever use)
> One line: **`import.meta.env.DEV`/`PROD` are constants Vite bakes into the compiled code once, at build time, based solely on which command produced that build (`npm run dev` vs. `vite build`) — never a live runtime check of anything, including a backend host's up/down status — and using them to branch `BASE_URL` removes a manual, easy-to-forget edit that previously had to happen before every local test and every deploy.**
 
---
 
## Lesson 103: Root-Directory-Scoped Auto-Deploy — Why a Frontend-Only Push Didn't Redeploy the Backend
 
**Date learned:** 2026-07-12
**Tags:** `deployment` `render` `monorepo` `day-13`
 
After committing and pushing the `import.meta.env.DEV` fix (a change entirely inside `client/`), Vercel rebuilt as expected — but Render's dashboard showed no new deploy at all, which read as suspicious at first.
 
**The actual explanation was already stated, unnoticed, back during initial Render setup (Lesson 94):** Root Directory doesn't only scope *where commands run* — it also scopes *which file changes count as a reason to redeploy at all*. Since Render's Root Directory is `server`, and the pushed commit touched only `client/src/services/api.js`, nothing inside Render's watched folder changed — so Render correctly did nothing. Redeploying an unchanged backend would have cost real time (a full `npm install` + restart cycle) for zero actual benefit.
 
This is the live, concrete confirmation of the theoretical "Build Filters / Included-Included Paths" concept mentioned in passing during the original Render setup — seen here actually operating, rather than just read as a settings-screen description.
 
> One line: **a host's Root Directory setting means only file changes *inside* that folder count as a reason to auto-deploy — pushing a commit that touches only the sibling frontend folder correctly produces zero backend activity on a host scoped to the backend folder, which is efficient, expected behavior, not a bug.**
 
---
 
## Lesson 104: The `main` + Feature-Branch Workflow — What `dev` Was For, and What Replaces It
 
**Date learned:** 2026-07-12
**Tags:** `git` `branching` `workflow` `day-13`
 
The `dev` branch created in Lesson 92 had one specific, narrow job: hold the entire deployment-setup effort (CORS fix, Render config, Vercel config, `BASE_URL` swaps) somewhere safe from auto-deploy, since all of that work was inherently experimental (including deliberately testing *wrong* CORS values to confirm the fix actually blocked something). This session closed the loop on that branch's full lifecycle:
 
1. A PR was opened from `dev` → `main` (title and body drafted deliberately — see the commit-message discipline reused for PR descriptions, covered below), including a **Testing** section summarizing the live verification already done, so the PR itself doubled as a record of what had actually been confirmed working, not just what had been written.
2. The PR was merged on GitHub.
3. **Both hosts' Production Branch settings were switched from `dev` back to `main`** — the deliberate final state, not "leave both hosts tracking `dev` forever." Reasoning worked through explicitly: if `dev` stayed the permanently-deployed branch, the entire purpose of having a protected `main` (only ever updated via a reviewed PR, never a direct push) becomes theater — nothing would actually stop a future direct push to `dev` from going live immediately, the exact risk the branch split was meant to prevent.
4. Local `main` was synced (`git checkout main && git pull origin main`), since the merge itself happened remotely on GitHub, and a local branch has no automatic awareness of a remote merge until explicitly pulled.
5. `dev` was deleted, both locally (`git branch -d dev`) and remotely (`git push origin --delete dev`) — safe, since its commits already live permanently inside `main`'s history via the merge; deleting the branch only removes a now-redundant pointer, not any code.
**The general pattern this establishes going forward**, distinct from `dev`'s one-time deployment-staging purpose: one short-lived, descriptively-named branch per unit of work (`feature/forgot-password`, `fix/scholarship-date-bug`), tested locally first (since a live per-branch backend preview isn't available on Render's free tier — only Vercel gets automatic per-branch frontend previews), then a PR into `main`, then deleted. `main` stays the one permanent, always-deployed branch; every other branch is disposable by design.
 
**A related PR-writing habit, extending the commit-message discipline from earlier in this file:** a PR description follows the same shape (what changed, why, how it was verified) but at the scale of the whole batch of work rather than one commit — and, for a solo project, doubles as a self-review checklist, forcing an honest answer to "did I actually confirm this all works" before merging, rather than trusting the diff on sight.
 
> One line: **a temporary branch like `dev` exists to hold inherently experimental work safely away from an auto-deploying `main`; once that work is merged via a reviewed PR, the correct end state is switching production tracking back to `main` (not leaving a second branch permanently live) and deleting the temporary branch — the ongoing pattern from here is one short-lived, descriptively-named branch per unit of work, tested locally, merged via its own PR, then discarded.**
 
---
 
## Part 5 Cheatsheet Additions
 
| Concept | One-line reminder |
|---|---|
| single-object form state | For forms with many fields, hold one object in state (matching the backend's expected body shape) instead of N separate `useState` calls |
| computed property name | `{ [name]: value }` uses a variable's *value* as the object key — the mechanism that lets one `handleChange` update the correct field in a shared `formData` object |
| function form of a setter | `setState((prev) => ({...prev, key: newVal}))` — use whenever new state needs to be built *from* current state, not just replaced outright |
| controlled input, both props | `value` (state → input) and `onChange` (input → state) are both required — dropping `value` looks fine while typing but silently breaks any future reset/pre-fill |
| `pg` DATE → timezone bug | `pg` auto-converts `DATE` columns into JS `Date` objects using the server's local timezone for "midnight," which can shift the printed calendar day by one when converted to UTC; fix globally via `types.setTypeParser(1082, v => v)` in the shared pool config |
| scope discipline on timezone bugs | A plain calendar-date deadline (set by one organization, for one region) doesn't need true global timezone synchronization — fixing "the label shows the wrong day" is a different, narrower problem than "should this be the same instant worldwide" |
| user-facing error pattern | `useState("")` for an error message + `setError(...)` inside `catch` + `{error && <p>{error}</p>}` — a small three-piece pattern worth reusing on every form's submit handler |
| `catch (error)` naming collision | If a component also has an `error` state variable, rename the `catch` parameter (e.g. `catch (err)`) to avoid two different things sharing one name in the same function, even though it isn't technically a bug |
| prefilled controlled form | `useState({})` + a *separate* `isLoading` flag + early return while loading — the input never sees `undefined`, since it never renders until real data exists |
| `async` + `useEffect` | Never mark the `useEffect` callback itself `async` (it always returns a Promise, which breaks `useEffect`'s return contract) — use `.then/.catch/.finally` inside instead, or a separate `async` helper called from a plain callback |
| `await` with no `async` in scope | A hard syntax error — the whole block fails to run, not a silent no-op; different failure shape worth telling apart from "the await did nothing" |
| trust the response, don't assume it | Log a new endpoint's response once before consuming it — similar-looking endpoints can nest data differently (`data.scholarships` array vs. `data.scholarship` object) |
| function-declaration hoisting | `function foo(){}` is fully defined before any code in its scope runs, but hoisting only means it *exists* early — not that it's *called* early; placement after an early `return` is harmless if it's only ever invoked later, from an event |
| loading / error / empty | Three distinct states that all render as "nothing" unless tracked separately — `isLoading`, `error`, and the real data (an empty array/object only correctly means "genuinely nothing" once the other two are ruled out first) |
| retry pattern | Pull the fetch into its own named function, called from both `useEffect` on mount and a Retry button's `onClick`; reset `setError(null)` at the top of that function so a stale error doesn't survive a successful retry |
| `err.status = response.status` | `new Error(msg)` only keeps a string in `.message` — attach the HTTP status as a plain extra property before throwing, so catch sites can branch on it (401 → redirect; everything else → generic error) |
| fallback `else`, not just known cases | Branching on error status needs a bare `else` for anything unrecognized — stopping at the last anticipated status leaves unmatched codes silently producing no feedback |
| Hook after an early `return` | Never legal — a Hook conditionally skipped on some render path is a functional bug (it silently never runs when that path fires first), not just a lint warning; all Hooks belong above every early return |
| stale closure vs. race condition | Reading state from a closure after an `await` is only unsafe if something *else* could update that same state while paused — a URL param (`id`) can't be changed by anything mid-flight; list state that multiple concurrent actions could each update, can |
| functional `setState` for concurrent updates | `setX((current) => ...)` hands back the true latest state at apply-time, not a stale pre-`await` closure snapshot — the fix whenever concurrent async actions might both update the same state |
| auditing a bug pattern | Test each candidate against the pattern's precise, minimal definition, not "does this feel similar" — "confirmed this doesn't qualify, here's why" is a complete, valuable audit result, not a non-answer |
| whitespace isn't empty | Neither HTML's `required` nor `!value` catches `"   "` — both only test literal emptiness; `.trim()` before checking, and use the trimmed value everywhere downstream (not just in the check) |
| `value?.trim()` | Optional chaining before `.trim()` guards against a field being `undefined`/missing entirely, not just blank — plain `.trim()` on `undefined` throws |
| branch before deploying | Once a host auto-deploys on push to `main`, `main` stops being safe for in-progress work — do it on a separate branch, merge via PR once confirmed working |
| a branch is a pointer, not a copy | `git checkout -b dev` doesn't duplicate files — it creates a movable pointer at the current commit; committing itself is identical regardless of which branch is checked out |
| re-check stale plans before acting | A decision made earlier in a project (which host, which library) can go stale by the time it's executed — worth a quick current check rather than assuming it still holds |
| Root Directory (monorepo) | Scopes both *where a host's commands run* and *which file changes trigger auto-deploy* — a change outside it produces zero activity on that host, correctly |
| host env vars | `.env` never travels via git; re-derive the real variable list from `process.env.X` in the actual code, and use an "import .env" feature over manual retyping to avoid typos |
| `PORT` on a host | Usually assigned by the host itself — don't manually override it; `process.env.PORT \|\| 3000` already handles both cases correctly on its own |
| CORS, precisely | Browser-enforced permission for *reading* a response, not a wall stopping the request from being sent or processed — irrelevant to non-browser tools like Thunder Client |
| `cors()` no args | Means every origin is allowed — always pass an explicit `origin` (array, when more than one origin must stay valid at once, e.g. via a comma-separated env var + `.split(",")`) |
| guard a required env var | `if (!process.env.X) throw new Error("X is not set")` before using it — turns a cryptic downstream `TypeError` into a self-explanatory startup error |
| build command ≠ dev command | A host's Build Command must be an actual build step (`vite build`), never a dev-server script (`npm run dev`) — same mistake shape as `nodemon` vs. `node` in a start script |
| deployment URL vs. branch URL vs. production domain | Deployment URL = frozen to one commit forever; branch URL = auto-updates to a specific branch's newest commit; production domain = relabels itself onto whichever branch is set as Production |
| Production Branch setting | Changing it is a rule change, not a deploy — if changed after the branch's last push, one manual deploy is needed to actually promote a build under the new rule |
| `localhost` | Always means "this same machine" — never reaches the wider internet; a dev server only exists there while its process is actively running |
| real hosting vs. `localhost` | DNS-resolvable name → real IP → independent physical machine → reachable regardless of the developer's own machine's state |
| `import.meta.env.DEV`/`PROD` | Vite build-time constants, baked in once based on which command produced the build (`npm run dev` vs. `vite build`) — never a live/runtime check of anything, including a backend host's status |
| `dev` branch's actual purpose (this session) | A temporary home for inherently experimental deployment-setup work, kept off auto-deploying `main` — not a permanent second production branch |
| after merging a temporary branch | Switch hosts' Production tracking back to `main`, sync local `main` via `git pull`, then delete the temporary branch (`-d` locally, `--delete` on the remote) — its commits already live in `main`'s history |
| going-forward branch pattern | One short-lived, descriptively-named branch per unit of work, tested locally, merged via its own PR, then discarded — `main` stays the one permanent branch |
 
---
 
*Part 5 updated: 2026-07-09 (Lesson 85 added, Day 12 fully concluded: building `EditScholarship` — a prefilled controlled form using `useState({})` plus a dedicated `isLoading` flag; the discovery that `useEffect`'s callback can never be marked `async` since any `async` function always returns a Promise; a real response-shape bug, `data.scholarship` vs. `data`, traced from a blank-but-error-free form; and a confirmed-harmless non-bug around function-declaration hoisting. All three admin pages — `AdminDashboard`, `NewScholarship`, `EditScholarship` — are now built and live-tested end-to-end, including a confirmed database write. `AdminDashboard`'s missing `slots` display and the `Reopen` validation redundancy were also closed out this session.)*
 
*Part 5 updated: 2026-07-11 (Lessons 86–93 added, Day 13 Polish phase — item 1 and item 2 of the to-do both completed: (1) real loading/error/retry states added to `Scholarships`, `MyTracker`, `ScholarshipDetail`, and `AdminDashboard`, surfacing and fixing a genuine race condition in `AdminDashboard`'s Close/Reopen handlers via the functional `setState` form, plus a silent-catch audit across `Login`/`Register`/`NewScholarship` that found and fixed an unrelated silent-failure bug in `Login`; (2) the backend `PUT` validation gap was tested live, confirmed broken (whitespace-only titles were passing both `required` and `!title` and being saved to the database), and fixed with `.trim()` on both layers, re-verified live. Also covered: the Rules-of-Hooks bug from a `useEffect` placed after an early `return`; attaching `err.status` to thrown errors for status-based branching (the `MyTracker` 401-redirect case); a `dev` branch created ahead of deployment work, once auto-deploy-on-push-to-`main` made that necessary; and a pricing re-check that replaced the original Railway plan with Render for the backend host, after confirming Railway no longer has an ongoing free tier. Item 3 (deployment) is set up to begin next session on the `dev` branch, targeting Render (backend) + Vercel (frontend).)*
 
*Part 5 updated: 2026-07-12 (Lessons 94–104 added, Day 13 concluded — deployment complete: the backend deployed live to Render (correct Root Directory/Build/Start commands for a monorepo, environment variables manually configured on the host, `PORT` deliberately left to the host), CORS locked down to real production origins via a `CORS_ORIGINS` allowlist and a fail-loud startup guard, the frontend deployed live to Vercel (catching a `npm run dev`-as-build-command mistake first), the deployment/branch/production-URL model worked through in full, `BASE_URL` made environment-aware via `import.meta.env.DEV`/`PROD` and verified in both directions, the `dev` → `main` PR merged with both hosts switched back to tracking `main`, and `dev` deleted. SkolarTrack is now fully live end-to-end: `skolar-track.vercel.app` → `skolartrack.onrender.com` → Neon. This file combines what was briefly split out as a separate Part 6 back into Part 5, since the combined file was still comfortably under the ~1,000-line threshold for starting a new part.)*