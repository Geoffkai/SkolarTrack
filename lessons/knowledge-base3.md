# Geoffrey's Software Engineering Knowledge Base — Part 3

> **Continuation of Part 1 and Part 2.** Part 1 covered Lessons 1–23 (PostgreSQL, `pg`, Express, middleware, bcrypt, JWT concept, MVC layers, HTTP status codes, debugging). Part 2 covered Lessons 24–36 (nodemon/npm scripts, login, JWT anatomy, request lifecycle, RBAC middleware, scholarship/application CRUD, layered validation, the admin view-applicants feature with its first JOIN). This file picks up at Lesson 37, starting the Day 9 frontend prep.
>
> **How to use this file:**
> Upload all three knowledge-base files to your Claude Project so every lesson is available in every chat.
> When you learn something new, tell Claude: *"Update my knowledge base with what we just learned about X"* and Claude will add it to the current part and give you an updated file to re-upload.

---

## Table of Contents (Part 3)

37. [Why Centralize API Calls — `services/api.js`](#lesson-37-why-centralize-api-calls--servicesapijs)
38. [JWT Storage Tradeoffs — `localStorage` vs `httpOnly` Cookies](#lesson-38-jwt-storage-tradeoffs--localstorage-vs-httponly-cookies)
39. [Frontend Route Access Mirrors Backend RBAC](#lesson-39-frontend-route-access-mirrors-backend-rbac)
40. [What "API" Actually Means — Two Different Meanings](#lesson-40-what-api-actually-means--two-different-meanings)
41. [Scaffolding with Vite — `npm create`, ESLint, and Why a Fake Folder Structure Doesn't Work](#lesson-41-scaffolding-with-vite--npm-create-eslint-and-why-a-fake-folder-structure-doesnt-work)
42. [JSX & Component Fundamentals — Self-Closing Tags, Capitalization, and Two Export Styles](#lesson-42-jsx--component-fundamentals--self-closing-tags-capitalization-and-two-export-styles)
43. [Wiring React Router — `BrowserRouter`/`Routes`/`Route` and How Route-Order Differs From Express](#lesson-43-wiring-react-router--browserrouterroutesroute-and-how-route-order-differs-from-express)
44. [`<Link>` and Client-Side Navigation — Why It's Not a Real Request](#lesson-44-link-and-client-side-navigation--why-its-not-a-real-request)
45. [Building `services/api.js` — Wrapping `fetch()`, `response.ok`, and Why `.json()` Matters](#lesson-45-building-servicesapijs--wrapping-fetch-responseok-and-why-json-matters)
46. [Debugging Round 3: Connection Refused vs. CORS — Two Different Frontend-to-Backend Failures](#lesson-46-debugging-round-3--connection-refused-vs-cors-two-different-frontend-to-backend-failures)
47. [React Hooks — Why Plain Variables Can't Track Input, `useState` vs. `useEffect`](#lesson-47-react-hooks--why-plain-variables-cant-track-input-usestate-vs-useeffect)
48. [Building the Real Register Form — Controlled Multi-Field Forms, `htmlFor`, and Missing Fields](#lesson-48-building-the-real-register-form--controlled-multi-field-forms-htmlfor-and-missing-fields)
49. [The Response-Body-Read-Twice Bug, and Register-vs-Auto-Login as a Deliberate Design Choice](#lesson-49-the-response-body-read-twice-bug-and-register-vs-auto-login-as-a-deliberate-design-choice)
50. [`useNavigate` and the SPA Navigation Model — Why the URL Changes But Nothing Is Fetched](#lesson-50-usenavigate-and-the-spa-navigation-model--why-the-url-changes-but-nothing-is-fetched)
51. [`ReferenceError`, Bare Identifiers vs. Strings, and Why a `catch` Block Can Hide a Real Bug](#lesson-51-referenceerror-bare-identifiers-vs-strings-and-why-a-catch-block-can-hide-a-real-bug)
52. [Commit Granularity — Splitting Logically Distinct Changes Instead of One Bundled Commit](#lesson-52-commit-granularity--splitting-logically-distinct-changes-instead-of-one-bundled-commit)

*(Lessons 1–23 are in Part 1. Lessons 24–36 are in Part 2.)*

---

## Lesson 37: Why Centralize API Calls — `services/api.js`

**Date learned:** 2026-07-05
**Tags:** `frontend` `architecture` `separation-of-concerns` `services` `day-9-prep`

`CLAUDE.md` has a rule: *"ALL API calls go through `client/src/services/api.js` — never inline `fetch()` in components."* Worth understanding *why*, not just following it, before Day 9 coding starts.

### The wrong instinct to correct first: this is NOT about security

The first guess is often "this stops students from reaching admin data" — but that's already handled, and handled somewhere else entirely. RBAC (`verifyToken`/`requireAdmin`/`requireStudent`, Lessons 29 & 34) is enforced on the **backend**, in the middleware chain, regardless of where the frontend's JavaScript physically lives. A student's browser calling `fetch()` from inside a page component vs. from `services/api.js` hits the *exact same* Express middleware either way and gets the *exact same* `401` either way. The location of the calling code changes nothing about who's allowed to see what. That guard already exists and doesn't need help from file organization.

### The actual problem: repetition of "how do I even reach the backend"

**The restaurant-waiter analogy:** every page component is a different waiter. Without centralizing, you're teaching each waiter individually exactly how to walk to the kitchen (the backend), which door to use (the base URL), what ticket format the chef expects (headers, including `Authorization: Bearer <token>`), and what to do if the chef says "sold out" (handling a `401` response). Eight pages = eight separate places that all memorized the same walking directions.

`services/api.js` is one expediter standing at the kitchen door. Every page just says "get me scholarship #42" — the expediter handles the actual trip: attaching the base URL, attaching the token header, and handling failure consistently.

### Where this actually pays off (concrete, not abstract)

- **Deploy day (Day 14):** the base URL changes from `http://localhost:3000` to a real Railway URL. One line changed in `api.js`, instead of hunting through every component file that inlined its own `fetch()`.
- **Every protected request needs the same header:** `Authorization: Bearer <token>`. Centralizing means writing that attachment logic **once**, not copy-pasted into every component that calls a protected route.
- **Consistent failure handling:** if a token expires, every request should behave the same way (e.g., redirect to `/login`). One place to write that once, instead of duplicating it — or worse, forgetting it in some components and not others.

### The general principle

Same "separation of concerns" reasoning as the backend's `routes → controllers → models` split (Lesson 21) — each layer changes for a different reason, so isolate the thing most likely to change (the network-reaching logic) into one place. Components should ask *what* they want; `api.js` should be the only place that knows *how* to go get it.

> One line: **`services/api.js` isn't a security boundary (RBAC already handles that, on the backend) — it exists so "how do we reach the backend" (base URL, auth headers, failure handling) is written once and changed once, instead of duplicated across every page component.**

---

## Lesson 38: JWT Storage Tradeoffs — `localStorage` vs `httpOnly` Cookies

**Date learned:** 2026-07-05
**Tags:** `jwt` `localstorage` `security` `xss` `csrf` `frontend` `day-9-prep`

`CLAUDE.md`'s Auth Flow section says the JWT is stored in `localStorage` on the client. Worth knowing *why* that choice was made and what it costs — a real, deliberately-accepted tradeoff, not an oversight.

### First, correcting a common misconception: `localStorage` is about persistence, not statelessness

"Stateless" (Lesson 20) describes the **server** — it keeps no session record, everything it needs is inside the token itself. That's a completely separate idea from `localStorage`, which is a **browser** storage mechanism that has nothing to do with the server's design.

The actual reason `localStorage` is used: it **persists** — it survives a page refresh, and even closing and reopening the browser. Without it, a JWT held only in a JS variable (in React state, say) would vanish the instant the page reloads, logging the student out constantly. `localStorage` is what makes "stay logged in for 7 days" (`JWT_EXPIRES_IN`) actually *feel* like 7 days from the user's side.

### The real tradeoff: `localStorage` is readable by any JavaScript on the page

Any script running in the page's context — including your own React code, but *also* any malicious script that manages to get injected (an XSS attack — Cross-Site Scripting, where a script that shouldn't be there gets executed on your page) — can read `localStorage` directly:

```javascript
localStorage.getItem("token")   // any script can run this, not just yours
```

If an attacker ever finds a way to run their own JavaScript on your site (e.g. through an unsanitized input field that gets rendered as HTML), they can lift the token straight out of storage and impersonate that user's session — no need to guess a password, no need to break `JWT_SECRET`. The token itself, sitting in plain reach, becomes the weak point.

### The alternative: `httpOnly` cookies

A cookie can be marked `httpOnly`, which makes it **invisible to JavaScript entirely** — the browser sends it automatically with requests, but no script (yours or an attacker's) can read or touch it. This closes the XSS-theft path completely.

It's not a free upgrade, though — it opens a different door: **CSRF** (Cross-Site Request Forgery), where a malicious site tricks a user's browser into automatically sending that cookie somewhere it shouldn't, since cookies are attached automatically. Defending against CSRF is its own separate mechanism (e.g. CSRF tokens, `SameSite` cookie settings) and more setup work than a plain `localStorage` token.

### Why this project chose `localStorage` anyway — and why that's a reasonable call

- No real users' financial or otherwise high-stakes data is on the line in a student portfolio project.
- `localStorage` is simpler to wire up — a straightforward `localStorage.setItem`/`getItem`, no cookie configuration, no CSRF-token plumbing.
- The risk is proportionate to what's actually being protected right now.

This is the shape of a **deliberately accepted tradeoff** — the same category of decision as choosing `PUT` = full-replacement over `COALESCE`-partial-updates (Lesson 35), or vague-on-purpose error messages (Lesson 25). Not a mistake to be embarrassed about — a known cost, consciously accepted, and namable in an interview if asked ("I used `localStorage` for the JWT; I know the XSS tradeoff versus `httpOnly` cookies, and chose it deliberately given the project's risk profile").

> One line: **`localStorage` persists the JWT across refreshes (that's *why* it's used, not because anything is "stateless" about it) — but any JavaScript on the page, including an attacker's via XSS, can read it; `httpOnly` cookies close that hole but open a CSRF one instead and cost more setup; choosing `localStorage` here is a deliberate, reasonable, and namable tradeoff for a project at this risk level, not an oversight.**

---

## Lesson 39: Frontend Route Access Mirrors Backend RBAC

**Date learned:** 2026-07-05
**Tags:** `rbac` `frontend` `routing` `day-9-prep` `architecture`

Before writing any React Router code, it's worth mapping all 8 pages from `scholarship-tracker-ph.md` against the exact same authentication/authorization split already built and tested on the backend (Lessons 29, 34) — because the frontend routes need to enforce the identical rule, just one layer up.

### The full mapping

| Route | Access required |
|---|---|
| `/register` | none |
| `/login` | none |
| `/scholarships` | none (public browsing) |
| `/scholarships/:id` | none (public browsing) |
| `/my-tracker` | valid **student** token |
| `/admin/dashboard` | valid **admin** token |
| `/admin/scholarships/new` | valid **admin** token |
| `/admin/scholarships/:id/edit` | valid **admin** token |

### Why "needs a token" alone isn't precise enough

An early pass at this table said the last four routes just "need a token" — true, but incomplete in the exact same way `verifyToken` alone was incomplete for RBAC on the backend (Lesson 34). A **valid admin token** hitting `/my-tracker` should be blocked just as surely as no token at all, since bookmarking scholarships is student-only territory by spec. "Logged in" and "allowed here" are still two separate questions on the frontend, mirroring the backend's `verifyToken` vs `requireAdmin`/`requireStudent` split — just enforced by a route guard component instead of Express middleware.

### The practical consequence for Day 9+

When building React Router's route protection (a "protected route" wrapper component, coming in Day 10/11), it needs to check **two things**, not one: is there a token at all, and does its decoded `role` match what this specific route requires? Same two-question shape as the backend, just running client-side, and importantly — **this is a UX convenience, not a security boundary.** The real enforcement still lives on the backend's RBAC middleware; the frontend check just prevents a logged-in student from *seeing* an admin page they'd get a `401` from anyway if they tried to actually fetch data. A determined attacker could bypass any frontend route guard entirely — which is exactly why the backend guard is the one that actually matters, and the frontend guard is just a nicer experience layered on top.

> One line: **the frontend's 8 pages split into "no token," "student token," and "admin token" — matching the backend's `verifyToken`/`requireStudent`/`requireAdmin` split exactly — and just like on the backend, "has a token" and "has the right role" are two separate checks; the frontend version of this check is a UX nicety, since the real security boundary is still the backend RBAC middleware that already exists and can't be bypassed by skipping the frontend guard.**

---

## Lesson 40: What "API" Actually Means — Two Different Meanings

**Date learned:** 2026-07-05
**Tags:** `api` `fundamentals` `web-api` `library-api` `terminology`

"API" gets used constantly across this project in two genuinely different senses, and it's worth pulling them apart explicitly before writing `services/api.js` — a file whose own name uses one of these meanings on purpose.

### Meaning 1 — a web API: a running service with a fixed menu of requests

This is what your Express server **is**, right now, listening on port 3000. Not a function inside your code — the whole running program, sitting there, reachable over a network (even if that network is currently just `localhost`), offering a fixed set of things it will do for you:

```
GET  /scholarships                     → "give me the list"
POST /auth/login                       → "verify my credentials"
GET  /scholarships/:id/applications    → "give me the applicants"
```

**The restaurant analogy:** the API is the *menu plus the counter*, not the kitchen. You don't walk into the kitchen and cook — you read the menu, pick an item, and hand your order across the counter. The API is the public-facing contract: here's what you can ask for, here's the shape of what you'll get back, without needing to know how the kitchen (the model/controller code, the database) actually does it.

Every Thunder Client request sent all project — `POST /auth/login`, `GET /scholarships/:id/applications` — was manually acting as a **client** talking to this **API**, by hand, before React exists to do it automatically. React and Thunder Client are doing the *exact same thing*: sending requests to the same web API. One's just a person clicking buttons; the other will be code.

### Meaning 2 — a library's API: just its exposed functions

When you `require("pg")` or `require("bcryptjs")`, that library also has an "API" — but this meaning is much smaller and purely local: it just means *the set of functions the library exposes for you to call* — `pool.query()`, `bcrypt.compare()`. No network involved at all. "API" here just means "the menu of functions this package hands you," nothing more.

### Where the two meanings collide, and why `api.js` is named that

`services/api.js` (Lesson 37) is the file that knows how to talk to your **web API** (Meaning 1) — your Express server, over an actual HTTP request via `fetch()`. Its own filename is naming exactly that role: "the file responsible for reaching our web API." It is not, itself, "an API" in either sense — it's the client-side code that *calls* one.

### The one-sentence disambiguator, for future confusion

If it's reachable over a network and has a fixed menu of requests (`GET`/`POST`/etc. + a path) → **web API** (your Express server; also anything you'd test in Thunder Client). If it's just "which functions does this installed package let me call" → **library API** (`pg`'s `Pool`, `bcryptjs`'s `compare`). Same three letters, genuinely different scale of thing — always ask "is this reachable over a network, or is it just functions in a package I installed?"

> One line: **"API" means either (1) a whole running, network-reachable service with a fixed menu of requests — your Express server, the thing Thunder Client and the future React app both talk to — or (2) the smaller, local sense of "which functions a library exposes" (`pg`'s `Pool`, `bcryptjs`'s `compare`); `services/api.js` is named for its job of reaching Meaning 1, and is not itself an API in either sense.**

---

## Lesson 41: Scaffolding with Vite — `npm create`, ESLint, and Why a Fake Folder Structure Doesn't Work

**Date learned:** 2026-07-06
**Tags:** `vite` `npm-create` `eslint` `scaffolding` `hmr` `day-9`

Before writing a single component, Day 9 started with a wrong turn worth remembering precisely, because the mistake generalizes far beyond this one folder.

### The wrong turn: a folder structure without the tool that builds it

An AI (not this mentoring chat) was asked "how do programs like this structure their folders," and it answered with a *description* of a typical React project layout — `components/`, `pages/`, `hooks/`, etc. — which then got manually recreated as empty folders, with blank `App.jsx`/`main.jsx` files sitting inside, never explained or understood.

**Why this doesn't work, stated plainly:** a folder structure is not a program. `App.jsx` and `main.jsx` being *present* as empty files means nothing — there was no `package.json` for the client, no Vite config, no installed dependencies, no dev server. It looked like a real project from a screenshot, but had no engine underneath it. Writing code into it would have hit a wall immediately — nothing would run, and worse, it would have been unclear *why* nothing ran, since the folders looked plausible.

**The deeper problem, tied to this project's whole purpose:** the goal stated from Day 1 was to understand every line, not copy a working shape without knowing why it works. A folder structure handed over with "I don't even know their purpose there" is exactly the failure mode the entire mentoring approach has been built to avoid. Caught early here, at zero cost — the fix was simply to delete it and let the real tool generate a real project.

### What `npm create vite@latest client` actually is

This is a **different mode of npm** from anything used on the backend so far. Contrast:

| | `npm install pg` | `npm create vite@latest client` |
|---|---|---|
| What it does | Downloads ONE library into an EXISTING project's `node_modules` | Downloads and RUNS A GENERATOR PROGRAM, once |
| What it produces | Nothing new structurally — just adds to `node_modules` | An entire new folder, pre-wired: `package.json`, `vite.config.js`, `index.html`, `src/App.jsx`, `src/main.jsx`, all correctly connected |
| Comparable to | Buying one ingredient | Following a recipe that assembles a whole starter kitchen |

Breaking down the command itself: `npm create` = "fetch and run a project generator" (a different job than `npm install`'s "add a library to what already exists"). `vite@latest` = which generator, and which version. `client` = the argument told to the generator — "name the new folder this."

This is *why* the AI-described empty-folder version could never have worked: describing what a generator's *output* looks like is not the same as running the generator. Only running it produces files with real, working, interconnected content.

### Why dependencies appeared to auto-download

Running the generator writes a `package.json` that *lists* `react`, `react-dom`, `vite`, etc. — but listing a dependency isn't the same as having its code on disk. The actual download still needed the ordinary `npm install` (the exact command already known from the backend), run once right after scaffolding, reading the generator's freshly-written shopping list and fulfilling it. Nothing new happened outside `npm install`'s normal job — the generator just wrote the list first.

### What Vite actually is, and what HMR means

**Vite** is a **build tool** with two separate jobs:
1. **Dev mode** (`npm run dev`) — starts a local server (e.g. `localhost:5173`) that serves the React code to the browser and watches files for changes.
2. **Build mode** (`npm run build`, coming Day 14) — bundles everything into optimized static files for actual deployment (Vercel).

**Parallel already known from the backend:** nodemon watches files and restarts the *server process* on save. Vite, in dev mode, watches files and updates the *browser* on save — same "the tool reloads itself so you don't have to" philosophy, on the frontend side.

**HMR (Hot Module Replacement)** — when a file is edited and saved, Vite pushes just the *changed piece* into the already-running browser page instantly, without a full page reload (and, crucially, without losing component state like a counter's current value). This is why the default starter page's own tip says "edit `src/App.jsx` and save to test HMR" — it's inviting a live demonstration of that instant-update behavior.

### What ESLint is, and why it's a genuinely new category of tool

**ESLint** is a **linter** — it reads source code without ever running it, and flags likely bugs or style violations live, as you type (the red squiggly lines in VS Code). This is a category distinct from everything used so far:

| Tool type | Example | What it does |
|---|---|---|
| Runtime | `node`, `nodemon` | Actually **runs** the code |
| Library | `pg`, `bcryptjs`, Express | Code your running program **calls** |
| Linter | **ESLint** | **Reads** code, never runs it, flags problems |

Two React-specific ESLint plugins came bundled with the scaffold:
- **`eslint-plugin-react-hooks`** — catches React-specific mistakes, most importantly using a Hook (like `useState`) somewhere it isn't allowed to be used — a rule impossible to even need before touching React.
- **`eslint-plugin-react-refresh`** — protects HMR from breaking due to how a component is written or exported.

ESLint was chosen over newer alternatives (e.g. Oxlint) for the same reason `bcryptjs` was chosen over an obscure hashing library back on Day 3: the well-documented, widely-used default has more available help when something goes wrong.

### A near-miss worth naming: `@types/react` isn't secretly TypeScript

`package.json`'s `devDependencies` include `@types/react` and `@types/react-dom` — which can look like a contradiction against the project's explicit "stay in plain JS" decision (`MISSION.md`). **They aren't TypeScript.** They're type-*definition* files that only feed the editor's autocomplete/hint engine (e.g., knowing what `useState` returns) — they don't require writing any `.ts` files or type annotations. Vite's React+JS template includes them purely for editor intelligence, at zero cost to the plain-JS decision already made.

### The proof-before-building check (same discipline as `/health`)

Scaffolding isn't trusted until it's *proven* — same instinct as Lesson 9's `/health` endpoint proving the backend's wiring before building on top of it. The check here: `npm run dev`, then confirm in an actual browser that `localhost:5173` shows the default Vite+React starter page, **and** that clicking the counter button actually increments it. The counter incrementing matters, not just the page loading — it proves React's state/re-render cycle is genuinely alive, not just that a static page got served.

> One line: **a folder structure is not a program — only running the real generator (`npm create vite@latest client`) produces a working scaffold, and `npm install` right after it just fulfills the shopping list the generator wrote; Vite is a build tool (dev server + HMR now, production bundling later) parallel to nodemon's "reload without manual restarts" role; ESLint is a genuinely new category — it reads code and flags problems without ever running it; `@types/react` is editor-hint tooling, not secret TypeScript; and scaffolding isn't trusted until proven live, the same "prove it before building on it" discipline as `/health`.**

---

## Lesson 42: JSX & Component Fundamentals — Self-Closing Tags, Capitalization, and Two Export Styles

**Date learned:** 2026-07-06
**Tags:** `jsx` `components` `capitalization` `export-default` `es-modules` `fragments` `day-9`

Before wiring any routes, the actual React syntax itself needed unpacking from scratch — none of it had an anchor yet. Every piece below was built by comparing to something already known from HTML or the backend, rather than memorized cold.

### JSX self-closing tags — the same rule as HTML's `<img />`

An element that never wraps other content is self-closed with `/>` — identical to `<img src="..." />` in plain HTML, which never wraps anything either. `<Route path="/scholarships" element={<Scholarships />} />` follows the exact same rule: `Route` is just a rule, not a container for visible content, so it self-closes.

Contrast with an element that *does* wrap other elements — like `<Routes>...</Routes>` — which needs a proper open/close pair, same as `<div>...</div>` wrapping child tags in HTML.

### Curly braces `{ }` in JSX mean "this is JavaScript, not a plain string"

```jsx
<Route path="/scholarships" element={<Scholarships />} />
```
- `path="/scholarships"` — an ordinary string attribute, exactly like `src="cat.jpg"`.
- `element={<Scholarships />}` — the curly braces signal "what's inside here is a JavaScript expression, not literal text." The expression inside happens to be another JSX element, `<Scholarships />`.

### A component is just a function that returns JSX

```jsx
function Scholarships() {
  return <h1>Scholarships Page</h1>;
}
```
Same shape as a backend controller:
```javascript
function getAll(req, res) {
  return res.status(200).json(scholarships);
}
```
Both are named functions that do work and return something. The only difference is *what* they return — JSON for a machine to consume vs. JSX for a human to see rendered.

### The capitalization rule — and the silent-failure bug it causes

**The one rule that makes something "a component" to React, rather than a literal HTML tag:** the function's name must start with a **capital letter**.

- `<div>` (lowercase) → React renders an actual HTML element.
- `<Scholarships />` (capitalized) → React calls the `Scholarships` function and renders whatever JSX it returns.

**The bug this causes when broken, caught live this session:** a component named `myTracker` (lowercase `m`) used as `<myTracker />` doesn't throw any error. React assumes it's an unknown, real HTML tag (`<mytracker>`), which browsers silently ignore rather than crash on. The result: nothing shows up where the component was expected, with **zero error message pointing at the cause** — the exact same category of bug as Lesson 34's silent RBAC gap. The fix is renaming the function to start with a capital letter, not changing anything about how it's used.

> **Tell to remember:** if a component you wrote isn't rendering, and there's no error anywhere in the console, check its name's first letter before anything else.

### Two export styles — `module.exports` (already known) vs `export default` (new)

Already known from the backend (Lesson 23's box analogy):
```javascript
module.exports = { register, login };            // a box with labeled compartments
const { register, login } = require("...");      // opens the box, pulls out by name — braces required, names must match
```

New today — **`export default`**, for files with exactly one main thing to hand out (the React convention: one component per file):
```jsx
export default Login;                 // "this file's ONE thing is Login — no label needed"
import Login from "./pages/Login";    // no braces — there's only one thing to grab
```

**The tell that separates the two, purely by the import line's syntax:** curly braces present = named export (`require`/`module.exports` style, or `import { x } from`). No curly braces = default export (`import x from`). With a default export, the name on the import side doesn't even have to match the original name (though matching it is the convention, for sanity).

| | Named export | Default export |
|---|---|---|
| Export syntax | `module.exports = { a, b }` | `export default Login` |
| Import syntax | `const { a, b } = require(...)` | `import Login from "..."` |
| Used for | Multiple things from one file | One main thing per file (a component) |
| Name must match? | Yes, exactly | No, though convention says match it |

**Also worth naming explicitly:** `export`/`import` is **ES Modules** syntax, genuinely different from the **CommonJS** (`require`/`module.exports`) syntax used throughout the whole backend. Same underlying goal — "share code between files" — but two different syntaxes that don't mix; a Vite/React frontend file uses ES Modules, an Express backend file (in this project) uses CommonJS.

### React Fragments (`<>...</>`) — JSX's one-root-element rule

A component's `return` can only return **one single root element** — sibling elements side by side at the top level aren't allowed. Vite's own default `App.jsx` boilerplate had several top-level `<section>`s that needed a container to satisfy this rule, without adding a real, visible extra `<div>` to the page. `<>...</>` (a **Fragment**, shorthand for `<React.Fragment>...</React.Fragment>`) is an invisible wrapper that solves exactly this — it groups multiple elements into one without leaving any trace in the actual rendered HTML.

> One line: **JSX self-closes elements with no content (`/>`), curly braces mark a JavaScript expression inside an attribute, a component is just a capitalized function returning JSX (lowercase-first silently fails to render, no error), `export default`/`import x from` is the one-thing-per-file counterpart to `module.exports`/`require`'s named-export style (ES Modules vs. CommonJS — different syntaxes for the same goal), and a Fragment (`<>...</>`) satisfies JSX's one-root-element rule without adding a real wrapper `<div>` to the page.**

---

## Lesson 43: Wiring React Router — `BrowserRouter`/`Routes`/`Route` and How Route-Order Differs From Express

**Date learned:** 2026-07-06
**Tags:** `react-router` `routing` `route-order` `day-9`

With the syntax fundamentals in place, the actual routing skeleton for all 8 pages got wired into `App.jsx` — the frontend equivalent of the backend's route files, mapping URLs to what should render instead of what should run.

### The core parallel to Express — already known, just one layer up

Express matches a **method + path** of an incoming request to a **handler function**:
```javascript
router.get("/scholarships/:id", getOne);
```
React Router matches just the **path** in the browser's URL bar to a **component**:
```jsx
<Route path="/scholarships/:id" element={<ScholarshipDetail />} />
```

| | Express (backend) | React Router (frontend) |
|---|---|---|
| What it matches | method + path of an incoming request | the path in the browser's URL bar |
| What it runs | a handler function | a component |
| `:id` syntax | `req.params.id` | `useParams()` (not yet covered) |
| Runs on | the server | entirely in the browser, no server round-trip for the match itself |

Same mental model in both cases: a list of path patterns, first/best match wins, hand off to whatever's registered for it.

### The three-layer hierarchy: `BrowserRouter` → `Routes` → `Route`

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/scholarships" element={<Scholarships />} />
  </Routes>
</BrowserRouter>
```

- **`BrowserRouter`** — the sensor. Watches the browser's actual URL and makes that information available to everything nested inside it. Set up once, at the top of the app — same category as `app.listen()`, a one-time "turn the system on," not something repeated per route.
- **`Routes`** (plural) — the rulebook/container. Holds the whole list of path-to-component rules together and does the actual matching against the current URL — the same "clipboard" role `express.Router()` plays for a group of related backend routes (Lesson 21).
- **`Route`** (singular) — one rule: "if the URL matches this `path`, render this `element`." Never wraps other content, so it self-closes.

The nesting is load-bearing, not decorative: `Routes` can't match anything without `BrowserRouter` feeding it the current URL first, and a `Route` outside a `Routes` wrapper has no rulebook to belong to.

### Route order: same-looking rule, genuinely different mechanism underneath

Express's route-order rule from Lesson 32 — literal paths must sit above variable (`:id`) paths, or the variable route silently swallows requests meant for the literal one — was assumed to carry over identically to React Router. **It mostly does, in effect, but the underlying mechanism is actually different**, worth knowing precisely rather than just pattern-matching the old rule onto a new tool:

- **Express** is strictly **first-match-wins, top-to-bottom.** If `/:id` is listed above a literal `/new`, `/new` gets silently caught by `/:id` and treated as an id — no error, just quietly wrong routing.
- **React Router v6+** (this project is on v7) uses a **ranking algorithm** — it scores every route by specificity and picks the *best* match, not simply the first one encountered. A literal path (`/scholarships/new`, hypothetically) would correctly out-rank `/scholarships/:id` **regardless of which order they're written in the file.**

**The practical takeaway:** listing specific/literal paths above variable ones is still good practice for React Router — for readability, and as a safety habit that also protects against older router versions or other frameworks that don't have this ranking behavior — but the actual silent-swallow *failure mode* Lesson 32 warned about isn't really a live risk in modern React Router the way it is in Express. Two tools that look like they solve the identical problem can still behave differently under the hood; worth checking rather than assuming a rule transfers 1:1 just because the syntax looks similar.

### A repeat of an old bug shape, this time via a typo instead of a missing import

While wiring the 8 routes, one `<Route>` referenced `<ScholarshipsDetail />` (extra "s") while the actual import at the top of the file was `ScholarshipDetail` (no extra "s"). This is the same failure category as Lesson 27's `ReferenceError: X is not defined` — the referenced name simply doesn't exist anywhere in the file, because nothing was ever imported under that exact spelling. The fix, as always with this error shape: match the exact name used at the import site to the exact name used at the point of use — no partial-credit for "close enough" spelling.

> One line: **React Router's `BrowserRouter → Routes → Route` mirrors Express's route-matching idea one layer up (path → component instead of path → handler), with `BrowserRouter` as the one-time URL sensor, `Routes` as the rulebook, and `Route` as one self-closed rule; route order matters for readability in both tools, but Express is strictly first-match-wins while modern React Router ranks by specificity — so the silent-swallow failure mode from Lesson 32 doesn't carry over identically; and a typo'd component name at the point of use, not matching the actual import, reproduces Lesson 27's `ReferenceError` bug shape exactly.**

---

## Lesson 44: `<Link>` and Client-Side Navigation — Why It's Not a Real Request

**Date learned:** 2026-07-06
**Tags:** `react-router` `link` `client-side-routing` `history-api` `urls` `day-9`

Once the 8-route skeleton was proven live, the next real question was how a user actually *moves* between pages — clicking, not retyping URLs by hand. This surfaced a genuinely important distinction: what looks like "requesting a page" in the browser's address bar is often not a network request at all.

### Why a plain `<a href="...">` is the wrong tool here

A normal HTML anchor tag tells the **browser** to do a full page navigation: send a real HTTP request for that path, throw away everything currently running in memory, and reload the entire page from scratch (React app included). That defeats the entire purpose of using React Router — the whole point was fast, in-app page swaps without reloading anything.

### `<Link>` — same look, completely different mechanism

```jsx
import { Link } from 'react-router-dom'

<Link to="/register">Register</Link>
```

Notice the prop is **`to`**, not `href` — different word on purpose, signaling this isn't a plain browser link. Visually it still renders as an `<a>` tag (underlined text, hand cursor), but it attaches its own click handler that runs *before* the browser's default behavior fires.

### What actually happens on click — traced precisely

1. `Link`'s click handler intercepts the click and **blocks the browser's default "fetch this URL" behavior** entirely — nothing gets sent over the network.
2. It updates the browser's **address bar** to show the new path (`/register`), using a browser feature called the History API — this is a cosmetic/bookkeeping change, not a network action. It's what makes the back/forward buttons work correctly and makes the URL bar *read* like a real navigation happened.
3. `BrowserRouter`, which is always watching the address bar, notices the change.
4. `Routes` re-checks its list of `<Route>`s against the new URL, finds the match, and swaps in the new component — the exact same matching logic that runs when a URL is typed by hand.

**The honest one-line summary:** clicking a `Link` *looks* like requesting a page from a server, but no request is actually sent. The URL bar changes, `Routes` picks a different component to render, and the browser tab itself never reloads. It's a client-side illusion of navigation, deliberately built to feel like the real thing (URL updates, back/forward works) without paying the cost of an actual page reload.

### Where a real request eventually *does* happen

Clicking `Link` is not where actual data-fetching occurs. That happens later, inside whatever a page component does *after* it renders — e.g., `Register.jsx` submitting a form will call `fetch()` (through `services/api.js`, Lesson 37) to actually hit the Express backend on port 3000 and create a user. That's a genuine network round-trip, categorically different from the mere act of navigating to the `/register` page in the first place.

### What `/` actually means in a URL, for the record

A URL breaks into `protocol://host:port/path` — e.g. `http://localhost:5173/register`. The `/` characters inside the path are separators (same job as in `/scholarships/1`, separating `scholarships` from the id). `/` alone (nothing after it) means "the root path," the default page. This is worth being explicit about since it's easy to have used `/` in dozens of routes without ever pinning down that it's just a separator character, not something with its own special meaning beyond that.

### Where `<Link>`s actually belong in the component tree

A common wrong guess: put `<Link>`s *inside* `<Routes>`, next to the `<Route>` definitions. This is incorrect, because `<Routes>`'s only job is to pick and render exactly **one** matching `<Route>` based on the current URL — it's a switch, not a general container. A `<Link>` isn't a routing rule, so `Routes` has no sensible way to treat it.

The correct placement: **inside `<BrowserRouter>`, but as a sibling *outside* `<Routes>`** — e.g., inside a `<nav>` sitting above the `<Routes>` block:

```jsx
<BrowserRouter>
  <nav>
    <Link to="/scholarships">Browse Scholarships</Link>
    <Link to="/login">Login</Link>
  </nav>

  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/scholarships" element={<Scholarships />} />
  </Routes>
</BrowserRouter>
```

**Why this shape makes sense:** `BrowserRouter` makes URL-awareness available to *everything* nested inside it, not just to `Routes` specifically. A nav bar doesn't need to "match" a URL — it needs to always be visible and able to trigger navigation, on every page, regardless of which route currently matches. So the nav bar is the **fixed** part of the page (same on every route), and `<Routes>` is the **variable** part — the "current page" hole that gets filled in differently depending on the URL. Same page, two different jobs.

> One line: **`<Link to="...">` renders like a normal `<a>` but intercepts the click, blocks the browser's real page-reload/request, updates the address bar via the History API, and lets `Routes` re-match and swap components — no actual network request happens until a page later calls `fetch()` for real; `/` in a URL is just a path separator; and `<Link>`s belong inside `<BrowserRouter>` but outside `<Routes>`, since `Routes` only ever renders one matched `<Route>` and isn't a general container for fixed UI like a nav bar.**

---

## Lesson 45: Building `services/api.js` — Wrapping `fetch()`, `response.ok`, and Why `.json()` Matters

**Date learned:** 2026-07-06
**Tags:** `fetch` `api.js` `response-object` `json` `day-9`

With the routing skeleton proven, the next piece was making `services/api.js` (Lesson 37's rationale) into an actual working file — the first genuine `fetch()` code in the project.

### Disambiguating "the API" one more time, concretely

Before writing anything, it needed re-clarifying that `api.js` is **not** "the API" — it's a small client-side helper file. The real API is the running Express server on port 3000 (Lesson 40, Meaning 1). `api.js`'s only job is to be the one place that knows *how* to reach that real API — same restaurant-expediter framing as Lesson 37, just made concrete in actual code for the first time.

### The `apiFetch` wrapper, built piece by piece

```javascript
// The one place this changes when deploying — swap this to the Railway URL on deployment
const BASE_URL = "http://localhost:3000";

// A shared wrapper around fetch() — every page calls this instead of writing fetch() directly
async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    // path gets glued onto BASE_URL (e.g. "/scholarships" -> "http://localhost:3000/scholarships")
    // ...options spreads in anything the caller passed (method, body, etc.)
    ...options,
    headers: {
      "Content-Type": "application/json", // tells the backend the body is JSON
      ...options.headers, // lets a caller add extra headers later (e.g. Authorization)
    },
  });

  // fetch() does NOT throw on a 401/404/500 — it only throws on real network failure.
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}`);
  }

  // response is a Response OBJECT (status, ok, headers...) — the body hasn't been
  // read/parsed yet. .json() reads it and parses it into the actual usable data.
  return response.json();
}

export default apiFetch;
```

### `response.ok` — a shortcut for the 2xx family, and why `fetch()` doesn't throw on its own

`response.ok` is a plain boolean, automatically `true` for any 2xx status code, `false` otherwise — a convenience check for exactly the "first digit = family" idea from Lesson 22.

**The genuinely important, slightly counter-intuitive fact:** `fetch()` does **not** throw an error just because the server responded with a `401` or `404`. From `fetch()`'s point of view, a round-trip that got *any* HTTP response — even an error one — completed successfully. `fetch()` only throws for real network failures (unreachable server, no connection, DNS failure). This means `response.ok` has to be checked **manually**, every time — skipping it would let an error response's JSON body silently flow through code that expects real data, the same category of oversight as forgetting to check `bcrypt.compare`'s return value or skipping a `!user` check after a lookup.

| | On the backend (Express) | On the frontend (`fetch`) |
|---|---|---|
| Who decides success/failure | You, explicitly, via `res.status(...)` | The server already decided — you're just reading it |
| How you check it | N/A — you're setting it | `response.ok` (shortcut) or `response.status` (exact code) |

### `response` is an object, not a string — and `.json()` is what unwraps it

A live misconception caught and corrected this session: `response` is **not** a string. It's a real `Response` **object** with properties (`.status`, `.ok`, `.headers`) and methods (`.json()`), wrapping a body that hasn't actually been read yet. Calling `.json()` reads that body and parses it from raw JSON text into a genuine JavaScript object or array — the actual usable data.

**The closest anchor already known from the backend:** this is the same relationship as `result` (the whole `pg` query result object — has `.rows`, `.rowCount`) versus `result.rows` (the actual array you want). `result` is the wrapper; `.rows` is the useful part inside it. `response` is the wrapper; `.json()` gets the useful part out of it — the only difference being `.rows` is a plain property, while `.json()` is an async method, because reading a network response body is itself an operation that takes real time.

### Why `.json()` happens inside `apiFetch`, once, and not in every caller

If `apiFetch` returned the raw `response` instead, every single page calling it would have to remember to call `.json()` themselves — moving the repetition up one level instead of eliminating it, defeating the whole point of centralizing (Lesson 37). Doing it once, here, means every caller gets real, ready-to-use data directly.

### What's deliberately not built yet

- No `Authorization` header logic yet — protected routes will need `Bearer <token>` attached, once a real login exists to produce a real token.
- No reading of the error body on failure — a `401` currently just throws a generic `Request failed 401`, discarding the backend's actual `{ error: "..." }` message. Fine for now; worth revisiting once real error messages need to show in the UI.

> One line: **`api.js` is a client-side helper, not "the API" itself — the real API is the running Express server; `apiFetch` centralizes the base URL, headers, and error-checking in one place; `response.ok` must be checked manually since `fetch()` only throws on genuine network failure, never on a server's own error status code; and `response` is an object wrapping an unread body — `.json()` reads and parses it into real usable data, done once inside the wrapper so every caller gets clean data back.**

---

## Lesson 46: Debugging Round 3 — Connection Refused vs. CORS, Two Different Frontend-to-Backend Failures

**Date learned:** 2026-07-06
**Tags:** `debugging` `cors` `connection-refused` `middleware` `fetch` `day-9`

The first real test of `apiFetch` against the live backend surfaced two genuinely new failure modes in sequence — neither one a code bug in the sense of the earlier debugging lessons (23, 27), but both essential to recognize by their exact wording.

### Failure 1 — `ERR_CONNECTION_REFUSED`

```
GET http://localhost:3000/scholarships
net::ERR_CONNECTION_REFUSED
```

**What it means, precisely:** nothing is listening on port 3000 at all. Not a 401, not a 404 — the browser couldn't even establish a connection. The cause was simple: the Express server (`cd server && npm run dev`) wasn't running in a separate terminal at the time of the test.

**The structural lesson, worth remembering going forward:** a full-stack dev session now requires **two servers running simultaneously, in two separate terminals** — Vite on port 5173 (the frontend) and Express on port 3000 (the backend). Forgetting to start one of them produces this exact error.

**Why this is the error category `fetch()` *does* throw on:** per Lesson 45, `fetch()` only throws for genuine network failures. A connection that's actively refused (nothing there to respond at all) is exactly that category — landing in a `.catch()` block as `TypeError: Failed to fetch`, distinct from a 401/404 which would land in the `!response.ok` branch instead, inside a successfully-received response.

### Failure 2 — CORS

Once the backend was running, a new and different error appeared:

```
Access to fetch at 'http://localhost:3000/scholarships' from origin 'http://localhost:5173'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What CORS actually is:** Cross-Origin Resource Sharing — a browser security rule that blocks JavaScript on one **origin** (protocol + domain + port, all three) from freely calling a server on a *different* origin, unless that server explicitly grants permission. `http://localhost:5173` (React/Vite) and `http://localhost:3000` (Express) count as **different origins** to the browser, purely because the port differs — despite both saying "localhost." This is the first time in the project two different ports have needed to talk to each other, which is why this hadn't come up before.

**Why the rule exists at all:** without it, a malicious website open in another tab could have its JavaScript quietly send requests to any other site's API — a bank's, an email provider's — using the browser's existing cookies/session to impersonate the logged-in user. CORS closes that path by requiring servers to explicitly opt in to being called cross-origin.

**Important distinction, easy to conflate:** CORS has nothing to do with `verifyToken`/`requireAdmin` RBAC. It's a browser-level block that happens *before* a request even reaches Express route handlers — a completely different layer, enforced by the browser itself, independent of anything the backend's own auth logic decides.

**The "preflight request" mentioned in the error:** for certain cross-origin requests, the browser first sends a quick `OPTIONS` request asking "is this origin welcome here?" *before* sending the real request. That preflight is what was failing — no answer was coming back approving `localhost:5173`.

### The fix: `cors` middleware

```bash
npm install cors
```

```javascript
// app.js
const cors = require("cors");
app.use(cors());
```

**Confirmed as middleware, correctly reasoned out from the shape alone (`app.use(...)`) before being told:** `cors()` is a **global** guard (Lesson 28's distinction) — it runs on every request, checking whether the requesting origin is allowed, and answering the browser's preflight check with the right `Access-Control-Allow-Origin` header. Once the browser sees that header, it lets the real request through to the actual route handler.

**Why it has to sit above the routes, same reasoning as `express.json()`:** it's a gatekeeper — it has to clear (or reject) a request before anything else touches it.

```javascript
app.use(cors());          // global — checked first
app.use(express.json());  // global — parses the body next
app.use("/auth", authRoutes);
```

**`cors()` with no arguments allows any origin** — fine for local development, but a detail flagged for Day 14: a real production deploy should lock this down to the actual deployed frontend's domain, not left wide open indefinitely.

### The end-to-end proof

After both fixes, the console showed `Got data: Array(1)` with a real scholarship row pulled from Neon — the full chain (`React → apiFetch → CORS cleared → Express → PostgreSQL → back to the browser`) proven working for the first time, the frontend equivalent of Lesson 9's `/health` check finally closing the loop between both halves of the project.

> One line: **`ERR_CONNECTION_REFUSED` means nothing is listening on that port at all (the backend server wasn't running) and is the genuine-network-failure category `fetch()` throws on directly; a CORS error means the backend *is* running but hasn't granted permission for this specific origin (port) to call it, a browser-enforced security layer unrelated to any backend auth logic, fixed with the global `cors()` middleware sitting above the routes exactly like `express.json()`; and getting real data back through the full chain for the first time is the frontend/backend equivalent of the original `/health` proof.**

---

## Lesson 47: React Hooks — Why Plain Variables Can't Track Input, `useState` vs. `useEffect`

**Date learned:** 2026-07-06
**Tags:** `hooks` `usestate` `useeffect` `re-render` `fundamentals` `day-9`

Before building the real `Register.jsx` form, the actual mechanics of why a plain JS variable can't track form input needed to be understood from first principles — not just "use `useState` because React says so."

### Why a plain `let` variable silently fails to track input

```jsx
function Register() {
  let email = "";
  return <input value={email} onChange={(e) => { email = e.target.value; }} />;
}
```

**The core fact to internalize: every re-render is React calling the component function again, completely fresh, from the top — not the same function call continuing to run.** A component is just a function (Lesson 42); "rendering" means React calls it and uses whatever JSX comes back this time.

Local variables inside any function — in any language, including the Java background already known — do not survive between *separate calls* of that function. `let email = ""` runs fresh every single time `Register()` is called. Tracing what actually happens with a plain variable:

1. First render: `email` starts as `""`.
2. User types "g": the `onChange` handler runs `email = "g"` — this genuinely changes the variable, in memory, for a moment.
3. **But nothing tells React to re-render** — a plain reassignment is invisible to React's tracking system. The screen still shows whatever was drawn in step 1.
4. If a re-render *does* eventually happen for some unrelated reason, `Register()` runs again from scratch — `let email = ""` executes again, **resetting** `email` back to empty, erasing the "g" entirely, because that value only ever lived inside the now-finished previous function call.

**So it's not accurate to say "nothing happens" — a value does change, briefly and invisibly, and then gets wiped out the next time the component happens to re-render for any other reason.**

### What a Hook actually is

**A Hook is a special function, provided by React, that lets a component tap into capabilities a plain function structurally cannot have on its own** — remembering a value across separate function calls, or running code at a specific point in the rendering lifecycle. Every Hook's name starts with `use` (`useState`, `useEffect`, and later `useParams`/`useNavigate`) — a deliberate naming convention signaling "this reaches into React's internals," not an ordinary function.

**One firm rule, enforced by `eslint-plugin-react-hooks` (Lesson 41):** Hooks must be called plainly at the top level of a component — never inside an `if`, a loop, or a nested function. React tracks Hooks by the order they're called across renders, so conditional calling breaks that tracking.

### `useState` — a value that survives across renders

```jsx
const [email, setEmail] = useState("");
```

- `useState("")` gives back exactly two things: the current value, and a function for changing it. `const [email, setEmail] = ...` is plain JS array destructuring (nothing React-specific) pulling them out by position — the names are chosen by the developer, but `[thing, setThing]` is the standard convention.
- **Crucially, the value lives outside any single function call, in React's own internal storage, tied to this specific component instance.** Calling `setEmail("g")` does two things: (1) updates React's *stored* value for this slot, and (2) **schedules a re-render.** On the next call to `Register()`, `useState("")` doesn't reset to `""` — React recognizes a stored value already exists for this slot and hands that back instead.
- **The setter is never optional or bypassable** — `email` itself must never be reassigned directly (`email = "x"` — often disallowed outright since it's declared `const`). The *only* sanctioned way to change it is calling `setEmail(...)`.

**The precise, correct direction of causation, worth stating explicitly since it's easy to get backwards:** it is NOT "something changes, therefore React re-renders." It is **"calling the setter function is what causes the re-render"** — a deliberate signal sent to React, not an automatic reaction to data being different. Nothing else triggers a re-render — not time passing, not a variable being reassigned, not touching the DOM directly.

| | Plain `let` | `useState` |
|---|---|---|
| Where the value lives | Inside the function call — dies when the call ends | Outside the function, in React's own memory, tied to this component |
| Survives a re-render? | No — resets to its initial value every time | Yes — persists, handed back on the next call |
| Does changing it cause a re-render? | No — invisible to React | Yes — that is the entire job of the setter function |

**A useful anchor already known from the backend:** this parallels `req.user` (Lesson 30) — a property surviving because it's attached to the *same* `req` object handed forward through the whole request, rather than being a local variable scoped to just one function call that vanishes when that function returns. `useState`'s stored value is conceptually similar: it lives somewhere outside the current function invocation specifically so it can persist and be handed back later.

### `useEffect` — running code automatically, at a controlled moment, separate from rendering itself

```jsx
useEffect(() => {
  apiFetch("/scholarships")
    .then((data) => console.log("Got data:", data))
    .catch((err) => console.error("Error:", err));
}, []);
```

Two arguments:
1. **A function** — the actual code to run. This is called a **side effect**: something reaching *outside* the component (a network request here) rather than just computing what to display.
2. **A dependency array** — `[]` (empty) means *"run this once, right after the component's first render, and never again on subsequent re-renders."*

**Why this can't just be plain code sitting in the function body:** every render is a fresh call to the component function. Code placed directly in the body (not inside `useEffect`) would re-run on **every single render** — including every re-render triggered by an unrelated `useState` update, such as typing a single character into an input elsewhere on the page. That would mean firing a fresh network request on every keystroke. `useEffect` with `[]` is specifically the tool for saying "this is a side effect, not part of computing the display — run it once, on first load, and don't repeat it just because something else caused a re-render."

### `useState` vs. `useEffect`, side by side

| | `useState` | `useEffect` |
|---|---|---|
| What it provides | A value that persists across renders, plus a setter | A function that runs automatically, at a controlled moment |
| Triggers a re-render itself? | Yes, when the setter is called | Not by itself (though code inside it might call a setter, which would) |
| When does its code actually run? | Reading the value happens on every render; nothing "runs" on its own | Runs *after* a render, gated by the dependency array — `[]` = once, after the first render only |
| Used for, in this project | Tracking what's typed into a form field | The one-time test call proving `apiFetch` could reach the real backend |

**A concrete distinction worth flagging:** the test `useEffect` used to prove `apiFetch` worked (Lesson 46) is scaffolding, not something a real registration form needs — the real form only calls `apiFetch` **on submit**, inside a click/form event handler, a completely different trigger than "run once when the page loads."

> One line: **every re-render is a fresh call to the component function, so a plain local variable can't survive between renders and any change to it gets silently erased the next time something else causes a re-render; `useState` solves this by storing the value outside the function call, in React's own memory, and its setter is what actually *causes* the re-render (not the other way around); `useEffect` solves a different problem — running a side effect (like a network call) at a controlled moment (`[]` = once, after first render) instead of on every render; and both are Hooks — React-provided functions, always named `use...`, that must be called plainly at a component's top level, never inside conditionals or loops.**

---

## Lesson 48: Building the Real Register Form — Controlled Multi-Field Forms, `htmlFor`, and Missing Fields

**Date learned:** 2026-07-06
**Tags:** `forms` `controlled-inputs` `htmlfor` `closures` `validation` `day-9`

With `useState`/`useEffect` understood, the actual `Register.jsx` form got built — the first real, multi-field controlled form in the project, and the first place a submit handler needed to reach into a component's own state.

### The controlled input pattern, scaled to a whole form

One field, the pattern already known:
```jsx
<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
```
`value={email}` means React fully controls what's displayed — not the browser's default input behavior. `onChange` fires on every keystroke, immediately syncing state to match. A full form is just this same pairing repeated once per field, each with its own `useState`.

### JSX that isn't returned is thrown away — a live example

An early draft had the `<form>` JSX sitting as a bare expression in the middle of the function body, with a separate `return <h1>...</h1>;` below it. **JSX that isn't `return`ed (or assigned/passed somewhere) is computed and immediately discarded** — the same as writing `5 + 5;` alone on a line and never using the result. Only what's actually inside the `return` statement is what React sees and renders. The fix was moving the whole `<form>` block to be the thing returned.

### Where `handleSubmit` has to live — closures, not an arbitrary rule

A submit handler needs `email`, `name`, `password`, `role` (and their setters) to do its job — but those only exist as local variables *inside* `Register()`, created fresh by each call to `useState` during that specific render. A function defined **outside** `Register` would have no way to reach them at all.

This is ordinary JavaScript scoping, not a React-specific rule: a function defined *inside* another function can see and use that outer function's local variables — this is called a **closure**. A function defined outside cannot see them. Since a component's state only exists during its own function call, anything needing that state must be defined inside it, where it can "see" it.

### The `htmlFor`/`id` mismatch bug — a copy-paste trap

```jsx
<label htmlFor="email">Email</label>
<input id="email" ... />                {/* ✅ matches */}

<label htmlFor="email">Name</label>      {/* ❌ still says "email" */}
<input id="name" ... />                   {/* but id is "name" */}
```

Copying a label/input pair and only updating the visible text, not the `htmlFor`/`id` values, produces a working-looking but subtly broken form. `htmlFor="X"` tells the browser "this label describes the input with `id="X"`," enabling a real accessibility feature — clicking the label text focuses the matching input. With the mismatch, clicking "Name" would incorrectly focus the **email** input instead. Not a crash, not visible unless actually tested by clicking labels — a genuinely easy bug to ship unnoticed.

### A field the backend required that the form didn't send — reading the real error properly

The first submit attempt returned `400 Bad Request`. The static error message returned by the backend read: `"email, password, role are required"` — which, misleadingly, listed **all three** fields the guard checks, not specifically which one was actually missing:

```javascript
// backend
if (!email || !password || !role) {
  return res.status(400).json({ error: "email, password, role are required" });
}
```

**The precise lesson:** an `||` guard's error message, if written as one static string naming every field it checks, does not tell you which specific field tripped the check — only that *at least one* did. It's easy to misread a message like this as "all three are currently missing" when the truth might be (and here, was) just one. The real missing field (`role`) had been correctly suspected earlier, purely by re-reading the actual controller code — worth remembering that checking the source directly settles ambiguity a message's wording can't.

**The fix:** the form genuinely had no way to submit `role` at all — a `<select>` was added, with `useState("student")` as a deliberately-chosen default (most registrants being students, per the actual spec — a product decision worth naming, not silently defaulting into).

> One line: **JSX only renders if it's actually returned, not just written somewhere in the function body; a submit handler must live inside the component to access its state via closures — ordinary JS scoping, not a React-specific rule; a copy-pasted `<label htmlFor>` that isn't updated to match its input's `id` silently breaks the label's click-to-focus behavior without throwing any error; and a combined `||` validation guard's static error message can list every field it checks without indicating which one actually failed — re-check the source directly when a message is ambiguous.**

---

## Lesson 49: The Response-Body-Read-Twice Bug, and Register-vs-Auto-Login as a Deliberate Design Choice

**Date learned:** 2026-07-06
**Tags:** `fetch` `response-stream` `debugging` `design-decision` `day-9`

Once the `role` field was added and registration succeeded on the backend (confirmed by checking the database directly), a new, purely client-side error appeared — followed by a genuine design question worth deciding on purpose rather than defaulting into.

### The bug: reading a `Response` body twice

```javascript
const data = await response.json();   // first read — succeeds

if (!response.ok) {
  throw new Error(data.error || `Request failed ${response.status}`);
}

return response.json();   // ❌ second read on the SAME response — throws
```

Error produced:
```
TypeError: Failed to execute 'json' on 'Response': body stream already read
```

**The precise mechanism:** a `Response`'s body is a **stream**, and reading it **consumes** it — not like reading a property twice (harmless), but like opening a sealed envelope once: it cannot be "re-opened" to get the same letter out again. `.json()` had already been called once (correctly, to support the new error-reading logic from Lesson 46), but an old `return response.json();` line — a leftover from before that fix — was still calling it a second time on the way out, on the success path. Since the error only threw *after* the `!response.ok` check passed, this specific bug only manifested on **successful** requests, which is exactly why it didn't show up during the earlier `400` failures.

**The fix:** read the body exactly once, store it, and reuse that stored value everywhere after:
```javascript
const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || `Request failed ${response.status}`);
}

return data;   // reuse what was already parsed — never call .json() again on this response
```

**A useful anchor to this bug's category:** unlike, say, `result.rows` from `pg` (a plain property you can read as many times as you like), `response.json()` is an operation with a side effect — it drains something that can only be drained once. Worth remembering as a general caution around any stream-like API: read once, keep the result, don't call the read method again expecting the same data.

### A genuine design decision: separate login step vs. auto-login after registering

The project's `register` deliberately does **not** return a token — a user has to make a separate trip to `/login` after creating an account, rather than being auto-logged-in immediately. Worth evaluating this on purpose rather than assuming either approach is "the" correct one, since both are legitimate, real-world patterns:

**Arguments for the separate-login design (what this project has):**
- Cleaner separation of responsibilities — `register` only creates a user, `login` only verifies + issues a token. Matches the "each function does one job" discipline already followed throughout the backend (Lesson 21).
- Immediately re-proves the credential works, catching a typo'd password early.
- Common in real institutional/government-adjacent software (relevant given the project's actual target audience) — often because email verification sits between the two steps in production systems.

**Arguments for auto-login instead:**
- Slightly less friction for the user — one fewer form immediately after filling one out.
- Common in fast, consumer-growth-oriented apps prioritizing minimal steps.

**Why the current choice fits this specific project:** given `MISSION.md`'s framing (a portfolio piece demonstrating full-stack fundamentals, not a consumer growth product) and the backend's consistent one-job-per-function discipline throughout, the separate-login design is a reasonable, deliberate fit — not a shortcut or an oversight to "fix" later.

**The consequence for frontend work still ahead:** since registration doesn't auto-login, `Register.jsx` needs to explicitly redirect the user to `/login` on success, rather than storing a token and treating them as logged in immediately. That redirect requires `useNavigate` — a Hook for triggering navigation from code rather than a user click — not yet covered, and the natural next piece of frontend work.

> One line: **a `Response` body is a stream that can only be read once — calling `.json()` a second time throws, so read it once into a variable and reuse that variable everywhere after; and choosing whether registration should auto-login or require a separate login step is a real, evaluable design decision (both patterns are legitimate) rather than something to default into — this project's separate-login choice fits its one-job-per-function backend discipline and its portfolio-not-consumer-product framing.**

---

## Lesson 50: `useNavigate` and the SPA Navigation Model — Why the URL Changes But Nothing Is Fetched

**Date learned:** 2026-07-06
**Tags:** `react-router` `useNavigate` `spa` `history-api` `day-9` `day-10`

Building the register→login redirect surfaced a much bigger question worth nailing down properly: what does "navigating" even mean in a single-page app, and how is that different from the request/response cycle already deeply understood from the backend?

### The kitchen metaphor

A traditional website is a restaurant where **the recipe book (code) lives in the kitchen, written ahead of time, before any customer walks in.** Every time a customer orders ("clicks a link"), the chef re-opens that same book and cooks a brand new plate from scratch — that's the server building and returning a whole new HTML document, every single click.

A React SPA changes the deal: the **entire recipe book gets copied into your own kitchen at home** the first time you visit (the JS bundle downloads once). After that, you don't call the restaurant back for a new plate every time — you already have the recipe. You only call the restaurant when you need fresh **ingredients** (data) — a scholarship list, a login result — never for the recipe itself again.

### Two separate things that live in different places

A recurring confusion: "is the code stored in the database?" No — **code** (`.jsx` files, or a traditional server's HTML templates) is a file that already exists on disk, written ahead of time by the developer. **Data** (a user's email, a scholarship's deadline) is rows in the database, fetched at request-time. A traditional server's job per-request is gluing the two together (read the template file, query the DB, combine, send HTML back). A React SPA does the "gluing code together" step once, ahead of time, at build time (`npm run build`, Day 14) — the finished bundle is just static files Vercel hosts. The *only* thing still crossing the network after that first load is data, as plain JSON, through `apiFetch` — never HTML, never UI.

### What `useNavigate` actually does — and the real/fake split

`<Link>` is a signpost the user clicks. `useNavigate` hands the *code* the equivalent power — call `navigate("/login")` from inside `handleSubmit`, no click involved, and React Router does what a `<Link to="/login">` click would have done.

Importantly, the URL change is **real, not simulated**: `navigate()` calls the browser's History API (`pushState` under the hood), which genuinely rewrites the address bar, adds a real back/forward history entry, and produces a bookmarkable URL. What's *not* real is any accompanying network request. Normally (in the old model) "the address bar changes" and "a new page gets fetched from a server" are bundled together as one event. React Router splits them apart: it keeps the URL change, drops the fetch.

This means navigating to `/login` and *submitting* the login form are two entirely separate events that just happen to sit next to each other in the flow:
1. **Rendering `/login`** (via `<Link>` or `navigate()`) — pure UI swap, zero network, the server never even knows it happened.
2. **Submitting the login form** — `handleSubmit` fires, `apiFetch("/auth/login", ...)` makes the real network call, server checks credentials, sends back a token.

### The wrinkle to remember for Day 14 (not to solve now)

Hitting the browser's **refresh** button always sends a real request to the server, SPA or not — refresh doesn't know or care about client-side routing. Right now, Vite's dev server already handles this transparently. On deploy day, **Vercel needs an explicit rewrite rule** telling it "for any path that isn't a real static file, just serve `index.html` and let React Router take over client-side" — otherwise refreshing on anything but `/` would 404. Flagged now so it doesn't look like a mystery bug later.

### The import bug this surfaced — named exports have to come from the module that actually exports them

`useNavigate` is **not** part of core React — it's exported by `react-router-dom`, a separate library installed on top of React specifically for routing. `useState`/`useEffect` come from `'react'`; `useNavigate`/`useParams`/`<Link>`/`<BrowserRouter>` all come from `'react-router-dom'`. Importing `useNavigate` from `'react'` is the ES-module-import version of Lesson 23's `require`/`module.exports` shape mismatch — asking a box for something that was never packed inside it. The fix isn't logic — it's making sure each named import is pulled from the module that actually defines it.

> One line: **the SPA bundle (code) downloads once and lives in the browser like a copied recipe book; `navigate()` genuinely changes the URL via the History API but triggers zero network activity on its own — a network request only happens when a *separate* piece of code (`apiFetch` inside a submit handler) explicitly makes one; and `useNavigate` must be imported from `react-router-dom`, not `react`, since core React never defined it.**

---

## Lesson 51: `ReferenceError`, Bare Identifiers vs. Strings, and Why a `catch` Block Can Hide a Real Bug

**Date learned:** 2026-07-06
**Tags:** `debugging` `referenceerror` `localstorage` `try-catch` `day-10`

Building `Login.jsx`'s success handler produced a bug that *looked* like nothing happened — no visible crash, no red overlay — which turned out to be one of the more important debugging lessons so far, precisely because it hid so well.

### The bug: an unquoted key

```javascript
localStorage.setItem(token, data.token);   // ❌ token is not a string here — it's a variable reference
```

`localStorage.setItem(key, value)` expects **two strings**: `key` is an arbitrary label you choose for where the value gets stored, `value` is what gets stored under it. Written bare and unquoted, `token` is JavaScript trying to look up a **variable** named `token` — and nothing in the component ever declared one (the actual token lives at `data.token`). Reading an identifier that was never declared **always throws** — a `ReferenceError: token is not defined` — with no exceptions, in every mode.

### Why it looked silent — the `catch` block was doing its job

The `ReferenceError` fired immediately, inside the `try` block, and was caught by the component's own `catch (error) { console.error("Login failed:", error); }`. Nothing was actually silent at the JS-engine level — the error was loud and real. It just got funneled into a generic log line that looks *identical* whether the real cause is "wrong password" (a legitimate `401`, expected) or "there's an actual bug in my code" (a `ReferenceError`, not expected at all). Without opening the browser console and reading what `error` actually contains, both cases present themselves as the exact same "Login failed" — worth remembering as a general caution: **a `catch` block groups every kind of failure under one handler; skimming past it without reading the real error text can hide a genuine bug behind what looks like ordinary, expected failure.**

### The fix, and the proof it actually worked

```javascript
localStorage.setItem("token", data.token);   // ✅ "token" is the key (a string label), data.token is the value
```

Confirmed by actually inspecting storage directly (DevTools → Application → Local Storage → the site's origin) rather than trusting the absence of a visible error: a real `token` key appeared, holding a genuine JWT string starting with `eyJ` — the recognizable base64'd `{"alg":"HS256",...}` header from Lesson 20, now seen for real instead of just on jwt.io. Proof-by-direct-inspection, not proof-by-nothing-broke — the same discipline as Lesson 26's soft-delete verification (a `200` response alone never proves a write actually happened; go look at the actual data).

> One line: **a bare, unquoted identifier is a variable lookup, not a string — if that variable was never declared, JS throws a `ReferenceError` immediately, every time, with no silent-failure mode; a `try/catch` can make a real bug look identical to an expected failure unless you actually read what's inside the caught `error`; and confirming a fix worked means inspecting the real data directly (DevTools' Local Storage tab), not just noticing that nothing visibly broke.**

---

## Lesson 52: Commit Granularity — Splitting Logically Distinct Changes Instead of One Bundled Commit

**Date learned:** 2026-07-06
**Tags:** `git` `version-control` `commit-hygiene` `workflow` `day-10`

With the register→login→token-storage loop fully working, five files sat staged at once in VS Code's Source Control panel — a natural moment to pause on *how* to commit, not just *that* to commit, since the files staged together weren't actually one kind of change.

### Three different kinds of change, sitting in one pile

- **Real feature work:** `Login.jsx` and `Register.jsx` (the actual login/register flow).
- **Cleanup/deletion:** leftover `App.jsx`/`main.jsx` under `client_old/` — dead weight from the earlier fake-scaffold mistake (Lesson 41), unrelated to the feature work.
- **Documentation:** an update to the lesson timeline file — unrelated to both of the above.

### Why bundling them into one commit is a real (if minor) cost

A commit's message is supposed to describe what that commit did. `feat: implement Login and Register components...` is *true* of two of the five staged files, but says nothing about a deletion or a docs update quietly riding along inside it. Months later, `git log` or `git blame` on that deleted folder, or on the docs file, would point at a commit whose message never mentions either — the history technically has the information, but it's buried somewhere a future search wouldn't think to look.

### The principle: one commit, one coherent story

An **atomic commit** — one whose changes all serve a single, describable purpose — keeps `git log` genuinely useful as a record, not just a technically-complete one. This project's own commit history already showed this discipline being followed elsewhere (separate `feat:`/`fix:` entries for separate pieces of work); the fix here is just noticing when the *staging area* has drifted away from that habit, not learning a brand new rule.

**The practical move:** stage and commit in groups that match the actual kinds of change, rather than committing everything just because it happened to be sitting there together:
```
feat: complete register-to-login flow with token storage
chore: remove leftover client_old scaffold
docs: update lesson timeline through Lesson 50
```
`chore:` and `docs:` are the same conventional-commit-prefix family as the `feat:`/`fix:` already in use — maintenance and documentation-only changes get their own category rather than being folded into feature work.

### The tradeoff, named honestly

For a solo portfolio project, committing all five files together in one commit isn't a real mistake — it's a legitimate trade of a slightly messier `git log` for slightly less ceremony. Worth naming as a deliberate choice if that's the call made, the same way `localStorage`-over-`httpOnly-cookies` (Lesson 38) was named as a deliberate, acceptable tradeoff rather than an oversight — not something to feel obligated to "fix" every single time.

> One line: **a commit's message should describe everything actually staged inside it — bundling unrelated feature work, cleanup, and docs changes into one commit buries the smaller changes from future `git log`/`git blame` searches; splitting into `feat:`/`chore:`/`docs:` commits (mirroring prefixes already used in this project's own history) keeps history genuinely searchable; and for a low-stakes solo project, choosing not to split is a legitimate, namable tradeoff rather than a mistake.**

---

## Part 3 Cheatsheet Additions

### New terms

| Term | One-line definition |
|---|---|
| `services/api.js` | The one file that knows how to reach the backend (base URL, auth headers, failure handling) — components ask it for data, never call `fetch()` directly |
| web API | A running, network-reachable service with a fixed menu of requests (e.g. your Express server) — what Thunder Client and React both talk to |
| library API | The smaller sense: just the functions a library exposes for you to call (e.g. `pool.query()`, `bcrypt.compare()`) — no network involved |
| `localStorage` | Browser storage that persists across refreshes/reopens — used to keep a JWT "logged in" between visits |
| XSS (Cross-Site Scripting) | An attack where a malicious script gets executed on your page; if it runs, it can read anything in `localStorage`, including a JWT |
| `httpOnly` cookie | A cookie flag making it invisible to JavaScript entirely — closes the XSS-theft path for tokens, at the cost of needing CSRF protection instead |
| CSRF (Cross-Site Request Forgery) | An attack where a malicious site tricks a browser into sending cookies somewhere they shouldn't — the tradeoff cost of using cookies instead of `localStorage` |
| deliberately accepted tradeoff | A known cost consciously chosen over an alternative, given the project's actual risk level (e.g. `localStorage` over `httpOnly` cookies for a student portfolio project) — namable in an interview, not a mistake |
| frontend route guard | A client-side check (token present? correct role?) that improves UX by hiding pages a user can't use — NOT the real security boundary; that's still the backend's RBAC middleware |
| `npm create <tool>@latest <name>` | A different npm mode than `npm install` — fetches and runs a project GENERATOR once, producing a whole new pre-wired folder, instead of adding one library to an existing project |
| Vite | A frontend build tool: dev server + Hot Module Replacement while building, production bundling (`npm run build`) at deploy time |
| HMR (Hot Module Replacement) | Vite pushes just the changed piece of code into the already-running browser page on save — no full reload, component state (like a counter) survives |
| linter | A tool (ESLint) that reads source code and flags likely bugs/style issues WITHOUT ever running it — a category distinct from runtimes (`node`) and libraries (`pg`) |
| `@types/react` | Type-definition files that power editor autocomplete/hints only — not TypeScript, requires no `.ts` files or type annotations |
| JSX self-closing tag | `<Route ... />` — used when an element never wraps other content, same rule as HTML's `<img />` |
| `{ }` in JSX | Marks the attribute's value as a JavaScript expression, not a plain string (e.g. `element={<Login />}`) |
| component (React) | A function whose name starts with a capital letter and returns JSX — capitalization is how React tells it apart from a real HTML tag |
| lowercase component bug | A component named with a lowercase first letter renders as nothing, with no error — React assumes it's an unknown HTML tag instead of calling the function |
| `export default` | The one-thing-per-file export style (React convention): `import Name from "path"`, no braces, name doesn't have to match on import |
| ES Modules vs CommonJS | `import`/`export` (frontend, Vite/React) vs `require`/`module.exports` (backend, Node/Express) — two different module syntaxes, not interchangeable |
| Fragment (`<>...</>`) | An invisible wrapper satisfying JSX's one-root-element rule, without adding a real extra `<div>` to the rendered page |
| `BrowserRouter` | The React Router component that watches the browser's URL and makes it available to everything nested inside — set up once, like `app.listen()` |
| `Routes` | The container/rulebook holding all `<Route>` rules together and performing the actual URL-to-component match |
| `Route` | One rule: "if the URL matches this `path`, render this `element`" — self-closing, mirrors one Express route line one layer up |
| React Router ranking | Modern React Router (v6+) scores routes by specificity and picks the best match, unlike Express's strict first-match-wins — route order matters less for correctness, though it's still good practice |
| `<Link to="...">` | React Router's navigation component — looks like an `<a>` tag but intercepts the click, blocks the real page reload, and lets `Routes` swap components client-side instead |
| client-side navigation | Clicking a `Link` updates the address bar (via the History API) and triggers `Routes` to re-match and render a different component — no actual network request is sent, unlike a plain `<a href>` |
| History API | The browser feature `Link` uses to change what's shown in the address bar without triggering a real page reload |
| URL path separator (`/`) | Inside a URL's path, `/` just separates segments (e.g. `scholarships` from `1` in `/scholarships/1`) — a bare `/` means "the root path" |
| `apiFetch` / `services/api.js` | The actual wrapper function around `fetch()` — attaches base URL + headers, checks `response.ok`, and returns parsed JSON so every caller gets real data directly |
| `response.ok` | Boolean shortcut on a `fetch()` `Response` — `true` for any 2xx status, `false` otherwise; must be checked manually since `fetch()` never throws on its own for 4xx/5xx |
| `Response` object vs. body | `response` is an object wrapper (`.status`, `.ok`, `.headers`) around a body that hasn't been read yet; `.json()` reads and parses that body into real, usable data — same relationship as `pg`'s `result` vs. `result.rows` |
| `ERR_CONNECTION_REFUSED` | Nothing is listening on the target port at all (e.g. backend server isn't running) — a genuine network failure, the category `fetch()` DOES throw on |
| CORS (Cross-Origin Resource Sharing) | Browser security rule blocking JS on one origin (protocol+domain+port) from calling a server on a different origin unless that server explicitly allows it — different ports on "localhost" still count as different origins |
| preflight request | An automatic `OPTIONS` request the browser sends before certain cross-origin requests, asking "is this origin allowed?" — what CORS errors are actually about |
| `cors` middleware | `app.use(cors())` — global middleware that answers the preflight check with the right header, letting the real request through; must sit above the routes, same as `express.json()` |
| Hook | A React-provided function (always named `use...`) that lets a component do things a plain function can't — remember values across renders (`useState`) or run code at a controlled lifecycle moment (`useEffect`); must be called plainly at the top level, never in conditionals/loops |
| re-render | React calling the component function again, fresh, from the top — NOT the same function call continuing; this is why plain local variables reset every time |
| `useState(initial)` | Returns `[value, setValue]` — a value that survives across renders (stored in React's own memory) plus a setter; calling the setter is what CAUSES a re-render, not the other way around |
| `useEffect(fn, deps)` | Runs `fn` as a side effect after a render, gated by the dependency array — `[]` means "once, after the first render only," used for things like an initial data fetch, not for things that belong in the render itself |
| side effect | Code that reaches outside the component (a network request, a timer, a subscription) rather than just computing what to display — belongs inside `useEffect`, not directly in the function body |
| closure | A function defined inside another function can see and use that outer function's local variables (like state from `useState`) — a function defined outside cannot; this is why a submit handler must live inside its component |
| JSX not returned = discarded | JSX sitting in a function body but not part of the `return` statement (or assigned/passed elsewhere) is computed and immediately thrown away, same as an unused expression |
| `htmlFor`/`id` mismatch | A `<label>`'s `htmlFor` must exactly match its input's `id` for click-to-focus accessibility to work — a copy-pasted label with an unedited `htmlFor` silently breaks this with no error |
| ambiguous `||` guard message | A validation check like `if (!a \|\| !b \|\| !c)` with one static combined error message doesn't indicate which field actually failed — only that at least one did; check the source directly when unsure |
| `Response` body stream | A `fetch()` response body can only be read once via `.json()` — calling it a second time throws `body stream already read`; read once, store the result, reuse the stored value |
| register vs. auto-login | A genuine, evaluable design decision — requiring a separate login after registering (cleaner separation of concerns, re-proves the credential) vs. auto-issuing a token on register (less friction) — neither is universally "correct" |
| `useNavigate` | Hook (from `react-router-dom`, not `react`) that returns a function for triggering route changes from code, not a click |
| History API / `pushState` | The real browser mechanism `<Link>` and `navigate()` both use to change the URL and add a history entry, without a network request |
| SPA rewrite rule | A deploy-time config (needed on Vercel, Day 14) telling the host to serve `index.html` for any non-file path, so refresh/direct-URL-access doesn't 404 on client-side-only routes |
| `ReferenceError` | Thrown immediately when JS tries to read an identifier that was never declared anywhere in scope — always throws, never silent, regardless of where in a file it happens |
| catch-block masking | A single `catch` block can swallow both expected failures (e.g. a `401` wrong password) and real code bugs (e.g. `ReferenceError`) under one generic log line — always read what's actually inside the caught `error`, don't assume |
| `localStorage.setItem(key, value)` | Both arguments are strings; `key` is the arbitrary label you choose, not a variable reference — `getItem` must later ask for that exact same string back |
| atomic commit | A commit whose changes all serve one coherent, describable purpose — keeps `git log`/`git blame` meaningful later; bundling unrelated changes together buries the smaller ones from future search |
| `chore:` / `docs:` commit prefixes | Conventional-commit prefixes alongside `feat:`/`fix:` — `chore:` for maintenance/cleanup work, `docs:` for documentation-only changes, neither a feature nor a bug fix |

### Quick reference: frontend route access (Lesson 39)

| Route | Access |
|---|---|
| `/register` | none |
| `/login` | none |
| `/scholarships` | none |
| `/scholarships/:id` | none |
| `/my-tracker` | student token |
| `/admin/dashboard` | admin token |
| `/admin/scholarships/new` | admin token |
| `/admin/scholarships/:id/edit` | admin token |

---

*Part 3 updated: 2026-07-06 (Lessons 50–52 added: `useNavigate` and the SPA navigation model — the kitchen metaphor for code-downloaded-once vs. data-fetched-per-request, why `navigate()` genuinely changes the URL via the History API but triggers zero network activity on its own, the Vercel-rewrite-rule wrinkle flagged for Day 14, and the `useNavigate`-must-come-from-`react-router-dom` import bug; plus the `localStorage.setItem(token, ...)` bare-identifier bug and the `ReferenceError` it threw, why a `catch` block can make a real bug look identical to an expected failure, and confirming the fix by inspecting Local Storage directly; plus a commit-granularity lesson on splitting bundled feature/cleanup/docs changes into atomic `feat:`/`chore:`/`docs:` commits.)*

*Part 3 updated: 2026-07-06 (Lessons 48–49 added: building the real `Register.jsx` form — the controlled-input pattern scaled across multiple fields, why JSX must actually be returned to render, why a submit handler must live inside its component via closures, the `htmlFor`/`id` copy-paste bug, and how a combined `||` guard's static error message can mislead about which field actually failed; plus the `Response`-body-read-twice bug and its stream-based root cause, and evaluating register-vs-auto-login as a genuine, deliberate design decision rather than a default.)*

*Part 3 updated: 2026-07-06 (Lesson 47 added: React Hooks from first principles — why a plain `let` variable can't track form input because every re-render is a fresh function call with no memory between calls; what a Hook actually is and the `use...` naming convention; `useState` as a value living outside the function call with a setter that CAUSES re-renders rather than reacting to change; and `useEffect` as the tool for running side effects at a controlled moment instead of on every render.)*

*Part 3 updated: 2026-07-06 (Lessons 45–46 added: building `services/api.js` for real — the `apiFetch` wrapper, why `response.ok` must be checked manually since `fetch()` doesn't throw on 4xx/5xx, the `Response` object vs. its unread body and why `.json()` matters; plus the first live frontend-to-backend test, hitting `ERR_CONNECTION_REFUSED` (backend not running) and then a CORS block (different ports = different origins), fixed with the `cors` middleware — closing the loop between React and Express for the first time.)*

*Part 3 updated: 2026-07-06 (Lesson 44 added: `<Link>`-based client-side navigation — why a plain `<a href>` defeats the purpose of React Router, the precise click-to-render mechanism via the History API, what a URL path separator actually means, and why `<Link>`s belong inside `BrowserRouter` but outside `Routes` since `Routes` only ever renders one matched route and isn't a general container.)*

*Part 3 updated: 2026-07-06 (Lessons 42–43 added: JSX and component fundamentals from scratch — self-closing tags, curly-brace expressions, the capitalization rule and its silent-failure bug, `export default` vs. named exports, ES Modules vs. CommonJS, and Fragments — plus wiring the actual `BrowserRouter`/`Routes`/`Route` hierarchy for all 8 pages, the Express-routing parallel one layer up, and how React Router's ranking algorithm differs from Express's strict first-match-wins on route order.)*

*Part 3 updated: 2026-07-06 (Lesson 41 added: scaffolding the client with `npm create vite@latest` — why a folder structure described by an AI without running the real generator is not a working project; what `npm create` actually does versus `npm install`; Vite as a build tool with HMR; ESLint as a genuinely new tool category that reads code without running it; and the proof-before-building check applied to the frontend for the first time.)*

*Part 3 started: 2026-07-05 (Lessons 37–40: why `services/api.js` centralizes API calls — a code-organization reason, not a security one; the `localStorage` vs `httpOnly` cookie tradeoff for JWT storage; the full frontend route-access mapping mirroring backend RBAC, and why frontend guards are UX, not security; and the two distinct meanings of "API" — a networked service with a menu of requests, vs. a library's exposed functions) | Mentor: Claude (Anthropic) | Course context: CMSC 127, UP Tacloban*