# Geoffrey's Software Engineering Knowledge Base — Part 2

> **Continuation of Part 1.** Part 1 covered Lessons 1–23 (PostgreSQL, `pg`, Express, middleware, bcrypt, the JWT concept, the MVC layers, HTTP status codes, and debugging). This file picks up at Lesson 24.
>
> **How to use this file:**
> Upload BOTH knowledge-base files to your Claude Project so all lessons are available in every chat.
> When you learn something new, tell Claude: *"Update my knowledge base with what we just learned about X"* and Claude will add it to the current part and give you an updated file to re-upload.

---

## Table of Contents (Part 2)

24. [npm Scripts, nodemon & Dependencies](#lesson-24-npm-scripts-nodemon-and-dependencies)
25. [Building Login (`bcrypt.compare` + `jwt.sign`)](#lesson-25-building-login)
26. [Anatomy of a JWT (header.payload.signature)](#lesson-26-anatomy-of-a-jwt)
27. [Debugging Round 2: The Login Error Chain](#lesson-27-debugging-round-2)
28. [The Request Lifecycle: Startup vs Request, and Middleware](#lesson-28-request-lifecycle)
29. [Auth Middleware: verifyToken & requireAdmin (RBAC)](#lesson-29-auth-middleware)
30. [The `req` Object & Request-Scoped Data](#lesson-30-the-req-object)
31. [POST vs GET Revisited](#lesson-31-post-vs-get-revisited)
32. [Scholarship CRUD — `req.params`, REST Naming, and Query Discipline](#lesson-32-scholarship-crud--reqparams-rest-naming-and-query-discipline)
33. [Live-Testing Discipline — Proving RBAC and Soft Delete](#lesson-33-live-testing-discipline--proving-rbac-and-soft-delete)
34. [RBAC Needs Guards on Both Sides — `verifyToken` Isn't Enough](#lesson-34-rbac-needs-guards-on-both-sides--verifytoken-isnt-enough)
35. [Layered Validation — the `undefined` → `NULL` Trap and Guard-Clause Discipline](#lesson-35-layered-validation--the-undefined--null-trap-and-guard-clause-discipline)
36. [Admin View-Applicants — Nested Resources, JOINs, and Ownership-as-Filter](#lesson-36-admin-view-applicants--nested-resources-joins-and-ownership-as-filter)

*(Lessons 1–23 are in Part 1.)*

---

## Lesson 24: npm Scripts, nodemon and Dependencies

**Date learned:** 2026-07-01
**Tags:** `npm` `nodemon` `package.json` `scripts` `dependencies` `tooling`

Everything here is about **one thing: how you start your server while building it.** `npm run dev`, nodemon, scripts — all machinery for "turn my server on." Keep that anchor.

### `scripts` = a list of named shortcuts

The `"scripts"` block in `package.json` is just **nicknames for longer commands.**

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

- `"dev"` is a nickname for `nodemon index.js`
- `"start"` is a nickname for `node index.js`

So `npm run dev` means: *"npm, find the shortcut named `dev` and run what it points to."* That's why `Missing script: "dev"` happens when the shortcut isn't defined yet — you're not missing a program, you're missing the *definition*. Why bother? Less typing, and it's a **convention** — every Node project uses `dev`/`start`, so anyone knows how to run your project.

### `node index.js` vs `nodemon index.js` — the real difference

Both **start your server.** The difference is what happens *after you edit a file*:

| | `node index.js` | `nodemon index.js` |
|---|---|---|
| Starts the server | Yes | Yes |
| After you save an edit | Keeps running the **old** code | **Auto-restarts** with the new code |
| To see a change | Ctrl+C and re-run manually, every time | Nothing — it reloads itself |

This is the **snapshot** idea from Lesson 23: the running server is a photo of your code at start-time. Plain `node` never re-takes the photo; **nodemon re-takes it on every save.**

### So what *is* nodemon?

A small **development tool** — its one job is to watch your files and restart the server whenever they change. The name = "**node mon**itor." Installed with `npm install --save-dev nodemon`. It's not part of your app's logic — it just makes *building* less painful (no hitting Ctrl+C hundreds of times a day).

### Why two scripts — `dev` and `start`?

Building and shipping are different situations:

| Script | Uses | When | Why |
|---|---|---|---|
| `dev` | nodemon | while building (now) | auto-restart on save |
| `start` | plain node | in production (Railway later) | nobody's editing files → nothing to watch → just run |

Same server, two ways to run it, each fitting its moment.

### `dependencies` vs `devDependencies` — the one distinction that matters

```json
"dependencies":    { "express", "pg", "bcryptjs", "jsonwebtoken", "dotenv" },
"devDependencies": { "nodemon" }
```

- **`dependencies`** = things the actual app needs to **run**, even on the live server (Express, pg, bcryptjs...).
- **`devDependencies`** = tools that only help you **build** and aren't needed once deployed (nodemon; also Prettier — Part 1 context).

When you deploy, Railway installs `dependencies` and can **skip** `devDependencies` — production doesn't need your file-watcher. That's the whole reason the two lists are separate. The `--save-dev` flag on install is what files a package under `devDependencies`.

### The rest of `package.json` — just labels

`"name"`, `"version"`, `"main"` are metadata (a label, a version number, which file is the entry point). No logic — just describing your project.

### CMSC 127 / prior-lesson connection

Extends Lesson 7 (npm = App Store for JS libraries) and Lesson 10 (dev tooling). `package.json` is still the "shopping list"; `scripts` is the "how to run it" section of that same list.

> One line: **`scripts` are nicknames for commands; `npm run dev` runs the `dev` nickname (nodemon = node that auto-restarts on save); `start` is plain node for production; `dependencies` ship to production, `devDependencies` don't.**

---

## Lesson 25: Building Login

**Date learned:** 2026-07-01
**Tags:** `login` `bcrypt-compare` `jwt-sign` `auth` `controller` `security`

Register **creates** a user. Login **verifies** an existing one and hands back a token. Different jobs, same controller file.

### The five steps

```
1. Read email + password from the body
2. Find the user by email          → findUserByEmail()   ← REUSE from register
3. Compare password to stored hash → bcrypt.compare()
4. Mint a token                    → jwt.sign()           ← the star
5. Send the token back (200)
```

Step 2 **reuses `findUserByEmail`** — the exact function built for register. Written once, used twice. This is *why* that function uses `SELECT *`: login needs the `password_hash` column that register's `RETURNING` deliberately hid.

### The code (added below `register` in `authController.js`)

```javascript
const jwt = require("jsonwebtoken");   // at the TOP with the other requires

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },       // the DATA (payload)
      process.env.JWT_SECRET,                     // the SECRET (the stamp)
      { expiresIn: process.env.JWT_EXPIRES_IN },  // options: when it dies (7d)
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error("login error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

module.exports = { register, login };   // add login to the exports
```

Route file gets one new line: `router.post("/login", login);` (and pull `login` into the `require`).

### The parts worth seeing

- **`bcrypt.compare(password, user.password_hash)`** (Lesson 19) — re-hashes what they typed using the salt baked into the stored hash, returns `true`/`false`. You never *decrypt* a password (impossible) — you re-hash and compare.
- **`jwt.sign({ userId, role }, SECRET, { expiresIn })`** (Lesson 20) — the payload is the **data** the token is made *from*; `JWT_SECRET` *signs* it; `expiresIn` sets the 7-day death clock. This one line is the whole JWT concept made real.
- **`200`, not `201`** (Lesson 22) — login *creates nothing*, it just verifies. `201 Created` is for register.

### The deliberate security choice: same 401 for both failures

"No such user" and "wrong password" return the **identical** message: `invalid email or password`. On purpose. If you said "no such email" vs "wrong password," an attacker could probe *which emails are registered*. Vague-on-purpose. Same instinct as omitting `password_hash` from register's `RETURNING`.

> One line: **login = find the user, `bcrypt.compare` the password, `jwt.sign` a token; return `200` + token; keep the failure message vague so you don't leak which emails exist.**

---

## Lesson 26: Anatomy of a JWT

**Date learned:** 2026-07-01
**Tags:** `jwt` `header` `payload` `signature` `claims` `base64` `security`

Lesson 20 was the *mechanism* (how signing/verifying work). This is the *structure* — the three parts you can literally see on **jwt.io**.

### The shape: three parts split by dots

```
eyJhbGc...      ← HEADER
.
eyJ1c2Vy...     ← PAYLOAD
.
0OsyyAx7...     ← SIGNATURE
```

`header.payload.signature`.

### Part 1 — Header (the label)

Small metadata: *what kind of token, signed how.*
```json
{ "alg": "HS256", "typ": "JWT" }
```
- `typ: "JWT"` — "this is a JWT."
- `alg: "HS256"` — the signing algorithm (HMAC-SHA256, the `[math]` from Lesson 20); tells the server which method to use when re-checking.

Auto-filled by `jwt.sign()`. You never write it.

### Part 2 — Payload (the contents you control)

The data you passed to `jwt.sign({ userId, role }, ...)`:
```json
{
  "userId": 1,          ← you put this in
  "role": "student",    ← you put this in
  "iat": 1782912147,    ← auto: "issued at"
  "exp": 1783516947     ← auto: "expires" (from expiresIn: "7d")
}
```
- `userId` + `role` — how the server knows *who's asking* on every future request (the JWT middleware reads this).
- `iat` / `exp` — timestamps jsonwebtoken adds automatically; `exp` is how the server knows when to reject an expired token.
- Each field is called a **claim** (a statement the token makes about the user). Claim = one field in the payload.

**Critical (Lesson 20):** the payload is **NOT encrypted** — just base64, which is reversible. Anyone holding the token can read it (you saw it plainly on jwt.io). **Rule: never put secrets in a payload.** No passwords, no sensitive data. `userId`/`role` are fine; they aren't secrets.

### Part 3 — Signature (the security)

Made by running header + payload through the algorithm *with your secret*:
```
HMAC-SHA256( header + payload, JWT_SECRET )  →  signature
```
This is the "signed BY the secret" part. The server later **recomputes and compares** it (Lesson 20). Change one character of the payload (`role: "student"` → `"admin"`) and the signature no longer matches → rejected. The entire security model lives here.

### The three parts together

| Part | Contains | Who writes it | Secret? | Job |
|---|---|---|---|---|
| **Header** | type + algorithm | `jwt.sign()` auto | No, readable | how to verify |
| **Payload** | your data + `iat`/`exp` | **You** (+ auto timestamps) | **No, readable** | *who* the user is |
| **Signature** | the sealed hash | `jwt.sign()` w/ `JWT_SECRET` | signature public, secret private | proves it's genuine |

The clever design: the first two parts are **open** (anyone can read the claims), the third is the **lock** (only your secret makes a matching one). So a token can be **read by anyone but forged by no one.**

> One line: **header says how it's signed, payload says who you are (readable, never secret), signature proves nobody tampered — and only your `JWT_SECRET` can produce a valid signature.**

**See it yourself:** on jwt.io, change the payload `role` to `"admin"` and watch the "signature verified" indicator break — a live forgery attempt failing.

---

## Lesson 27: Debugging Round 2

**Date learned:** 2026-07-01
**Tags:** `debugging` `errors` `http-headers-sent` `reference-error` `troubleshooting`

Login threw its own chain of errors. New reusable tells, building on Lesson 23.

### 1. `res.json(500)` vs `res.status(500)` — a one-word typo that sends two responses

```javascript
return res.json(500).json({ error: "..." });   // ❌ WRONG
return res.status(500).json({ error: "..." });  // ✅ RIGHT
```

`res.json(500)` treats `500` as the **body to send** — it fires a response immediately. Then `.json({...})` tries to send a **second** response on the same request → crash.

> **Tell:** `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent` = you sent **two responses on one request.** Rule: **one response per request.** Set the code with `.status(code)`, then send the body with `.json(body)` — never `.json(number)`.

### 2. A broken `catch` hides the real error

The `HEADERS_SENT` crash happened *inside the catch block*, which fired because something in the `try` threw first. A broken catch can mask the true cause. **Fix the catch so it reports honestly** — then the real error surfaces.

### 3. `bcrypt.compare` → `Illegal arguments: string, undefined`

bcrypt got two arguments and one was `undefined`. The two are `password` and `user.password_hash`.
- Hash was fine in the DB (a real `$2b$10$...` string), so `password` was the `undefined` one → `req.body` was empty again → **the `text/plain` vs `application/json` issue from Lesson 23.** (Body tab must be JSON / `Content-Type: application/json` header set.)

> **Tell:** `Illegal arguments: string, undefined` from bcrypt = one of the two inputs is `undefined` → figure out which, then trace *why* it's empty.

### 4. `ReferenceError: X is not defined` — the import is missing *entirely*

```
ReferenceError: jwt is not defined
```
Used `jwt.sign(...)` but never wrote `const jwt = require("jsonwebtoken")`. The name doesn't exist because nothing created it.

> **Tell — and the contrast that matters:**
> - `ReferenceError: X is not defined` = **not imported at all** → add the `require` at the top.
> - `TypeError: X is not a function` (Lesson 23) = **imported, but wrong shape/braces** → fix the destructuring.
>
> Two different messages, two different causes.

### The meta-lesson (reinforced)

The DB was fine, the hash was fine — proven by *checking* (`SELECT ... FROM users`) instead of assuming. An earlier guess ("corrupted hash") was **wrong**, and checking is what caught it. When code looks right, verify the data before blaming the code — and be willing to drop a wrong hypothesis the moment evidence contradicts it.

> One line: **`HEADERS_SENT` = two responses (use `.status().json()`); `Illegal arguments` from bcrypt = an undefined input; `ReferenceError` = missing import; `TypeError: not a function` = wrong-shape import — and always verify the data before blaming the code.**

---

## Lesson 28: Request Lifecycle

**Date learned:** 2026-07-01
**Tags:** `express` `middleware` `request-lifecycle` `startup` `routing` `require` `architecture`

The mental model that ties routing, middleware, and the file flow together. There are **two separate phases**, and blurring them is what makes Express confusing.

### The two phases

| Phase | When | What happens | How often |
|---|---|---|---|
| **BUILD** (build the map) | at startup (`npm run dev`) | wire up the route map, then turn the server on | **once** |
| **WALK** (walk the map) | every incoming request | follow the finished map to a handler and back | **every request** |

Build goes **down** and ends at `app.listen()`. A request **walks** top-down then climbs back out. Same layers, opposite directions (the "two directions" idea from Lesson 21).

### Phase 1 — BUILD (startup): the `require` cascade

`npm run dev` runs `index.js`. When a file hits `require("...")`, that line **pauses the current file, runs the required file top-to-bottom completely, then resumes.** Nested pauses:

```
index.js starts
  └─ require("./src/app")  → PAUSE, run app.js fully
        └─ require("./routes/authRoutes") → PAUSE, run authRoutes.js fully
              └─ require("../controllers/authController") → PAUSE, run it fully
              └─ router.post("/register", register)  ← writes a route onto the map
              └─ router.post("/login", login)        ← writes a route onto the map
        └─ app.use(express.json())      ← registers GLOBAL middleware
        └─ app.use("/auth", authRoutes) ← mounts the router (prefix /auth)
        └─ app.get("/health", ...)      ← writes a route onto the map
  └─ app.listen(3000)  ← the VERY LAST thing: server turns ON and waits
```

- The **wiring lines** (`router.post`, `app.use`, `app.get`) run **once** here to build the map. They are *setup commands*, not checkpoints.
- `app.listen()` is always last — it flips the server on. Everything before it was just building. The map is now frozen in memory; requests never re-run this (that's the "snapshot" idea from Lesson 23 — restart to rebuild it).

### Phase 2 — WALK (a request arrives): e.g. `POST /auth/login`

```
1. Request hits the running server (app.listen, in index.js)
2. GLOBAL middleware runs first
   → express.json() opens the body → req.body now exists   [GUARD #1]
3. Express matches the map: /auth → authRoutes, then POST /login → login handler
   (a TARGETED guard like verifyToken, if attached here, runs NOW —
    after the match, before the handler. login has none.)
4. Handler runs: login() in authController.js        [THE WORK]
   → findUserByEmail() → bcrypt.compare() → jwt.sign()
5. userModel.js → pool.query("SELECT * ...")
6. config/db.js → pool sends SQL to Neon over the internet
   ← Neon returns the row, back up: db → model → controller
7. login() sends res.status(200).json({ token })
8. Response travels back out to the client
```

### Middleware = a guard before the handler

- **Middleware** = a function that runs *in the middle* — between the request arriving and the handler running. A **checkpoint / guard**. It either waves the request through (`next()`) or **stops it** with a response.
- Shape: `function guard(req, res, next) { ... next(); }` — the extra 3rd param `next` is what you call to pass it along. Don't call `next()` (send a response instead) = blocked.
- **Global vs targeted** — decided by *how you attach it*:
  - `app.use(x)` (no path) = **global**, runs on every request (e.g. `express.json()`).
  - `router.post(path, x, handler)` = **targeted**, runs only on that route (e.g. `verifyToken`).
- **Why login isn't behind `verifyToken`:** you have no token yet — you're logging in to *get* one. Chicken-and-egg. So the token guard is targeted at protected routes only.

### The distinction to never blur again

- **Wiring lines build the map** → run **once**, at startup (`router.post`, `app.use`).
- **Middleware guards the handler** → runs **per request** (`express.json()`, future `verifyToken`).

`router.post` is *not* middleware — it's the setup command that *registers* the path, its guards, and its handler. The middleware is the guard function listed *inside* it.

> One line: **at startup, `require` runs the files top-down (nested pauses) to build the route map, ending with `app.listen()` turning the server on; then each request walks that map — global guard → route match → targeted guard → handler → model → db → back out.**

---

## Lesson 29: Auth Middleware

**Date learned:** 2026-07-01
**Tags:** `middleware` `auth` `jwt-verify` `rbac` `roles` `authorization` `bearer` `security`

Auth has two halves that run as **guards** in the WALK phase (Lesson 28): first *who are you?* (`verifyToken`), then *what are you allowed to do?* (`requireAdmin`). Two small files in `server/src/middleware/`.

### The two-guard chain

```
request → [verifyToken] → [requireAdmin] → [the handler]
           is the token       is this user
           real? sets         an admin?
           req.user
```

Order matters: `verifyToken` runs first and sets `req.user`; `requireAdmin` reads `req.user.role`. The second guard depends entirely on the first having run.

### Guard 1 — `verifyToken` (auth.js): the identity check

Where the token lives: the **`Authorization` header**, formatted `Bearer <token>` — the word `Bearer`, a space, then the JWT. Convention.

```javascript
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.header("authorization");   // method form; req.headers["authorization"] also works

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  const token = authHeader.split(" ")[1];   // drop "Bearer", keep the token

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);  // recompute-and-compare (Lesson 20)
    req.user = payload;   // { userId, role, iat, exp } — remember who they are
    next();               // wave through
  } catch (error) {
    return res.status(401).json({ error: "invalid or expired token" });  // block
  }
}

module.exports = verifyToken;
```

- **`req.header("authorization")` vs `req.headers["authorization"]`** — `req.headers` is the **object** (bag of all headers); `req.header("...")` is a **method** that looks one up (case-insensitive). Both return the same string here.
- **`jwt.verify(token, SECRET)`** has two outcomes: valid → **returns the decoded payload**; invalid/tampered/expired → **throws**. That's why it's in `try/catch` — the catch is where fakes and expired tokens get rejected. It does the recompute-and-compare *and* the expiry check for you.
- **Success calls `next()`; failure `return`s a 401 and never calls `next()`.** Pass or block, never both.

### Guard 2 — `requireAdmin` (roles.js): the role check

```javascript
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(401).json({ error: "admin access required" });
  }
  next();
}

module.exports = requireAdmin;
```

- Runs **after** `verifyToken`, so `req.user` already exists.
- `!req.user` is a **safety net** — if `verifyToken` wasn't wired before this, block instead of crash.
- `req.user.role !== "admin"` is the actual RBAC decision — the spec's "student token on an admin route → 401".
- **No `jwt`, no database** — a pure decision on data `verifyToken` already put on `req.user`. Separation of concerns: one guard proves identity, the other checks permission.

### Stacking them — targeted middleware in order

```javascript
app.get("/protected", verifyToken, requireAdmin, (req, res) => {
  res.json({ message: "admin area!", you: req.user });
});
```

`verifyToken, requireAdmin, handler` = two targeted guards, running left to right (Lesson 28's WALK phase, live).

### The four outcomes that prove it

| Request | Result | Why |
|---|---|---|
| no token | `401 no token provided` | verifyToken's header guard |
| garbled token | `401 invalid or expired token` | jwt.verify throws → catch |
| valid **student** token on admin route | `401 admin access required` | passes verify, fails requireAdmin — **RBAC working** |
| valid **admin** token | `200` | passes both guards |

Same route, same code — student gets `401`, admin gets `200`, only *who's logged in* differs. That contrast *is* RBAC.

### The JWT-snapshot nuance (interview-worthy)

A JWT is a **snapshot of the user at signing time.** Change a user's role in the database and *existing* tokens still carry the **old** role until they expire or the user logs in again. That's why, after `UPDATE users SET role = 'admin'`, you must **log in again** to get a token whose payload says `admin`. A real tradeoff of stateless auth — and the reason tokens have limited lifetimes.

> One line: **`verifyToken` reads the `Bearer` token, runs `jwt.verify`, and sets `req.user` (or 401s); `requireAdmin` reads `req.user.role` and 401s non-admins; stack them in order on protected routes. A token is a snapshot — role changes need a fresh login.**

---

## Lesson 30: The `req` Object

**Date learned:** 2026-07-01
**Tags:** `express` `req` `res` `next` `request-scoped` `middleware` `fundamentals`

### `req`, `res`, `next` are NOT global — they're per-request parameters

They *feel* global because they're everywhere, but they're the opposite. They're **parameters** Express passes into your handler/middleware, and Express makes a **fresh set for every request.**

```javascript
function verifyToken(req, res, next) {   // these exist ONLY inside this function
  console.log(req.user);                 // ✅ works — passed in here
}
function elsewhere() {
  console.log(req.user);                 // ❌ ReferenceError — never passed here
}
```

The "global" test: a truly global thing (like `process.env`) is readable anywhere without being passed. `req` fails that test — proof it's not global.

**Why a fresh set per request matters:** Geoffrey's request gets `reqA`, someone else's gets `reqB` — different objects. Their `req.body` never mix. That's *how* one server serves many users at once without their data colliding. A shared/global `req` would be chaos.

### Who owns `next()`? Express does.

`next` is the **third argument Express hands to middleware.** You never create it. Calling `next()` passes the request to the next checkpoint (approve); *not* calling it (sending a response instead) stops the request (block). Even its meaning is local — the `next` given to `verifyToken` means "go to `requireAdmin`."

### You can add your own properties to `req`

`req` is a **plain JavaScript object**, and JS lets you add properties to any object:

```javascript
req.user = payload;   // you just invented a "user" property
```

`req.user` is **not** an Express feature — it's a property *you* created in `verifyToken`. The name is pure convention (could've been `req.currentUser`). Because the **same `req` is passed hand-to-hand** down the chain (Lesson 28), anything you attach rides along to every later middleware and the handler.

| Property | Who put it there |
|---|---|
| `req.body`, `req.headers`, `req.method` | Express |
| `req.user` | **You** (in `verifyToken`) |

**This is the core middleware pattern:** a middleware does work once, attaches the result to `req`, and later steps *read* it instead of redoing the work. `verifyToken` verifies the token once → sets `req.user` → `requireAdmin` and the handler just read it.

> One line: **`req`/`res`/`next` are per-request parameters Express passes in (a fresh set each request, usable only where passed, `next` owned by Express); `req` is a plain object you can add properties to — `req.user` is yours, and it rides the same `req` down the chain so later steps can read it.**

---

## Lesson 31: POST vs GET Revisited

**Date learned:** 2026-07-01
**Tags:** `http` `rest` `post` `get` `verbs` `api` `security`

Lesson 18 taught **POST = create** as a rule of thumb. The deeper truth: the verb is chosen by *what the request does* and *whether it carries a body.*

- **GET** = "read/fetch, **no body**." For retrieving things.
- **POST** = "here's **data in a body** — process it." Creating is the common case, but *submitting credentials to be verified* (login) is also POST.

So both auth routes are POST, for related reasons:

| Route | Why POST | Body? |
|---|---|---|
| `POST /auth/register` | creates a new user (classic POST) | yes — user details |
| `POST /auth/login` | submits credentials to verify | yes — email + password |
| `GET /protected` | just reads/proves identity | no — token in the **header** |

### Why login can't be a GET (two reasons)

1. **A GET has no body**, so credentials would ride in the URL: `?email=...&password=...` — which gets logged in browser history, server logs, and proxies. Password leaked everywhere. POST tucks them in the body.
2. **GET is meant to be safe/repeatable/cacheable** — a passive read. Verifying credentials and minting a token is an *action*, so POST is honest about it.

### Where auth data lives

- **Credentials → body** (login sends `{ email, password }` to *get* a token).
- **Token → `Authorization` header** (protected routes send the token to *prove* they already have one).

The token is *permission metadata about the request*, kept separate from the request's actual content (the body). That's why `/protected` is correctly a GET — it reads with a header token and sends no credential body.

> One line: **the verb follows what the request does + whether it carries a body — POST submits a body to process (create a user *or* verify credentials), GET just reads; login is POST because it submits a password body, `/protected` is GET because it only reads with a header token.**

---

## Lesson 32: Scholarship CRUD — `req.params`, REST Naming, and Query Discipline

**Date learned:** 2026-07-04
**Tags:** `req.params` `crud` `rest` `route-order` `returning` `mvc` `soft-delete`

Building the scholarship vertical slice (model → controller → route) reused everything from auth, but added the first **resource with an id in the URL** — which introduced `req.params`, 404 handling, and a REST naming distinction auth routes never needed.

### Why an id has to live in the URL, not the body

The starting question: how does a request say "which one specifically"? Your frontend (Day 11) needs to show *one* scholarship when a student clicks it, not the whole list `getAllScholarships` returns. HTTP's answer is: **put the identifier in the URL path itself.**

```
GET /scholarships        → give me ALL of them
GET /scholarships/42     → give me the ONE with id = 42
```

That `42` is the real primary key from your `scholarships` table — the URL is *carrying data*, same as `req.body` does, just in a different location.

**Why not just put `{ id: 42 }` in a body, like login does with credentials?** Because of Lesson 31's rule: **a GET request has no body.** Browsing to a URL, clicking a link — none of that sends a body. So the only place left to identify *which* resource is the URL path itself.

### `req.params` — the mechanism

```javascript
router.get("/:id", getOne);
```

`:id` is a **named placeholder** in the route pattern — "this segment of the path is a variable, call whatever shows up here `id`." When a real request hits `GET /scholarships/42`, Express matches `42` against that blank and hands it to the controller as:

```javascript
req.params.id   // → "42"  (a STRING — URLs are always text, never numbers)
```

Same relationship as `req.body` and `express.json()`: something upstream parses, the controller just reads the result off `req`. Multiple named blanks are possible in one route (`/:type/:id` → `req.params.type`, `req.params.id`), same mechanism, more of it.

### Why use a variable at all instead of one route per scholarship?

The alternative would be writing a literal route for every row:
```javascript
router.get("/scholarships/1", getScholarship1);
router.get("/scholarships/2", getScholarship2);
// ...forever, redeployed every time an admin posts a new one
```
This breaks immediately — you don't know in advance how many scholarships will exist. `:id` is **one route that handles infinite cases**: the *pattern* (path + verb) stays fixed, the *variable part* changes per request. This is the exact same instinct as a function parameter in any language already known: `getScholarship(int id)` in Java doesn't need a new method per possible id — one method, the value changes at call-time. `:id` is a parameter for a URL route the same way `int id` is a parameter for a method.

**The full chain of reasoning, compressed:** an id needs to travel with the request → GET has no body → so it rides in the URL as a named variable (`:id`) → and one route definition with that variable serves every possible id, instead of needing a hardcoded route per row.

### What REST actually means (not just a buzzword)

**REST** = **Re**presentational **S**tate **Trans**fer — not a technology, a set of **conventions** for designing APIs, and this build has followed them the whole time without the label attached:

- Resources (things: users, scholarships) get **URLs that name them** — `/scholarships`, `/scholarships/42`
- The **HTTP verb** says what to *do* to that resource — `GET` = read, `POST` = create, `PUT` = update, `DELETE` = remove (Lesson 18)
- The server doesn't remember anything about the client between requests — each request carries everything needed to understand it (why JWT rides on *every* request instead of a server-side login session — Lesson 20's statelessness)

"RESTful API" = an API organized around resources-as-URLs + verbs-as-actions. The `scholarship-tracker-ph.md` API Routes table is a REST design — that's why every line reads as verb + path + meaning.

### REST naming in practice: resource paths vs action paths

This is *why* `scholarshipRoutes.js` never needed a `/create` or `/update` suffix, while `authRoutes.js` needed `/register` and `/login`:

| Type | Example | Why the path looks that way |
|---|---|---|
| **Resource** (a "thing" with an id) | `POST /scholarships`, `PUT /scholarships/:id`, `DELETE /scholarships/:id` | The path names the *noun*; the HTTP **verb** already names the action. `POST` aimed at a resource path already means "create" — adding `/create` on top is redundant and breaks the pattern. |
| **Action** (no resource, just a process) | `POST /auth/register`, `POST /auth/login` | There's no "thing" to point at — only a process to trigger — so the path has to spell out *what to do*, since the verb alone (`POST`) isn't specific enough on its own. |

One-sentence rule: **if there's an id, the noun goes in the path and the verb does the work; if there's no id, the path has to name the action itself.**

### The `RETURNING *` + `return result.rows[0]` habit (a real bug, caught twice)

Every mutating query (`INSERT`, `UPDATE`) needs **two things**, and both got dropped independently while building `createScholarship` and `updateScholarship`:

1. `RETURNING *;` in the SQL — without it, Postgres saves the row fine, but tells your JS nothing about it. `result.rows` comes back empty. The row isn't missing from the *database* — it's missing from your *response*.
2. `return result.rows[0];` at the end of the function — without it, the function returns `undefined` no matter what the query did.

> **Tell to remember:** if a create/update "seems to work" (no thrown error) but the API response is empty or `undefined`, check both of these lines before assuming the logic is wrong. Also watch for the property-name typo variant: `result.row[0]` (missing the `s`) throws `Cannot read properties of undefined (reading '0')` — a different error message than a missing `RETURNING`, but same root cause: not checking the actual shape of `result` against a working example.

### 404 vs 400 — matching the status code to what's actually wrong

A missing/malformed id in the request is `400` (client sent bad input), but a **well-formed id that simply doesn't match any row** is `404` (Not Found) — the request was fine, the resource just isn't there. Mixing these up sends the wrong signal to whatever's reading the status code (Lesson 22: the client reacts to the number alone, without reading the body).

Also caught: `update` briefly returning `201` — wrong, because `201` specifically means "something new was created" (Lesson 22). `update` modifies an existing row, so it's `200` — same reasoning as why `login` is `200` and `register` is `201`.

### Route order: specific paths before variable paths

```javascript
router.get("/", getAll);       // list
router.get("/:id", getOne);    // one
```

Express matches top-to-bottom, first match wins. This pair is safe either order (`/:id` requires *something* after the slash, so it can't accidentally swallow `GET /`). But the general rule matters for the future: if a **literal** path is ever added alongside a variable one — e.g. `/featured` next to `/:id` — the literal path must be listed **above** the variable one, or `/:id` will silently catch `GET /scholarships/featured` first (treating `"featured"` as an id), returning a wrong `404` instead of running the intended handler. No crash, no error message pointing at the cause — just quietly wrong routing.

### Where guards live: global vs targeted, applied for real this time

Revisits Lesson 28's split with the concrete reason `verifyToken`/`requireAdmin` live in `scholarshipRoutes.js`, not `app.js`:

- `express.json()` is **global** — every request needs its body parsed, no exceptions — so `app.use(express.json())` sits in `app.js`, once, for everything.
- `verifyToken`/`requireAdmin` are **targeted** — they must run on `POST`/`PUT`/`DELETE /scholarships` but explicitly *not* on `GET /scholarships` (public browsing must stay open) or `POST /auth/login` (impossible — no token exists yet to check; that's what login is *for*). Putting them in `app.js` globally would break both. They're listed as extra arguments directly on the specific route lines that need them:

```javascript
router.post("/", verifyToken, requireAdmin, create);
router.put("/:id", verifyToken, requireAdmin, update);
router.delete("/:id", verifyToken, requireAdmin, remove);
```

**One-sentence version:** global middleware answers "everyone, always," so it lives in `app.js`; targeted middleware answers "only these specific routes," so it's attached directly on the routes that need it.

> One line: **`req.params` carries URL-path variables because GET has no body, and one route with `:id` replaces an impossible one-route-per-row scheme; REST means resources-as-URLs + verbs-as-actions, statelessly — resource paths let the verb do the work, action paths must name themselves; every INSERT/UPDATE needs `RETURNING *` + `return result.rows[0]` or the write silently vanishes from the response; 404 means "well-formed request, resource not found" (not 400); list specific paths above variable ones; and middleware lives wherever its "who does this apply to" question is answered — global in `app.js`, targeted on the specific route.**

---

## Lesson 33: Live-Testing Discipline — Proving RBAC and Soft Delete

**Date learned:** 2026-07-04
**Tags:** `thunder-client` `testing` `rbac` `soft-delete` `verification` `debugging`

Writing the guard chain (`verifyToken, requireAdmin`) and the soft-delete SQL doesn't prove either one *works* — only live-testing each outcome does. This session's Thunder Client run is worth remembering as the actual verification checklist, not just a formality.

### RBAC isn't proven until you've seen BOTH outcomes

It's tempting to test only the "happy path" (admin token → success) and assume the guard works. But the entire point of `requireAdmin` is the *rejection* case — so the real proof is testing **both**:

- Student token on `POST /scholarships` → confirmed `401 admin access required`
- Admin token on the same route → confirmed `201 Created`

Same route, same code, only the token differs — that contrast **is** the RBAC test. Testing only one side leaves the more important half (the block) unverified.

### The colon bug: leaving route syntax in a real request

Hit while testing `GET /scholarships/:id` — sent literally as `http://localhost:3000/scholarships/:id` (with the colon still in it, un-substituted) instead of the real id. Server error:

```
invalid input syntax for type integer: ":1"
```

The tell: the **colon** in the error message. `:id` is **route-definition syntax** (belongs only in `scholarshipRoutes.js`), never something that appears in an actual request URL. A real client always sends the literal value (`GET /scholarships/1`), never the pattern with the colon. This is a "which layer does this syntax belong to" bug, same family as Lesson 23's shape-mismatch bugs — the fix isn't a logic change, it's recognizing which file/context a piece of syntax is meant for.

### Soft delete isn't proven by the HTTP response alone

`DELETE /scholarships/:id` returning `200` only proves the *request succeeded* — it does **not** by itself prove the delete was soft. The only way to actually confirm "the row still exists, just closed" is to bypass the API entirely and check the source of truth directly:

```sql
SELECT * FROM scholarships;
```

Confirmed: `status: 'closed'`, row count unchanged (`1 row`), nothing removed. Same instinct as Lesson 23's meta-lesson — verify the data, don't just trust that the code did what it was supposed to.

### The testing order that catches bugs early

Tests ran in dependency order — create before read, read before update, update before delete — rather than all at once at the end. Each bug (the colon-in-URL mistake, wrong status codes caught during code review) surfaced against one small, isolated piece rather than a tangle of five features failing together at once. Same "vertical slice, one thing proven at a time" discipline from Lesson 21, now applied to testing instead of building.

> One line: **RBAC is only proven once you've seen both the block and the pass on the same route; route-definition syntax (`:id`) never belongs in a real request URL — recognize which layer syntax belongs to; a soft delete's `200` response only proves the request worked, not that the row survived — check the database directly; and testing in dependency order isolates each bug instead of letting them pile up.**

---

## Lesson 34: RBAC Needs Guards on Both Sides — `verifyToken` Isn't Enough

**Date learned:** 2026-07-05
**Tags:** `rbac` `middleware` `security-gap` `requirestudent` `authorization`

Building `applicationRoutes.js`, every route was given `verifyToken` and nothing else — the same instinct that felt right for `GET /scholarships` (public, no guard needed) got mis-applied here. The result: any valid, logged-in token — **including an admin's** — could hit `POST /applications`, `PUT /applications/:id`, or `DELETE /applications/:id`. Nothing blocked an admin from "bookmarking" a scholarship, which is semantically nonsensical and explicitly a student-only action per `scholarship-tracker-ph.md`.

### `verifyToken` answers a narrower question than it feels like it does

`verifyToken` proves exactly one thing: **"is this a real, currently-valid token, signed by this server?"** It does *not* prove "is this the *right kind* of user for this specific route." Those are two separate questions, and scholarships happened to only ever need the second question answered for *admin-only* write routes — so it was easy to forget that the second question exists at all, and that it can point the *other* direction too (student-only, not just admin-only).

### The gap, traced end to end

- Admin logs in → gets a real, valid token, payload `{ userId: 1, role: "admin" }`.
- Admin sends `POST /applications` with that token.
- Route: `router.post("/", verifyToken, create);` — `verifyToken` runs, the token is genuinely valid, decodes fine, `next()` fires.
- `create` runs unguarded — nothing ever checked `req.user.role`. A row gets created with `student_id` = the admin's own `userId`. `201 Created`, no error, no warning.

No crash, no thrown error — a **silently wrong outcome**, the same category of bug as Lesson 32's route-order issue: nothing breaks, the wrong thing just quietly succeeds.

### The fix: a symmetric guard, same shape as `requireAdmin`

```javascript
// middleware/roles.js
function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== "student") {
    return res.status(401).json({ error: "student access required" });
  }
  next();   // easy to forget on the success path — see the bug below
}

module.exports = { requireAdmin, requireStudent };
```

**Bug caught while building this:** the first draft of `requireStudent` never called `next()` on the pass case — only the `if` block returned anything. A real student with a valid token would run this middleware, the condition would be `false`, and then... nothing. No `next()`, no response — the request just hangs forever. Contrast this with `requireAdmin`, which has `next();` sitting *after* the `if` block, unconditionally reached whenever the guard doesn't block. Every guard needs an explicit "and here's what happens when you pass," not just "here's what happens when you fail."

Wired onto every write (and, deliberately, every) route in `applicationRoutes.js`:

```javascript
router.get("/", verifyToken, requireStudent, getAll);
router.post("/", verifyToken, requireStudent, create);
router.put("/:id", verifyToken, requireStudent, update);
router.delete("/:id", verifyToken, requireStudent, remove);
```

### The general principle, worth carrying into every future protected route

Every protected route actually answers **two independent questions**, and both need an explicit guard:

1. **Authentication** — "is this a real, logged-in user at all?" → `verifyToken`
2. **Authorization** — "is this *specific* user allowed to do *this specific* action?" → a role check, and the role check can point in **either** direction (admin-only *or* student-only) depending on the feature — it's not always "block non-admins." Applications needed the mirror-image guard of scholarships, and that mirror had to be built by hand; it didn't come for free just because `requireAdmin` already existed.

**Also surfaced, not yet built:** the reverse problem exists too — nothing currently stops a student from making a `GET` request to see *only their own* applications, which is fine, but there's also no route yet for an admin to see *who applied* to their scholarships (`scholarship-tracker-ph.md` names this feature — "View applicants" — but never gave it a route in the API table). That gap is real but is a missing *feature*, not a missing *guard*, and is tracked separately as upcoming work (a nested resource route with its first JOIN query).

> One line: **`verifyToken` only proves "logged in," never "allowed here" — every protected route needs its own explicit role guard, guards can point either direction (admin-only or student-only) depending on the feature, and a guard without a `next()` on its success path silently hangs the request instead of letting it through.**

---

## Lesson 35: Layered Validation — the `undefined` → `NULL` Trap and Guard-Clause Discipline

**Date learned:** 2026-07-05
**Tags:** `validation` `null` `postgres` `check-constraint` `coalesce` `guard-clauses` `put-vs-patch`

Adding status validation to `PUT /applications/:id` surfaced a genuinely dangerous silent bug — not a crash, a **silent data-corruption path** — and a decision about how strict a `PUT` route should be.

### The scenario that exposed it

`PUT /applications/:id` was built to accept `{ status, notes }` — but nothing required `status` to actually be present. A request sending only `{ "notes": "following up" }` (no `status` field at all) should, intuitively, just update the note. Walking that through the actual code revealed it does something much worse.

### Tracing `undefined` all the way to a live `UPDATE`

```javascript
const { status, notes } = req.body;   // status → undefined (never sent)
// ...
await updateApplication(applicationId, userId, status, notes);   // undefined passed straight through
```

```javascript
// inside the model
`UPDATE applications SET status = $1, notes = $2 WHERE ...`,
[status, notes, id, studentId],   // $1 = undefined
```

**The key fact:** the `pg` library silently converts a JavaScript `undefined` bound parameter into SQL `NULL`. So this doesn't error, and it doesn't skip the column — it actively runs `SET status = NULL`, **wiping out whatever status the student had already recorded**, with zero error thrown and zero indication anything went wrong.

### Why the schema's own `CHECK` constraint doesn't catch this

`status VARCHAR CHECK (status IN ('interested','applied','interview','result'))` looks like it should reject a value outside that list — and `NULL` is outside that list. But in SQL, a `CHECK` constraint only **rejects** when the expression evaluates to `FALSE`. When the value being checked is `NULL`, the whole expression evaluates to `NULL`, not `FALSE` — and Postgres treats a `NULL` result as **passing**, not failing. `NULL` is a different kind of "not in the list" than `'banana'` is, and the constraint quietly lets it through.

### Two candidate fixes, and why one was chosen over the other

**Option A — require the full body (full replacement).** Reject the request with `400` if `status` is missing at all, matching the `PUT` = full-replacement convention already decided for scholarships back in Lesson 18/31.

**Option B — `COALESCE` for a true partial update.**
```sql
SET status = COALESCE($1, status), notes = COALESCE($2, notes)
```
`COALESCE(a, b)` returns `a` if it isn't `NULL`, otherwise falls back to `b` — "use the new value if one was given, otherwise keep what's already there." This genuinely supports sending only the fields you want to change.

**Chosen: Option A.** Reasoning, not just preference:
- **REST convention:** `PUT` is *defined* to mean full replacement; `PATCH` is the verb for partial updates. Using `COALESCE` to make a `PUT` route quietly behave like `PATCH` means the route's verb lies about what it does.
- **Consistency with an earlier decision already made** — scholarships already committed to "PUT = full replacement, frontend always sends every field" (Lesson 18/31). Solving the identical tradeoff two different ways in two different files would make the codebase feel accidental rather than deliberately designed.
- **It costs nothing in the real UI** — the tracker form (Day 11) will always submit both `status` and `notes` together, pre-filled from the existing record. The "notes-only" scenario this bug depends on doesn't happen through the actual frontend.
- `COALESCE` is filed away as the right tool *if* a real `PATCH /applications/:id` route is ever built later — not deleted knowledge, just parked for the correct use case.

### The validation, built as explicit guard clauses

```javascript
const allowedStatuses = ["interested", "applied", "interview", "result"];

if (!status) {
  return res.status(400).json({ error: "status is missing" });
}
if (!allowedStatuses.includes(status)) {
  return res.status(400).json({
    error: `status must be one of: ${allowedStatuses.join(", ")}`,
  });
}
```

**A redundant condition caught along the way:** an earlier draft wrote the second check as `if (status && !allowedStatuses.includes(status))`. Once the *first* guard clause has already returned on a falsy `status`, execution can only reach the second check when `status` is already known to be truthy — so `status &&` there is checking something already proven one line earlier. It can never change the outcome; safe to drop.

### Why validate in JS at all, when the database already has a `CHECK` constraint?

Not redundant — **complementary, at two different layers**:
- The **database `CHECK` constraint** is the *last line of defense* — it protects data integrity no matter what code ever touches this table, including code not written yet.
- The **JS validation** is the *first line* — it catches the mistake immediately, with a specific, actionable message (`400`, "status must be one of: ..."), instead of the request round-tripping to Neon just to come back as an opaque Postgres error that gets swallowed into a generic, unhelpful `500`.

Good backends have both. Neither replaces the other.

### On validation code "feeling heavy"

Two guard clauses (missing vs. invalid-value) for one field isn't bloat — it's two genuinely different ways the same input can be wrong, and each deserves its own specific, actionable error message. Collapsing them into a single combined condition would save a few lines but cost the caller a vaguer error ("bad status" instead of naming exactly what's wrong and what's allowed) — a bad trade. A short list of guard clauses, each catching one specific failure mode with a clear message, is what real backend validation is supposed to look like, not a sign of over-engineering.

> One line: **`pg` silently turns a JS `undefined` bound parameter into SQL `NULL`, and a `CHECK` constraint doesn't reject `NULL` (it evaluates to `NULL`, not `FALSE`, so it "passes") — meaning a missing field can silently wipe existing data with zero error; fix that by requiring the full body on `PUT` (staying consistent with the full-replacement decision already made for scholarships, and saving `COALESCE`-style partial updates for a real future `PATCH` route); and a validation block with several specific guard clauses, each with its own actionable error message, is correct backend design, not bloat.**

---

## Lesson 36: Admin View-Applicants — Nested Resources, JOINs, and Ownership-as-Filter

**Date learned:** 2026-07-05
**Tags:** `join` `nested-resource` `rest` `ownership` `rbac` `middleware-order`

Building the first admin feature that reads *across* two tables (`applications` + `users`) surfaced a new routing pattern (nested resources), the first real JOIN, and a repeat of an old middleware-order bug — worth capturing precisely because it repeated.

### Nested resource paths: when the URL should describe a relationship, not just a thing

`GET /scholarships/:id/applications` instead of `GET /applications?scholarshipId=42`. The deciding question: is this collection independent, just filtered — or does it only make sense *in the context of* a parent? Applications-of-a-scholarship is the second case — the URL should read like a sentence describing the relationship (`scholarship 42's applications`), and the path should mirror the actual parent/child shape in the schema (`applications.scholarship_id` → `scholarships.id`).

Query params are the right tool when a collection stands alone and you're just narrowing it (`/scholarships?status=open`). Nesting is the right tool when the child genuinely doesn't exist independent of the parent in this context.

Practical consequence: this route lives in `scholarshipRoutes.js`, not `applicationRoutes.js`, and takes `requireAdmin` (not `requireStudent`) — the `:id` in the path is a *scholarship* id, so the resource being addressed, and the role allowed to address it, both belong to the scholarships side.

### The JOIN — a data-shape problem, not an access-control problem

Easy to blur these two, but they're separate concerns entirely:
- **Access control** (who's allowed to hit this route) is `requireAdmin`'s job — already solved before the query runs.
- **The JOIN** solves a different problem: `applications` only stores `student_id`, a bare integer. An admin looking at `{ student_id: 7, status: 'applied' }` has no idea who `7` is. The name and email needed to make that useful live in `users`, a different table.

```sql
SELECT applications.id, applications.status, applications.notes,
       users.name, users.email
FROM applications
JOIN users ON applications.student_id = users.id
JOIN scholarships ON applications.scholarship_id = scholarships.id
WHERE scholarships.id = $1 AND scholarships.posted_by = $2
```

A JOIN says: for each row in one table, find the matching row in another (via a shared key) and stitch them into one combined row — one query, instead of running a separate lookup per application (the N+1 query problem — slow, and worth knowing the term).

**A typo caught here, worth remembering:** every reference to a column in a multi-table query needs its table-prefix spelled identically everywhere in that query. Writing `applications.status` in the `FROM`/`JOIN` lines but `application.status` (singular) in the `SELECT` line throws `missing FROM-clause entry for table "application"` — Postgres has zero contextual "does this mean applications?" reasoning. A prefix typo is treated as a reference to a table that doesn't exist.

### Ownership as a `WHERE` clause, not an `if` statement

Decision made deliberately (not defaulted into): only the admin who posted a scholarship (`posted_by`) can see its applicants — not any admin, globally. That's expressed as `AND scholarships.posted_by = $2` in the `WHERE` clause, with `$2` bound to `req.user.userId`.

The payoff: **no branching logic anywhere in the controller for "is this yours."** Three distinct real-world cases —

1. a scholarship you posted with zero applicants,
2. a real scholarship posted by a *different* admin,
3. a scholarship id that doesn't exist in the table at all —

all produce the exact same outcome: `result.rows` comes back as `[]`. The `WHERE` clause rejects all three for one mechanical reason (the row doesn't satisfy `posted_by = $2`, or there's no row to begin with), and the controller doesn't need to tell them apart — it just sends `200 + { applications: [] }` in every case.

This was a deliberate design choice, not a shortcut: returning `404` for "wrong admin" or "doesn't exist" would leak information (confirming a scholarship id exists and belongs to someone else) to an admin who has no business knowing that — the same "don't reveal which emails are registered" instinct from Lesson 25's login error message, applied to ownership instead of credentials.

### The controller: no branching needed on the success path

```javascript
async function getApplicants(req, res) {
  try {
    const scholarshipId = req.params.id;
    const adminId = req.user.userId;

    const applications = await getApplicantsByScholarshipId(scholarshipId, adminId);

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("error getting applicants: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}
```

**A bug caught here, worth remembering:** an earlier draft checked `!applications` and returned `404` if true, on the theory that "no rows found" should 404. But the model function returns `result.rows`, which is **always an array**, even when empty — and `![]` evaluates to `false` in JavaScript (an empty array is truthy). So that `if` branch was unreachable dead code, not a working safety net. Once the ownership filter was already understood to collapse all three "nothing to show" cases into `200 + []` at the SQL level, the `if` wasn't just buggy — it was unnecessary. One response, one status code, no ternary.

### An old bug, repeated: `requireAdmin` without `verifyToken` first

While wiring the route, `requireAdmin` was attached without `verifyToken` in front of it:

```javascript
router.get("/:id/applications", requireAdmin, getApplicants);   // ❌ missing verifyToken
```

`requireAdmin` reads `req.user.role` — but nothing had set `req.user` yet, because `verifyToken` never ran. Result: `req.user` is `undefined`, `requireAdmin`'s `!req.user` check is `true`, and it returns `401 admin access required` **even for a genuinely valid admin token** — a silently wrong rejection, not a crash. This is the exact same failure shape as Lesson 34 (a guard depending on a step that never ran) — worth noting that this kind of bug can resurface on *every new route*, not just once. The fix is always the same: every guard that reads `req.user` needs `verifyToken` listed before it, no exceptions.

```javascript
router.get("/:id/applications", verifyToken, requireAdmin, getApplicants);   // ✅
```

### Live-testing results (this session)

Following Lesson 33's discipline — testing both the pass and the block, not just the happy path:

| Test | Result | Confirms |
|---|---|---|
| Admin token, own scholarship with an applicant | `200` + list with real `name`/`email` | JOIN works end-to-end |
| Student token, any scholarship id | `401 admin access required` | `requireAdmin` blocking correctly |
| No token at all | `401 no token provided` | `verifyToken` blocking first, before `requireAdmin` even runs |

**Not yet tested live** (no test data existed for these cases this session — a data-setup gap, not a code-confidence gap): a scholarship the admin posted with zero applicants, and a scholarship posted by a *different* admin. Both are expected, by the SQL's own logic, to return `200 + []` — but Lesson 33's whole point is that reasoning through code isn't the same as watching it happen. Flagged as still open, to close with a second admin account + a second scholarship in a future session.

> One line: **nest a route under its parent (`/scholarships/:id/applications`) when the child only makes sense in the parent's context; a JOIN stitches two tables together via a shared key to fix a data-shape problem, not an access problem, and every table-prefix reference in a multi-table query must be spelled identically everywhere; expressing ownership as a `WHERE` clause (`posted_by = $2`) collapses "not yours," "doesn't exist," and "yours but empty" into one `200 + []` response with zero branching in the controller — and checking `!applications` for that case is always dead code, since `result.rows` is truthy even when empty; and `requireAdmin` still needs `verifyToken` in front of it on every new route, or a valid admin gets wrongly rejected instead of a crash.**

---

## Part 2 Cheatsheet Additions

### New terms

| Term | One-line definition |
|---|---|
| `scripts` (package.json) | Named shortcuts for commands; `npm run dev` runs the `dev` one |
| nodemon | Dev tool that watches files and auto-restarts the server on save |
| `node` vs `nodemon` | Both start the server; only nodemon reloads on save |
| `dependencies` | Libraries the app needs to run (ship to production) |
| `devDependencies` | Build-only tools (nodemon, Prettier); skipped in production |
| `bcrypt.compare(plain, hash)` | Re-hashes the input and checks it against the stored hash → true/false |
| `jwt.sign(payload, secret, opts)` | Mints a token from data, signed by the secret |
| claim | One field inside a JWT payload (e.g. `userId`, `role`) |
| `iat` / `exp` | JWT timestamps: "issued at" / "expires" |
| middleware | A guard function that runs before the handler; `next()` = pass, send a response = block |
| `next()` | Call it in middleware to wave the request onward to the next guard/handler |
| global vs targeted middleware | `app.use(x)` = every request; `router.post(path, x, handler)` = that route only |
| BUILD vs WALK | Startup builds the route map once (`require` cascade → `app.listen`); each request walks it |
| wiring vs middleware | `router.post`/`app.use` build the map (run once); middleware guards the handler (per request) |
| `Authorization` header | Where a request carries its token, formatted `Bearer <token>` |
| `jwt.verify(token, secret)` | Recomputes-and-compares; returns the payload if genuine, throws if not |
| `req.user` | A property YOU attach in `verifyToken` (payload); later steps read it. Not an Express feature |
| `verifyToken` | Guard 1 — checks the token is real, sets `req.user`, else 401 |
| `requireAdmin` | Guard 2 — reads `req.user.role`, 401s non-admins (RBAC) |
| RBAC | Role-based access control — routes check `req.user.role` before running |
| JWT snapshot | A token carries the role from signing time; DB role changes need a fresh login |
| `req.params` | Object holding URL path variables marked with `:name` in the route definition (e.g. `:id` → `req.params.id`) |
| REST | Re**p**resentational **S**tate **T**ransfer — API convention: resources get URLs, HTTP verbs describe the action, requests are stateless |
| resource path vs action path | `/scholarships/:id` (verb already does the work) vs `/auth/login` (path must name the action — there's no resource/id to point at) |
| `RETURNING *` discipline | Every INSERT/UPDATE needs `RETURNING *;` in the SQL AND `return result.rows[0];` in the JS, or the write silently vanishes from the response |
| route order | Literal/specific paths must be listed above variable (`:id`) paths in the same router file, or the variable route can silently swallow requests meant for the literal one |
| soft-delete verification | A `200` from `DELETE` only proves the request ran — confirm the row still exists via a direct `SELECT`, don't trust the response alone |
| `requireStudent` | Mirror of `requireAdmin` — 401s any request whose `req.user.role !== "student"`; needed because RBAC guards can point either direction, not just admin-only |
| authentication vs authorization | Two separate questions every protected route must answer: "are you logged in?" (`verifyToken`) vs "are you allowed to do THIS?" (a role guard) — passing one doesn't imply passing the other |
| `pg` + `undefined` → `NULL` | The `pg` driver silently converts a JS `undefined` bound parameter into SQL `NULL` — a missing field can silently overwrite existing data with no error |
| `CHECK` constraint + `NULL` | A `CHECK` constraint evaluates to `NULL` (not `FALSE`) when the checked value is `NULL`, and Postgres treats that as passing — `CHECK` does NOT reject `NULL` by default |
| `COALESCE(a, b)` | SQL function: returns `a` if it's not `NULL`, otherwise `b` — the real tool for genuine partial updates (belongs on a `PATCH` route, not a `PUT`) |
| PUT = full replacement | Deliberate project-wide convention: `PUT` routes require every field to be sent, rather than supporting partial updates — kept consistent across scholarships and applications |
| nested resource route | A URL like `/scholarships/:id/applications` — used when a child collection only makes sense in the context of a specific parent, as opposed to a query param on an independent collection |
| JOIN | Combines rows from two tables into one result, matched by a shared key (e.g. `applications.student_id = users.id`) — solves a data-shape problem, not an access-control one |
| N+1 query problem | Running one query per row to fetch related data (instead of one JOIN) — works, but slow; worth naming when spotted |
| ownership-as-filter | Expressing "only show rows this user owns" as a `WHERE` clause condition (e.g. `posted_by = $2`) instead of an `if` check in the controller — collapses "not found," "not yours," and "yours but empty" into one uniform response |

### Error tells at a glance

| Error message | Almost always means | Fix |
|---|---|---|
| `Missing script: "dev"` | No `dev` shortcut in package.json | Add it to `"scripts"` |
| `argument handler must be a function` | Route import is `undefined`/wrong shape | Match `{ }` braces on require/exports |
| `Cannot destructure property '...' of 'req.body'` | `express.json()` missing/below routes, or body not JSON | Order middleware first; send `application/json` |
| `ERR_HTTP_HEADERS_SENT` | Two responses on one request | Use `.status(code).json(body)`; one reply per path; check every branch has a `return` |
| `Illegal arguments: string, undefined` (bcrypt) | One input is `undefined` | Find which; trace why it's empty |
| `ReferenceError: X is not defined` | `X` never imported | Add the `require` at the top |
| `TypeError: X is not a function` | Imported, wrong shape | Fix the braces |
| `invalid input syntax for type integer: ":id"` (or similar, with a colon) | Left route-definition syntax (`:id`) in an actual request URL instead of a real value | Replace `:id` with the real value, e.g. `/scholarships/1` not `/scholarships/:id` |
| `Cannot read properties of undefined (reading '0')` | Accessed a property that doesn't exist right before `[0]` — e.g. `result.row[0]` instead of `result.rows[0]` | Compare the exact property name against a working example |
| Response looks empty/`undefined` after a successful INSERT/UPDATE (no thrown error) | Missing `RETURNING *;` in the SQL, or missing `return result.rows[0];` in the JS | Add both — they're a pair, not optional extras |
| Wrong status code returned (not a crash, just semantically off) | 404 vs 400 confused, or 200 vs 201 confused | Re-check against Lesson 22's table: 400 = bad input, 404 = valid request but no match; 200 = success on existing data, 201 = something new created |
| A request just hangs forever, no response, no error | Middleware guard is missing `next()` on its success/pass path | Every guard needs an explicit `next()` reached when it does NOT block — check both branches, not just the failure one |
| A wrong-role user (e.g. admin) can hit a route meant for another role, no error at all | Route only has `verifyToken`, no role-specific guard | Authentication ("logged in?") and authorization ("allowed HERE?") are separate checks — add the matching `requireX` guard |
| A field silently disappears / gets wiped to null after an update, no error thrown | JS `undefined` (a field never sent) was passed straight into a `pg` query, silently became SQL `NULL` | Validate required fields are present BEFORE calling the model; don't rely on the `CHECK` constraint to catch `NULL` — it won't |
| `missing FROM-clause entry for table "..."` | A table-prefix typo on a column reference in a multi-table query (e.g. `application.status` instead of `applications.status`) | Check every table-prefix in the query is spelled identically, everywhere |
| A valid, correctly-privileged user still gets `401` on a brand-new route, no other errors | A role guard (`requireAdmin`/`requireStudent`) is attached without `verifyToken` running first, so `req.user` is `undefined` | Add `verifyToken` before the role guard in the route's middleware list |

---

*Part 2 updated: 2026-07-05 (Lesson 36 added: admin view-applicants feature — nested resource routing, the first JOIN query, ownership expressed as a `WHERE` filter that collapses "not found / not yours / empty" into one uniform response, a dead-code `!applications` check, and a repeat of the `verifyToken`-before-`requireAdmin` ordering bug) | Mentor: Claude (Anthropic) | Course context: CMSC 127, UP Tacloban*