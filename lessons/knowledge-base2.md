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
30. [The `req` Object & Request-Scoped Data](#lesson-30-req-object)
31. [POST vs GET Revisited](#lesson-31-post-vs-get-revisited)

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

### Error tells at a glance

| Error message | Almost always means | Fix |
|---|---|---|
| `Missing script: "dev"` | No `dev` shortcut in package.json | Add it to `"scripts"` |
| `argument handler must be a function` | Route import is `undefined`/wrong shape | Match `{ }` braces on require/exports |
| `Cannot destructure property '...' of 'req.body'` | `express.json()` missing/below routes, or body not JSON | Order middleware first; send `application/json` |
| `ERR_HTTP_HEADERS_SENT` | Two responses on one request | Use `.status(code).json(body)`; one reply per path |
| `Illegal arguments: string, undefined` (bcrypt) | One input is `undefined` | Find which; trace why it's empty |
| `ReferenceError: X is not defined` | `X` never imported | Add the `require` at the top |
| `TypeError: X is not a function` | Imported, wrong shape | Fix the braces |

---

*Part 2 started: 2026-07-01 (Lessons 24–31: npm/nodemon/deps, building login, JWT anatomy, login debugging, request lifecycle, auth middleware + RBAC, the req object, POST vs GET) | Mentor: Claude (Anthropic) | Course context: CMSC 127, UP Tacloban*