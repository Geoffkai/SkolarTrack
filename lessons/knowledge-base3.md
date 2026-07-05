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

*Part 3 updated: 2026-07-06 (Lesson 44 added: `<Link>`-based client-side navigation — why a plain `<a href>` defeats the purpose of React Router, the precise click-to-render mechanism via the History API, what a URL path separator actually means, and why `<Link>`s belong inside `BrowserRouter` but outside `Routes` since `Routes` only ever renders one matched route and isn't a general container.)*

*Part 3 updated: 2026-07-06 (Lessons 42–43 added: JSX and component fundamentals from scratch — self-closing tags, curly-brace expressions, the capitalization rule and its silent-failure bug, `export default` vs. named exports, ES Modules vs. CommonJS, and Fragments — plus wiring the actual `BrowserRouter`/`Routes`/`Route` hierarchy for all 8 pages, the Express-routing parallel one layer up, and how React Router's ranking algorithm differs from Express's strict first-match-wins on route order.)*

*Part 3 updated: 2026-07-06 (Lesson 41 added: scaffolding the client with `npm create vite@latest` — why a folder structure described by an AI without running the real generator is not a working project; what `npm create` actually does versus `npm install`; Vite as a build tool with HMR; ESLint as a genuinely new tool category that reads code without running it; and the proof-before-building check applied to the frontend for the first time.)*

*Part 3 started: 2026-07-05 (Lessons 37–40: why `services/api.js` centralizes API calls — a code-organization reason, not a security one; the `localStorage` vs `httpOnly` cookie tradeoff for JWT storage; the full frontend route-access mapping mirroring backend RBAC, and why frontend guards are UX, not security; and the two distinct meanings of "API" — a networked service with a menu of requests, vs. a library's exposed functions) | Mentor: Claude (Anthropic) | Course context: CMSC 127, UP Tacloban*