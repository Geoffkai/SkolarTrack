# Geoffrey's Software Engineering Knowledge Base
 
> **How to use this file:**
> Upload this to your Claude Project so it's available in every chat.
> When you learn something new, tell Claude: *"Update my knowledge base with what we just learned about X"*
> and Claude will add it and give you an updated file to re-upload.
 
---
 
## Table of Contents
 
1. [MySQL vs PostgreSQL](#lesson-1-mysql-vs-postgresql)
2. [What is Neon.tech?](#lesson-2-what-is-neontech)
3. [Which PostgreSQL Version to Use](#lesson-3-which-postgresql-version-to-use)
4. [How to Learn PostgreSQL (Coming from MySQL)](#lesson-4-how-to-learn-postgresql-coming-from-mysql)
5. [What is `pg` (node-postgres)?](#lesson-5-what-is-pg-node-postgres)
6. [What is `dotenv` and `.env` files?](#lesson-6-what-is-dotenv-and-env-files)
7. [What is npm?](#lesson-7-what-is-npm)
8. [Understanding `.env` Variables (JWT, PORT, etc.)](#lesson-8-understanding-env-variables-jwt-port-etc)
9. [How Senior Engineers Start a Project](#lesson-9-how-senior-engineers-start-a-project)
10. [Dev Tooling Setup & Claude vs GitHub vs Claude Code](#lesson-10-dev-tooling-setup)
11. [Secret Safety & Git Tracking](#lesson-11-secret-safety-and-git-tracking)
12. [Schema Design: Final? Normalization, Constraints](#lesson-12-schema-design)
13. [What is a `pg` Pool? (Deep Dive)](#lesson-13-what-is-a-pg-pool)
14. [What is `pg`? Library vs Driver vs API](#lesson-14-what-is-pg-library-vs-driver-vs-api)
15. [Building `db.js` (process.env, module.exports, require)](#lesson-15-building-dbjs)
16. [What is Express? (Server, app.js, index.js)](#lesson-16-what-is-express)
17. [Middleware, `express.json()`, and `app.use()`](#lesson-17-middleware-and-appuse)
18. [HTTP Verbs & What a Route Is](#lesson-18-http-verbs-and-routes)
19. [Password Hashing & bcrypt (Salt, Cost Factor)](#lesson-19-password-hashing-and-bcrypt)
20. [JWT Deep Dive: How Signing & Verifying Actually Work](#lesson-20-jwt-deep-dive)
21. [The Controller & Route Layers (MVC in Practice)](#lesson-21-controller-and-route-layers)
22. [HTTP Status Codes](#lesson-22-http-status-codes)
23. [Debugging: Reading Errors & Making the Server Tell the Truth](#lesson-23-debugging)
---
 
## Lesson 1: MySQL vs PostgreSQL
 
**Date learned:** 2026-06-09
**Tags:** `databases` `mysql` `postgresql` `fundamentals`
 
Both are open-source relational databases, but they differ in philosophy and features. PostgreSQL is the better long-term investment — it enforces proper SQL habits and has more powerful features.
 
### Key Concepts
 
- **Philosophy:** MySQL prioritizes speed and simplicity. PostgreSQL prioritizes standards compliance and extensibility.
- **Data integrity:** PostgreSQL strictly follows SQL standards — it will NOT silently accept bad or wrong-type data. MySQL historically was lenient (though STRICT MODE helps now).
- **Advanced types:** PostgreSQL supports richer native types: `JSONB`, arrays, `UUID`, geometric types, network address types. MySQL supports `JSON` but is more limited.
- **Extensibility:** PostgreSQL is highly extensible — you can write custom functions in Python, JavaScript, C, and add extensions like `PostGIS` (maps), `pgvector` (AI search).
- **Ecosystem:** MySQL is the "M" in the classic LAMP stack — dominant in WordPress and legacy web apps. PostgreSQL is increasingly the default for new modern applications.
- **Concurrency:** Both use MVCC (Multi-Version Concurrency Control), but PostgreSQL's implementation is more robust for complex, high-concurrency workloads.
- **Full-text search:** PostgreSQL has powerful built-in full-text search. MySQL's is more limited.
### The Analogy
 
> MySQL = Toyota Corolla. Fast, reliable, widely used, gets the job done.
> PostgreSQL = BMW. More features, stricter engineering, preferred for complex tasks, increasingly popular.
 
### CMSC 127 Connection
 
Everything you learned in CMSC 127 — ERDs, normalization, transactions, triggers, constraints, views, indexes — is **database theory**, not MySQL-specific. It transfers 1:1 to PostgreSQL.
 
---
 
## Lesson 2: What is Neon.tech?
 
**Date learned:** 2026-06-09
**Tags:** `neon` `cloud` `postgresql` `infrastructure` `serverless`
 
Neon is fully managed, serverless PostgreSQL in the cloud. Instead of PostgreSQL running on your laptop, it runs on Neon's servers on the internet. You connect to it with a URL instead of `localhost`.
 
### Key Concepts
 
- **What it is:** PostgreSQL hosted on the internet — you don't install or manage anything.
- **Serverless:** The database automatically turns OFF when nobody is using it, and wakes up the moment you connect. This saves cost — you only pay for actual usage.
- **Scale-to-zero:** After ~5 minutes of inactivity, compute scales to zero. Reactivating takes a few hundred milliseconds.
- **Database branching:** Just like Git branches for code, Neon lets you branch your entire database. Create a copy of production for testing without duplicating storage cost.
- **Free tier:** 100 compute hours + 0.5 GB storage per month — more than enough for learning and personal projects.
- **Region:** AWS Asia Pacific 1 (Singapore) — closest to the Philippines, lowest latency.
- **Acquired** by Databricks in May 2025 for ~$1 billion. Remains open source and independent.
- **Setup:** Takes about 30 seconds. Get a connection string URL from the dashboard.
### The Architecture Shift
 
```
CMSC 127 labs:
[Your Java/Python App] ──connects──> [MySQL on localhost:3306]
 
With Neon:
[Your JavaScript App]  ──connects──> [PostgreSQL on neon.tech via internet]
```
 
The SQL you write doesn't change. Only the address you connect to changes.
 
### CMSC 127 Connection
 
This is the same **Client-Server Architecture** from Module 6. Your app = Client. Neon = Server. The server just moved from your laptop to the internet.
 
---
 
## Lesson 3: Which PostgreSQL Version to Use
 
**Date learned:** 2026-06-09
**Tags:** `postgresql` `versions` `tooling`
 
**Use PostgreSQL 17.** It's the sweet spot between stable, widely documented, and fully supported by all tools and libraries.
 
### Current Version Landscape (as of June 2026)
 
| Version | Status | Verdict |
|---|---|---|
| 19 | Beta | Too new — don't use for learning |
| 18 | Latest stable (18.4, May 2026) | Very new — tools still catching up |
| **17** | **Stable + widely supported** | **Use this ✅** |
| 16 | Stable | Also fine |
| 14 | Dies November 2026 | Avoid — end of life soon |
 
### Key Concepts
 
- A new major PostgreSQL version releases approximately **once per year**.
- Each major version receives official support for **5 years** from initial release.
- Versions 13 and older are already EOL (End of Life) and unsupported.
- PostgreSQL 19 Beta 1 was released June 4, 2026 — never use beta for learning.
- **Why not 18?** Stack Overflow answers, tutorials, and libraries are all written for 17. Fewer surprises.
- On Neon: select version 17 when creating your database project.
---
 
## Lesson 4: How to Learn PostgreSQL (Coming from MySQL)
 
**Date learned:** 2026-06-09
**Tags:** `postgresql` `mysql` `learning-path` `cmsc127`
 
Since you completed CMSC 127 with MySQL, you already know the hardest parts. You're not a beginner — you're a MySQL developer making a lateral move. Expect 2–4 weeks of focused practice to feel fully comfortable.
 
### What's Almost Identical (You'll feel at home)
 
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` — nearly identical syntax
- `JOIN`s, subqueries, aggregates
- Transactions (`BEGIN`, `COMMIT`, `ROLLBACK`)
- Triggers and constraints logic
- Views and indexes concepts
- ERD → schema translation
### Small Syntax Differences to Learn
 
| Topic | MySQL | PostgreSQL |
|---|---|---|
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` |
| String quotes | Flexible (`"` or `'`) | Strict — single quotes `'` only for strings |
| Backticks | `` `table` `` for identifiers | Use double quotes `"table"` instead |
| Show tables | `SHOW TABLES` | `\dt` in psql |
 
### New Things PostgreSQL Adds
 
- **`JSONB`** — store and query JSON data natively and fast
- **Arrays** — a column can hold a list of values
- **CTEs (`WITH` clauses)** — cleaner way to write complex queries
- **Window functions** — powerful analytics: `ROW_NUMBER()`, `RANK()`, `LAG()`
- **`RETURNING` clause** — get back data immediately after `INSERT`/`UPDATE`
- **Extensions** — `pgcrypto`, `uuid-ossp`, `PostGIS`, `pgvector`
### Learning Roadmap
 
1. **Phase 1 (Day 1–2):** Install PostgreSQL + pgAdmin or DBeaver. Recreate a CMSC 127 lab exercise.
2. **Phase 2 (Week 1):** Bridge the syntax gaps. Rewrite MySQL queries in PostgreSQL style.
3. **Phase 3 (Week 2–3):** Learn CTEs, window functions, JSONB.
4. **Phase 4 (Week 3–4):** Rebuild your CMSC 127 machine problem in PostgreSQL with a real backend.
---
 
## Lesson 5: What is `pg` (node-postgres)?
 
**Date learned:** 2026-06-09
**Tags:** `pg` `node.js` `javascript` `database-driver` `backend`
 
`pg` is the database driver that lets your Node.js/JavaScript code talk to PostgreSQL. It is the **JDBC equivalent for JavaScript** — the translator between your app code and your database.
 
### Key Concepts
 
- **What it is:** An API/driver that connects JavaScript to PostgreSQL. Without it, your code has no way to reach the database.
- **Every language has one:** Java → JDBC, JavaScript → `pg`, Python → `psycopg2`, PHP → `mysqli`
- **Install it:** `npm install pg`
### Pool vs Client
 
| | Client | Pool |
|---|---|---|
| What it is | One single connection | A managed team of connections |
| You manage it? | Yes — connect, use, disconnect manually | No — automatic |
| Forget to disconnect? | Connection leak | Handled automatically |
| Multiple requests? | Can't handle simultaneously | Yes — requests share the pool |
| Use in web server? | Never | Always |
 
**The restaurant analogy:** Pool = hiring 5 cashiers at the start of the day. They stand ready, handle customers, then become available again. Client = hiring and firing one cashier per customer. Insanely slow and wasteful.
 
**Rule:** Always create **one** Pool, in `db.js`, export it, import it everywhere. Never create new connections per request.
 
### How `pool.query()` Works
 
```javascript
// Send SQL to PostgreSQL
const result = await pool.query('SELECT * FROM users');
 
// Your data is always in result.rows
// It's a plain JavaScript array of objects
// Each object = one database row, each key = column name
console.log(result.rows);
// [ { id: 1, name: 'Geoffrey', email: 'geoffrey@up.edu.ph' } ]
```
 
### `$1` Placeholders — SQL Injection Prevention
 
```javascript
// NEVER do this — SQL injection risk
pool.query('SELECT * FROM users WHERE email = ' + email);
 
// ALWAYS do this — $1 is safely substituted by pg
pool.query('SELECT * FROM users WHERE email = $1', [email]);
```
 
`$1` is the same concept as `PreparedStatement` in your CMSC 127 JDBC labs.
 
### The Full Request Chain
 
```
1. User clicks "Login" on the app
2. Browser sends POST /auth/login to your Express server
3. Express route receives the request
4. Calls pool.query() with SQL
5. pg sends SQL over the internet to Neon.tech
6. PostgreSQL runs the query
7. Results return to pg as result.rows
8. Your code sends result.rows back as JSON
9. User sees their data
```
 
### CMSC 127 Connection
 
| CMSC 127 (Java/JDBC) | This (JavaScript/pg) |
|---|---|
| `DriverManager.getConnection()` | `new Pool({ connectionString })` |
| `stmt.executeQuery("SELECT...")` | `pool.query("SELECT...")` |
| `ResultSet rs` | `result.rows` |
| `PreparedStatement` with `?` | `$1`, `$2` placeholders |
 
---
 
## Lesson 6: What is `dotenv` and `.env` files?
 
**Date learned:** 2026-06-09
**Tags:** `dotenv` `security` `environment-variables` `backend`
 
`.env` is a hidden file that stores secrets (passwords, API keys) so they never appear in your code or get pushed to GitHub. `dotenv` is the library that reads `.env` into your Node.js code.
 
### Key Concepts
 
- **The problem:** Your database connection string contains your password. If you paste it directly in your code and push to GitHub — anyone in the world can access your database.
- **The solution:** Put secrets in a `.env` file that stays only on your computer.
- **`.env` file** — never committed to GitHub (always in `.gitignore`)
- **`.env.example` file** — safe template showing what variables are needed, no real values
### How It Works
 
```bash
# server/.env  — this NEVER goes to GitHub
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
JWT_SECRET=some-long-random-secret
PORT=3000
```
 
```javascript
// In your code — read with dotenv
require('dotenv').config();
const url = process.env.DATABASE_URL; // reads from .env safely
```
 
- `process.env.DATABASE_URL` reads the value from `.env` at runtime
- Password is never exposed in your source code
- No CMSC 127 equivalent — this is a real-world practice you learn in industry
---
 
## Lesson 7: What is npm?
 
**Date learned:** 2026-06-09
**Tags:** `npm` `javascript` `tools` `node.js` `package-manager`
 
npm (Node Package Manager) is the App Store for JavaScript libraries. Instead of manually downloading code files, you type `npm install` and it handles finding, downloading, and tracking everything automatically.
 
### Key Concepts
 
- **What it is:** A package manager — automates downloading and managing JavaScript libraries
- **Install a package:** `npm install pg` — downloads the `pg` library into your project
- **`package.json`** — your project's "shopping list" of all dependencies and their versions
- **`node_modules/`** — the folder where all downloaded packages live on your computer
- **Never push `node_modules` to GitHub** — it can be 100MB+. Always in `.gitignore`.
- **Recreate from scratch:** If a classmate clones your project, `npm install` reads `package.json` and re-downloads everything automatically
- **Run your project:** `npm start` or `npm run dev`
### Common Commands
 
```bash
npm install pg          # install one package
npm install pg dotenv   # install multiple packages at once
npm install             # install everything in package.json (used after cloning)
npm run dev             # run the project in development mode
npm start               # run the project in production mode
```
 
### CMSC 127 Connection
 
| Old way (Java in CMSC 127) | npm way (JavaScript) |
|---|---|
| Manually download `.jar` file | `npm install pg` |
| Add `.jar` to classpath | Happens automatically |
| Track versions manually | `package.json` tracks it |
| Share project without `.jar` | Share without `node_modules`, use `npm install` |
 
### The Analogy
 
> npm = Google Play Store for JavaScript code.
> Instead of going to a website, finding a library, downloading it, and manually wiring it up — you just type one command and npm does all of that for you.
 
---
 
## Lesson 8: Understanding `.env` Variables (JWT, PORT, etc.)
 
**Date learned:** 2026-06-09
**Tags:** `jwt` `security` `environment-variables` `authentication` `backend`
 
Your `.env` file holds secret settings your app needs to run. Each variable has a specific job. Never hardcode these values directly in your code — and never push this file to GitHub.
 
### The Four Variables Explained
 
#### `DATABASE_URL`
The connection string to your Neon.tech PostgreSQL database. The address your app uses to reach the database over the internet.
```bash
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
```
Where to get it: Neon.tech dashboard → your project → Connection Details.
 
#### `JWT_SECRET`
JWT stands for **JSON Web Token** — this is how your app handles login sessions.
 
When a user logs in, your server gives them a **token** (like a concert wristband) as proof they're logged in. Every future request they make includes that token. Your server checks it to verify they're allowed in.
 
`JWT_SECRET` is the **secret key your server uses to stamp and verify those tokens**. Only your server knows it. If someone tries to fake a token without knowing the secret, the server rejects it.
 
```bash
JWT_SECRET=some_very_long_random_string_nobody_can_guess
```
Where to get it: **You generate it yourself.** Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output. That's your JWT_SECRET.
 
#### `PORT`
Which numbered "door" on your computer your server listens on. Your computer has thousands of ports — different programs use different ones (MySQL uses 3306, HTTPS uses 443, etc.).
 
```bash
PORT=3000
```
This means your app runs at `http://localhost:3000` during development.
Where to get it: **You choose it.** `3000` is the standard convention for Node.js/Express apps.
 
#### `JWT_EXPIRES_IN`
How long a login token stays valid before it expires and the user must log in again.
 
```bash
JWT_EXPIRES_IN=7d
```
 
| Value | Meaning |
|---|---|
| `1h` | 1 hour |
| `24h` | 24 hours |
| `7d` | 7 days — good default for most apps |
| `30d` | 30 days |
 
Where to get it: **You decide.** `7d` is fine for a student project.
 
### Your Complete `.env` File
 
```bash
# Database — from Neon.tech dashboard
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
 
# Auth — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_your_generated_string_here
 
# Server port — just use 3000
PORT=3000
 
# How long login sessions last
JWT_EXPIRES_IN=7d
```
 
### Summary Table
 
| Variable | What it is | Where you get it |
|---|---|---|
| `DATABASE_URL` | Address of your PostgreSQL database | Neon.tech dashboard |
| `JWT_SECRET` | Secret key for signing login tokens | Generate with `node -e "...crypto..."` |
| `PORT` | Which port your server runs on locally | Just type `3000` |
| `JWT_EXPIRES_IN` | How long login sessions stay valid | You decide — `7d` is fine |
 
> **Golden rule:** This file NEVER goes to GitHub. It's already in `.gitignore`. These are secrets — treat them like passwords.
 
---
 
## Lesson 9: How Senior Engineers Start a Project
 
**Date learned:** 2026-07
**Tags:** `workflow` `architecture` `project-planning`
 
Seniors don't start with the visible stuff (login page, UI). They ask *"what does everything else depend on?"* and build that first. Build from the foundation up.
 
### The Build Order (foundation → top)
 
1. **Database schema** — lock the tables first; everything depends on the shape of the data
2. **Project skeleton + environment** — folders, `package.json`, `.env`
3. **Server + DB connection** — `GET /health` returns `{ status: "ok" }`, proof the wiring works
4. **Auth (register + login)** — every protected route depends on knowing who's asking
5. **Backend features (API routes)** — all tested in Thunder Client before React exists
6. **React frontend** — build UI on routes you already proved work
7. **Deploy** — Railway + Vercel; deploy early, deploy often
### Key Principle
 
- **Junior mistake:** build UI first → it has nowhere to send data → throw it away and rebuild
- **Senior approach:** schema → server → prove it → then build on a verified foundation
- **Commit at every working state** — not when a feature is "done." Git is your save point/undo button.
- A working state that isn't committed is a working state you can lose.
---
 
## Lesson 10: Dev Tooling Setup
 
**Date learned:** 2026-07
**Tags:** `setup` `tooling` `claude` `github` `node`
 
### Claude vs GitHub vs Claude Code — three different things
 
- **Claude (chat)** = your mentor/tutor. Nothing to install. Ask questions, paste errors, get explanations.
- **GitHub** = website where code is backed up and shown to employers. Needs (a) a free account, (b) **Git** installed locally. Git = the tool; GitHub = the website it talks to.
- **Claude Code** = optional AI agent that writes code directly in your files. **Avoid while learning Project 1** — the goal is to understand every line yourself. Pick it up in Project 2+.
### The Day 0 Toolchain (install before any coding)
 
- **Node.js 24 LTS** (from nodejs.org — the LTS version, not "Current"/26). Gives you `node` + `npm`. Verify: `node -v`, `npm -v`
- **VS Code** + extensions: **Thunder Client** (API testing), **ESLint**
- **Git** (git-scm.com). Verify: `git --version`. Set identity: `git config --global user.name/user.email`
- **GitHub account** (free)
- **Neon account** + database, copy the `DATABASE_URL`
### The folder rule
 
- Every backend npm command runs from **inside `server/`** — never from project root, never from `lessons/`
- `node_modules` should exist in exactly one place: `server/node_modules`
- Deleting `node_modules` is always safe — it rebuilds from `package.json` via `npm install`
---
 
## Lesson 11: Secret Safety and Git Tracking
 
**Date learned:** 2026-07
**Tags:** `security` `git` `secrets` `dotenv`
 
### The golden rule
 
The moment a secret (DB password, JWT_SECRET) leaves your `.env` — into a chat, screenshot, anywhere — **treat it as burned and rotate it.** Cheap to fix now (no users); catastrophic later.
 
### Rotating leaked secrets
 
- **DB password:** Neon dashboard → branch → Roles → reset password for the role → gives a new connection string. (Connection strings do NOT expire on their own — only resetting the password kills the old one.)
- **JWT_SECRET:** regenerate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
### The `.gitignore` trap (important)
 
- `.gitignore` only ignores files Git **isn't already tracking.** If `.env` was committed even once before being ignored, Git keeps tracking it — and `.gitignore` does nothing.
- **Check what's tracked:** `git ls-files | Select-String "env"` (PowerShell)
  - ✅ Want to see: `server/.env.example` (safe template, meant to be shared)
  - ❌ Do NOT want: `server/.env`
- **If `.env` is tracked, untrack it:** `git rm --cached server/.env` → commit → push (keeps the local file, stops tracking it)
- Always run `git status` before committing and confirm `.env` is NOT listed.
---
 
## Lesson 12: Schema Design
 
**Date learned:** 2026-07
**Tags:** `database` `schema` `normalization` `constraints` `cmsc127`
 
### Is a schema ever "final"? No.
 
A schema is never final and isn't supposed to be. But the **cost of changing it rises over time** — free now (no data, no code), expensive later (migrate data, rewrite queries). So: get the core right now while it's cheap, accept the edges will shift. Don't build v2 tables now "just in case" — adding a table later is cheap.
 
### Normalization (this is CMSC 127 theory, transfers 1:1)
 
- **1NF** — atomic values, no repeating groups / lists in one column
- **2NF** — no partial dependency on *part* of a key. Only a risk with **composite** keys. A single `id SERIAL PRIMARY KEY` satisfies 2NF automatically.
- **3NF** — no non-key column depending on another non-key column (no transitive dependencies)
- For a small app, **3NF is the right stopping point.** Over-normalizing (splitting `school`/`organization` into their own tables) just adds joins you don't need yet.
### Constraints learned
 
- **DEFAULT** — supplies a value when you *omit* the column on insert (e.g. `created_at TIMESTAMP DEFAULT NOW()`, `status ... DEFAULT 'open'`). If you provide a value, yours wins; the default is ignored.
- **NOT NULL** — *forbids* an empty value (insert fails without one). Different from DEFAULT: NOT NULL forbids empty, DEFAULT fills empty. Common pairing: `created_at TIMESTAMP NOT NULL DEFAULT NOW()`.
- **UNIQUE (col_a, col_b)** — a composite unique rule. Used `UNIQUE (student_id, scholarship_id)` so a student can't save the same scholarship twice.
- **Harden FKs and role columns with NOT NULL** — a `NULL` role breaks RBAC; a `NULL` student_id/scholarship_id is meaningless data. Add NOT NULL while tables are empty (free); after data exists you must clean violators first.
### SERIAL behind the scenes
 
`SERIAL` quietly creates a *sequence* (auto-incrementing counter) and sets the column default to `nextval('..._id_seq')`. It's PostgreSQL's `AUTO_INCREMENT`. Seeing `nextval(...)` as a default is normal, not an error.
 
### Keep schema in the repo
 
Save final `CREATE TABLE` statements in `server/db/schema.sql` and commit it. This is the lightweight version of *migrations* (pro tools: Flyway, node-pg-migrate). Rebuilds the DB if it breaks; safe to commit (no secrets).
 
### On Neon specifically
 
- You do **not** `CREATE DATABASE` — Neon already made `neondb` for you. The SQL Editor is already inside it. Just run `CREATE TABLE`.
- PostgreSQL has **no `USE` statement** (that's MySQL). Unquoted names can't have hyphens (read as minus) — use underscores.
---
 
## Lesson 13: What is a `pg` Pool?
 
**Date learned:** 2026-07
**Tags:** `pg` `pool` `database` `performance` `backend`
 
A **Pool** is a set of database connections opened once, kept alive, and **reused** — instead of "open → query → close" per request, it's "borrow an open connection → query → return it."
 
### Why it exists
 
Opening a DB connection is expensive: TCP handshake + SSL negotiation (your Neon URL has `sslmode=require`) + auth = 50–300ms *each*. Doing that per request is wasteful, and Neon's free tier caps simultaneous connections. The Pool reuses connections so you pay that cost rarely.
 
**Cashier analogy:** Pool = a team of cashiers hired for the day. A customer (request) gets an available cashier, who then goes back to ready. Five at once → five served in parallel. A sixth waits briefly for one to free up.
 
### Pool vs Client
 
- **Client** = one single connection you manage by hand (connect/disconnect manually). Forget to disconnect → leak. Can't handle simultaneous requests. Only for rare one-off scripts.
- **Pool** = many connections, managed automatically. **In a web server, always Pool, never Client.**
### The one rule
 
Create the Pool **exactly once** in `db.js`, export it, import the same instance everywhere. Never one-pool-per-model or one-pool-per-request — that defeats the purpose and exhausts Neon's connection limit.
 
### JDBC connection
 
`pg`'s Pool = JavaScript's version of Java's **HikariCP** / connection pooling. Same problem, same solution.
 
---
 
## Lesson 14: What is `pg`? Library vs Driver vs API
 
**Date learned:** 2026-07
**Tags:** `pg` `driver` `api` `fundamentals`
 
- `pg` (node-postgres) is a **library** — specifically a **database driver**: a translator between your JavaScript and PostgreSQL's network protocol.
- It takes `pool.query('SELECT...')`, converts it to PostgreSQL's wire format, sends it over the network, and converts the reply back into JS objects (`result.rows`).
- **Is it an API?** It *has* an API (the set of functions it exposes: `new Pool()`, `pool.query()`), but it is **not** a web API you call over the internet. Two meanings of "API":
  - The functions a library gives you to call (pg's API)
  - A web service reached over the internet (the REST API *you'll build*: `POST /auth/login`) — different thing, same 3 letters
- **Nesting:** `pg` = the toolbox. `Pool` = one tool inside it (`const { Pool } = require('pg')`). `pool.query()` = a method on your pool.
- **JDBC anchor:** Java → JDBC, JS → `pg`, Python → psycopg2, PHP → mysqli. Every language has a driver; same job.
---
 
## Lesson 15: Building `db.js`
 
**Date learned:** 2026-07
**Tags:** `db.js` `process.env` `module.exports` `require` `dotenv`
 
Lives at `server/src/config/db.js` (the `config/` folder is for setup/wiring code). Its only job: create the one pool and export it. **Zero SQL** here — that's separation of concerns (db.js connects, models query).
 
```javascript
require('dotenv').config();          // 1. load .env so DATABASE_URL exists
const { Pool } = require('pg');      // 2. take the Pool tool out of pg
const pool = new Pool({              // 3. create ONE pool, pointed at Neon
  connectionString: process.env.DATABASE_URL,
});
module.exports = pool;               // 4. export it so models can import it
```
 
### Concepts clarified
 
- **`require` ≈ Java's `import`, but more active** — `require` *runs the file and returns* what it exports, right on that line. You must **capture** the return value in a variable (`const x = require(...)`) or it's thrown away. (This bug — forgetting to capture — happened twice.)
- **You don't require the `.env` file** — you require the **`dotenv` library** and call `.config()`, which reads `.env` into `process.env`.
- **`process`** = a global object Node gives you, representing the running process. **`process.env`** = a drawer of environment variables (key-value pairs).
  - Flow: `.env` file → `dotenv.config()` loads it → `process.env.DATABASE_URL` reads one value out.
  - This is why dotenv must run **first** — before it runs, `process.env.DATABASE_URL` is `undefined`.
  - In production, the host (Railway) fills `process.env` with real values — same code, different environment supplies the secrets. That's why you never hardcode the URL.
- **`module.exports = pool`** makes the *same single* pool available to every file that does `require('../config/db')`.
- No SSL config needed in code — the `?sslmode=require` in the URL handles encryption.
---
 
## Lesson 16: What is Express?
 
**Date learned:** 2026-07
**Tags:** `express` `server` `app.js` `index.js` `backend`
 
A **server** is a program that runs continuously, waits for requests, and sends responses. Raw Node gives only low-level tools; **Express is a framework on top of Node** that makes it pleasant — its job is mapping incoming requests (method + path) to handler functions. Express = the **receptionist** matching each request to the right route handler.
 
### The two-file split (from CLAUDE.md)
 
- **`app.js`** — builds the app (middleware + routes), exports it. Does NOT start the server.
- **`index.js`** — imports app, calls `app.listen()`. Starts it. (One builds, one launches.)
```javascript
// index.js
require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 3000;   // fallback if PORT missing
app.listen(PORT, () => {                 // callback runs once server boots
    console.log(`Server running on port ${PORT}`);
});
```
 
```javascript
// app.js (the /health route, line by line)
const express = require('express');      // capture the return value!
const app = express();                   // create the app (receptionist)
app.use(express.json());                 // middleware (see Lesson 17)
const pool = require('./config/db');     // import the shared pool
 
app.get('/health', async (req, res) => { // route: GET /health → this handler
  try {
    await pool.query('SELECT 1');        // ping query; await = wait for Neon
    res.json({ status: 'ok', db: 'connected' });   // success reply (200)
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });  // failure
  }
});
module.exports = app;
```
 
### Concepts
 
- **`req`** = everything about the incoming request (body, params, headers, who's asking). **`res`** = your tool to send a reply.
- **`async`/`await`** — mark a handler `async` so you can `await` slow operations (DB queries). `await` pauses until the answer comes back, then continues. Without it, code races ahead with no result.
- **`try/catch`** — DB calls can fail; `try` runs the happy path, `catch` handles errors (sends 500 instead of crashing). Your spec requires this kind of error handling.
- **`SELECT 1`** = a trivial "ping" query — does no real work, just proves the connection is alive.
### Testing it: Thunder Client
 
Thunder Client = an **API testing tool** (VS Code extension). It *sends* requests to your server so you can see responses — the stand-in for a frontend you haven't built yet. Senior workflow: prove every route in Thunder Client, *then* build UI. Read the response: **Status 200 OK** = success; the JSON body is literally what your `res.json(...)` produced. (First query after idle is slow — Neon scale-to-zero waking up.)
 
---
 
## Lesson 17: Middleware and `app.use()`
 
**Date learned:** 2026-07
**Tags:** `middleware` `express` `app.use` `express.json`
 
### `express.json()` — the translator
 
Request bodies arrive as **raw JSON text**, not objects. `express.json()` intercepts each request, parses the JSON body, and sets it as `req.body` (so `req.body.email` works). Before it runs, `req.body` is `undefined`. **Mailroom clerk analogy:** it opens the sealed packages so your handler can read the contents.
 
### `app.use()` — registering middleware
 
- **Middleware** = code that runs **in the middle** — between a request arriving and the route handler running. A checkpoint every request passes through.
- `app.use(fn)` = "run this on **every** request, before routes." Not tied to a specific verb/path (unlike `app.get`).
- `express.json()` *creates* the translator; `app.use()` is what *activates* it for every request. They go together: `app.use(express.json())`.
```
request → [ app.use middleware runs ] → [ app.get/post matches route ] → handler
```
 
- `/health` is a GET with no body, so it doesn't need `express.json()` — but you add it once up top so register/login (which DO send bodies) work later.
- **This is also how auth works:** `middleware/auth.js` (verify JWT) and `middleware/roles.js` (check role) get wired in via `.use()`. `app.use("/admin", checkAdminRole)` runs only on `/admin` routes → gives the 401-for-students protection.
---
 
## Lesson 18: HTTP Verbs and Routes
 
**Date learned:** 2026-07
**Tags:** `routes` `http` `express` `rest`
 
### What a route is
 
A **route** = a rule that matches an incoming request (a **method + a path**) to the function that handles it. Example: `app.get("/health", handler)` → method `get`, path `/health`, handler function.
 
**Method + path together form the address.** The same path with different methods = different routes:
```javascript
app.get("/scholarships",  ...);  // LIST scholarships
app.post("/scholarships", ...);  // CREATE a scholarship
```
`GET /auth/login` and `POST /auth/login` are **two different routes** — as different to Express as two doors.
 
### The HTTP verbs (one method per `app.____`)
 
| Verb | Meaning | SkolarTrack use |
|---|---|---|
| `app.get` | **Read** data | browse scholarships, view tracker, /health |
| `app.post` | **Create** new | register, login, post scholarship, save application |
| `app.put` | **Replace/update** whole record | edit a scholarship listing |
| `app.patch` | **Partial update** (some fields) | change just an application's status |
| `app.delete` | **Remove** (soft delete here) | close a scholarship (`status='closed'`) |
 
All have the identical shape: `(path, async (req, res) => {})`. **PUT vs PATCH:** PUT = full replacement; PATCH = change only specific fields. Spec uses PUT for simplicity in v1.
 
### The big picture
 
Every line in the API Routes section of `scholarship-tracker-ph.md` is one route = one `app.<verb>(...)`. Building the backend = building these routes one at a time, all the same shape as `/health`. The `routes/` folder is where you *organize* them into files (`authRoutes.js`, etc.) instead of cramming all into `app.js`.
 
---
 
## Lesson 19: Password Hashing and bcrypt
 
**Date learned:** 2026-07
**Tags:** `bcrypt` `hashing` `security` `auth` `passwords`
 
### Core flow (the correct mental model)
 
- **Register:** user gives password → hash it → store **only the hash**. The real password is never saved.
- **Login:** user gives password again → hash that → compare to the stored hash → match = correct.
- Hashing is **one-way**: password → hash is easy; hash → password is impossible. So a stolen database leaks hashes, not passwords.
### What makes it *secure* (beyond plain hashing)
 
- **Salt** — a random string mixed into each password before hashing. Without it, identical passwords produce identical hashes, and attackers use precomputed **rainbow tables** to reverse common ones. Salt makes identical passwords hash differently and defeats rainbow tables. **bcrypt generates the salt and stores it inside the hash string itself** — you don't manage it separately.
- **Deliberate slowness** — normal hashes (SHA-256) are fast, which lets attackers try billions of guesses/sec. bcrypt is *intentionally slow* (~hundreds of ms). Invisible for one honest login; devastating for brute-force. Controlled by the **cost factor** (e.g. `10` = sane default = the "how slow on purpose" dial).
### The two functions (map onto the two halves of the flow)
 
```javascript
// REGISTRATION — "store the hash"
const hash = await bcrypt.hash(plainPassword, 10);
//   password + cost factor → generates salt → returns full hash to store
 
// LOGIN — "hash the input and compare"
const isMatch = await bcrypt.compare(plainPassword, storedHash);
//   re-hashes input using the salt baked into storedHash → returns true/false
```
 
- `compare()` does the whole hash-and-check in one call AND pulls the salt out of the stored hash automatically.
- Both are `async` (bcrypt is intentionally slow → takes real time → `await` it, like a DB query).
- **Install `bcryptjs`** (pure-JS, no Windows build headaches) instead of `bcrypt` — drop-in replacement, same API. Plus `jsonwebtoken` for JWTs: `npm install bcryptjs jsonwebtoken`.
### Hashing vs JWT (don't confuse them)
 
- **Hashing** protects *stored passwords*.
- **JWT** proves *who's logged in* on each request. Different jobs. (JWT = next lesson.)
---
 
## Lesson 20: JWT Deep Dive
 
**Date learned:** 2026-07
**Tags:** `jwt` `jwt-secret` `auth` `security` `signing` `verifying`
 
The second half of auth. Hashing protects *stored passwords*; JWT proves *who's logged in* on every request after login. Different jobs.
 
### JWT vs JWT_SECRET — the #1 confusion, settled
 
They are NOT the same kind of thing. **The secret is the stamp; the JWT is the stamped pass.**
 
| | `JWT_SECRET` | a JWT (the token) |
|---|---|---|
| What it is | The private stamp (a tool) | A stamped pass / ID card |
| How many | **One**, fixed forever | **Many** — a new one per login |
| Where it lives | `.env`, server only | Handed to user, lives in their browser (`localStorage`) |
| Who can see it | Only your server | Anyone holding the token |
| Travels to the user? | **NEVER** — stays home always | Yes, that's its whole job |
 
The secret is **never inside the token** and never sent anywhere. It's the tool that signs; the signature (the mark it leaves) goes in the token, but the tool itself stays on the server.
 
### A JWT = one login session, not one user
 
- `jwt.sign()` runs **every time someone logs in by typing their credentials**, and every run makes a fresh token.
- Same user logging in twice = two different tokens. Token = a session, not a person.
- "Automatic login" tomorrow isn't a new login — the **browser reused the token it saved** in `localStorage`. The password screen only reappears when there's no valid token (never had one, or it expired per `JWT_EXPIRES_IN=7d`).
### Made FROM the data, signed BY the secret (precise wording)
 
Two ingredients, two jobs:
- **Data** (e.g. `{ userId: 7, role: "student" }`) = the raw material the token is *made of*. Makes each token unique to each person.
- **`JWT_SECRET`** = the tool that *signs* it. Makes the token un-forgeable. Does NOT become part of the content.
```javascript
jwt.sign(
  { userId: 7, role: "student" },   // ingredient 1: the DATA (the "from")
  process.env.JWT_SECRET            // ingredient 2: the SECRET (the "by")
)  // → returns the finished JWT
```
Read it as: *"Sign this data, using this secret."* Not "made from the secret" — made from the data, signed by the secret.
 
### How verification works (the deepest, most important part)
 
The server does **not** store signatures or "remember" tokens. It **recomputes and compares.**
 
- **Signing (at login):** `data + JWT_SECRET → [HMAC-SHA256 math] → signature`. The signature is attached as the token's 3rd part.
- **Verifying (later request):**
  1. Read the data part of the incoming token (the payload is public/base64 — readable by anyone, that's fine).
  2. Run the **same math** with the server's **own** secret → the signature it *expects*.
  3. **Compare** expected vs the signature attached to the token.
     - Match → signed with this same secret → genuine → allow.
     - No match → different secret or tampered data → fake → reject **401**.
**Why a faker can't win:** they don't have the secret, so their math produces a different signature for `{ role: "admin" }`. The math is one-way — you can't work backwards from a signature to the secret. Only the real secret reproduces the right signature for the same data.
 
> The magic isn't that the token "knows" which stamp signed it. It's that **only the real secret reproduces the same signature for the same data.** Same secret + same data = same signature, every time.
 
You don't need HMAC-SHA256's internals — `jwt.verify()` does it all in one line. Knowing it *recomputes-and-compares* is the understanding that matters.
 
### The two functions, two places (ties to the build)
 
| Function | Where it runs | Job |
|---|---|---|
| `jwt.sign(payload, secret, options)` | inside **login** route | mint the token, hand it to the user |
| `jwt.verify(token, secret)` | inside **auth middleware** | check the token on every protected request |
 
JWT is stateless: the server keeps **no list** of logged-in users or issued tokens. Everything it needs is inside the token the client hands back. That's why it scales and why it's the industry default.
 
---
 
## Lesson 21: Controller and Route Layers
 
**Date learned:** 2026-07-01
**Tags:** `mvc` `controller` `route` `express-router` `architecture` `separation-of-concerns`
 
Building the register feature completed the three-layer picture. The **model** (SQL) was already understood; this adds the two layers above it and how a request travels through all three.
 
### The three layers as office roles (recap + extend)
 
| Layer | Role | Its one job | Touches DB? | Touches req/res? |
|---|---|---|---|---|
| **Route** | Receptionist | Match method + path → point to a function | No | No |
| **Controller** | Caseworker / brain | Read the request, decide the steps, make decisions, call the model, write the response | No (asks the model) | **Yes** |
| **Model** | Records clerk | Only SQL — fetch/file records when asked | **Yes** | No |
 
### Why the controller exists (why not cram it into the route)
 
Each layer changes for a **different reason** — that's the whole point:
- Swap Neon for another database → only the **model** changes.
- Change a business rule (e.g. also send a welcome email on register) → only the **controller** changes.
- Rename the URL `/auth/register` → `/signup` → only the **route** changes.
All the "if this, then that" logic (validation, which status code to send) lives in the **controller**. The model makes zero decisions (it just fetches); the route makes zero decisions (it just points). This is **separation of concerns** — CLAUDE.md's *"never write SQL in controllers, never write req/res in models"* rule, and now the *why*.
 
### `express.Router()` — the mini-app
 
- `app.get(...)` directly on `app` was fine for one route, but cramming every route into `app.js` gets messy.
- `express.Router()` = a **mini-app / clipboard** to group related routes (all the `/auth` ones) into their own file, then clip the whole file onto the main app in one line.
- Capital-R `Router` = a tool Express hands you (same idea as `Pool` from `pg`).
```javascript
const router = express.Router();
router.post("/register", register);   // register has NO () — hand over the function, don't call it now
module.exports = router;
```
 
### Mounting: prefix + suffix = full path
 
```
app.use("/auth", authRoutes)    ← prefix:  /auth
router.post("/register", ...)   ← suffix:  /register
                                  ─────────────────
             final address:       POST /auth/register
```
 
The route file only says `/register`, **not** `/auth/register` — the `/auth` part is added by the mounting in `app.js`. (Same mechanism as Lesson 17's `app.use("/admin", ...)`.)
 
### Two directions: build order vs request flow
 
| | Order |
|---|---|
| The order you **build** | db → model → controller → route (**bottom-up**, Lesson 9) |
| The order a request **travels** | route → controller → model → db (**top-down**) |
 
You build the floor before the roof, but a visitor enters through the roof. Both pictures are true.
 
### Vertical slice
 
Register was built as **one feature down through all its layers** (model → controller → route), not "all models, then all controllers." That's a **vertical slice** — you get a working, testable feature sooner instead of three half-finished layers. Industry-preferred.
 
### The layering is near-universal
 
Node: route → controller → model. Spring: controller → service → repository. Laravel (PH market): controller → service → model. Same idea everywhere. It fits **CRUD web apps** (most of the PH junior market) — but it's not a universal law for *all* software (data pipelines, games, ML scripts organize differently).
 
> One line: **the model knows *how* to reach the database, the route knows *which* function to call, and the controller knows *what* should happen.**
 
---
 
## Lesson 22: HTTP Status Codes
 
**Date learned:** 2026-07-01
**Tags:** `http` `status-codes` `rest` `api` `express`
 
Every server reply carries a **3-digit status code** — the server's one-word verdict on the request, sent alongside the data. It's a universal language: every client agrees on the meaning, so it can react to the *number alone* before reading the body.
 
### The one insight: the first digit = the family
 
| First digit | Family | Plain meaning | Whose fault? |
|---|---|---|---|
| **2xx** | Success | "It worked." | ✅ all good |
| **4xx** | Client error | "*You* sent something wrong." | 👈 the caller |
| **5xx** | Server error | "*I* broke on my end." | 👉 the server |
 
(`1xx`/`3xx` exist — skip for now.) The **4xx vs 5xx** split is debugging gold: **4xx = fix your request, 5xx = fix your server.** The first digit tells you which side to look at.
 
### The specific ones (mapped to the register controller)
 
| Code | Name | Means | In the register controller |
|---|---|---|---|
| **200** | OK | Generic success | `/health` sends this |
| **201** | Created | Success **and** something new was made | register succeeded, a user now exists |
| **400** | Bad Request | Caller sent missing/invalid input | `email`/`password`/`role` missing |
| **409** | Conflict | Request clashes with current state | that email is already registered |
| **500** | Internal Server Error | The server itself broke | the `catch` block |
| **401** | Unauthorized | Not logged in / bad token | *coming with JWT middleware — the "student hits admin route → 401" rule* |
 
`201` vs `200`: both are success, but `201` specifically says "I created a new resource." Using it on register (not a generic `200`) is the kind of precision interviewers notice.
 
### Why they're used like that
 
The client **reacts to the number automatically, without reading the message.** The React frontend will branch on it: `201` → go to login; `409` → show "email taken"; `400` → "fill in all fields." The code is a **contract** ("409 always means conflict"), so the frontend can trust it without parsing English error text.
 
> One line: **first digit = family (2 worked, 4 your fault, 5 my fault); the specific number = exactly what happened; the client reacts to the number alone.**
 
---
 
## Lesson 23: Debugging
 
**Date learned:** 2026-07-01
**Tags:** `debugging` `stack-trace` `errors` `middleware` `nodemon` `troubleshooting`
 
Getting register to work meant fighting through a *chain* of errors. Each one taught a reusable debugging move. This lesson is the **methodology**, not just the fixes.
 
### 1. Read the stack trace — find *your* file
 
A stack trace is a list of "who called who," top to bottom. **Most lines are inside `node_modules` — skip them.** Find the first line naming a file *you* wrote (e.g. `authRoutes.js:5:8`). That's the cause; the `node_modules` lines are just where the error *surfaced*.
 
### 2. Shape mismatch — `require` must match `module.exports` (the braces)
 
- `module.exports = { register }` puts the function **in a box**.
- `const { register } = require(...)` **opens the box**, takes it out. ✅
- `const register = require(...)` grabs the **whole box** and mislabels it. ❌ → `register` is the object, not the function.
Destructuring a missing property returns `undefined` **silently** — the crash happens one line *later*.
> **Tell:** `TypeError: argument handler must be a function` on a route = the import is `undefined`/wrong shape → check the braces match on both sides.
 
### 3. Middleware order = execution order
 
`app.use(...)` runs top to bottom. `express.json()` **must be registered before** any route that reads `req.body`. If routes sit above it, the body is still sealed when the route runs.
> **Tell:** `Cannot destructure property 'email' of 'req.body' as it is undefined` = `express.json()` is missing or below the routes — *or* the body isn't tagged as JSON (see #5).
 
### 4. The running process is a snapshot — restart to run new code
 
Node reads your files **once at boot** and runs that copy in memory. Editing files on disk does **not** change the already-running process — you must **restart** to re-read them. That's the whole reason nodemon exists (auto-restart on save). **If a correct fix changes nothing, suspect stale code:**
- Confirm the file is **saved** (a ● dot instead of ✕ = unsaved → Ctrl+S).
- Confirm nodemon printed `restarting due to changes`.
- Force it: type `rs` + Enter in the terminal, or Ctrl+C then `npm run dev`.
- **OneDrive folders can break file-watchers** → manual `rs` is the reliable fallback. (Long term: keep projects out of OneDrive.)
### 5. When you can't see the request, LOG it (the move that cracked it)
 
When fixes to provably-correct code do nothing, **stop guessing — make the server report reality.** Temporary logging middleware, right after `express.json()`:
 
```javascript
app.use((req, res, next) => {
  console.log("→ Content-Type:", req.headers["content-type"]);
  console.log("→ req.body:", req.body);
  next();
});
```
 
This revealed `Content-Type: text/plain` — the *real* bug. `express.json()` **only parses bodies tagged `application/json`**; a `text/plain` body passes through untouched → `req.body` undefined. Root cause: Thunder Client's Body tab was set to **Text**, not **JSON**. Fix: Body → **JSON** (and/or add header `Content-Type: application/json`). **Delete the debug middleware afterward.**
> "Log what's actually arriving" is one of the most powerful debugging tools you have.
 
### The meta-lesson: eliminate suspects one file at a time
 
Every backend file was confirmed correct one by one (routes → controller → app.js → index.js) until the only thing left was the *request itself*. **When the code is provably right, the problem is data, config, or environment — not code.**
 
### Bonus gotchas caught this session
 
- **`bcrypt.hash` is async** → you **must** `await` it, or you store a pending Promise (`"[object Promise]"`) instead of the hash.
- **`process.env.PORT` is case-sensitive** — `.env` has `PORT`, so lowercase `process.env.port` reads `undefined` (it only "worked" by falling back to `3000`).
- **The `pg` SSL warning** (`SSL modes ... treated as aliases for verify-full`) is a harmless **future-change warning**, not an error — it comes from the `pg` library, not your code. Optional fix: change `?sslmode=require` → `?sslmode=verify-full` in `DATABASE_URL`. Fine to ignore for a student project.
> One line: **read the trace to your own file; match `require`/`exports` shapes; order middleware before its routes; restart to run new code; and when stuck, log what's actually arriving.**
 
---
 
## Quick Reference Cheatsheet
 
### Key Terms at a Glance
 
| Term | One-line definition |
|---|---|
| PostgreSQL | Open-source relational database, stricter and more powerful than MySQL |
| Neon.tech | PostgreSQL hosted in the cloud — no installation needed |
| `pg` | JavaScript library (driver) that connects your code to PostgreSQL |
| Pool | A team of reusable database connections — always use over Client |
| `pool.query()` | The function you call to run SQL from JavaScript |
| `result.rows` | Where your query results live — a JS array of objects |
| `$1` placeholder | Safe way to pass user input into SQL — prevents SQL injection |
| npm | App Store for JavaScript libraries |
| `package.json` | Your project's list of all dependencies |
| `node_modules` | Where npm downloads packages to — never push to GitHub |
| `.env` | Hidden file storing secrets like passwords and API keys |
| `dotenv` | Library that reads `.env` into your Node.js code |
| `JWT` | JSON Web Token — a digital "wristband" proving a user is logged in |
| `JWT_SECRET` | Secret key your server uses to sign and verify login tokens |
| `PORT` | Which port your local server runs on — use 3000 |
| `JWT_EXPIRES_IN` | How long a login token stays valid before expiring |
| `express.Router()` | A mini-app for grouping related routes in their own file |
| Controller | The "brain" layer — decides steps, makes decisions, the only layer touching req/res |
| `Content-Type` | Header telling the server the body's format; `express.json()` only parses `application/json` |
 
### HTTP Status Codes at a Glance
 
| Code | Meaning | Family |
|---|---|---|
| 200 OK | Generic success | 2xx ✅ |
| 201 Created | Success + new resource made | 2xx ✅ |
| 400 Bad Request | Missing/invalid input | 4xx (your fault) |
| 401 Unauthorized | Not logged in / bad token | 4xx (your fault) |
| 409 Conflict | Clashes with current state (e.g. duplicate) | 4xx (your fault) |
| 500 Internal Server Error | The server broke | 5xx (server fault) |
 
> First digit = family: **2** worked · **4** your (client's) fault · **5** my (server's) fault.
 
### SQL Syntax Differences: MySQL → PostgreSQL
 
| Feature | MySQL | PostgreSQL |
|---|---|---|
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` |
| String quotes | `"text"` or `'text'` | `'text'` only |
| Identifier quotes | `` `column` `` | `"column"` |
| Show tables | `SHOW TABLES` | `\dt` |
| Current timestamp | `NOW()` | `NOW()` ✅ same |
 
---
 
*Last updated: 2026-07-01 (Lessons 21–23 added: controller/route layers, HTTP status codes, debugging) | Mentor: Claude (Anthropic) | Course context: CMSC 127, UP Tacloban*
 