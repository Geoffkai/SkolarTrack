<div align="center">

# 🎓 SkolarTrack

### A scholarship aggregator and application tracker for Filipino students.

Filipino students miss scholarships they qualify for — not for lack of merit, but because deadlines are scattered across Facebook pages, school bulletins, and government sites with no central place to track them. **SkolarTrack** brings CHED, DOST, SM Foundation, Ayala Foundation, and local government scholarships into one searchable platform, and gives every student a personal pipeline to track each application from *Interested* to *Result*.

[![Node.js](https://img.shields.io/badge/Node.js-24_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT_+_bcrypt-FB015B?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Roadmap](#-roadmap)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🔎 Overview

SkolarTrack is a full-stack web application with two roles:

- **Admins** (school coordinators / scholarship-posting organizations) post and manage scholarship listings — title, organization, deadline, slots, amount, and requirements.
- **Students** browse and search listings, save the ones they want, and track their application status through a personal pipeline.

The application status pipeline:

```
Interested  →  Applied  →  Interview  →  Result
```

> **Status:** ✅ v1 feature-complete. Every route and page in the spec is built and covered by an automated test suite. Hosting: API on Render, web on Vercel, database on Neon.

---

## ✨ Features

### For Students
- 🔍 **Browse & search** all open scholarships (search also matches descriptions and requirements, so a course name finds its scholarships)
- 🧮 **Filter & sort** by deadline (closing soon), minimum amount, and open/closed status
- 🔖 **Save** scholarships to a personal tracker
- 📊 **Track application status** through a 4-stage pipeline
- 🗑️ **Remove** scholarships no longer being pursued

### For Admins
- ➕ **Post** new scholarship listings
- ✏️ **Edit** existing listings (deadline, slots, requirements, status)
- 🚫 **Soft-close** expired listings (never hard-deleted)
- 👥 **View applicants** per scholarship

### Platform
- 🔐 **JWT authentication** with bcrypt-hashed passwords
- 🛡️ **Role-based access control** — student tokens hitting admin routes get a `401`
- 🔒 **Ownership checks** — an admin can only edit, close, or view applicants for listings they posted
- 🧯 **Graceful error handling** — clear messages, empty states, no silent failures; an expired session sends you back to log in
- 📱 **Responsive web UI**

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React + Vite | Dominant in the PH job market; fast dev server |
| **Language** | JavaScript (ES6+) | Universal, transfers across the stack |
| **Backend** | Node.js + Express | Pairs naturally with React; widely demanded |
| **Database** | PostgreSQL 17 (Neon.tech) | Hosted, serverless, free tier — no local install |
| **Auth** | JWT + bcrypt | Industry-standard authentication |
| **Deploy** | Render (API) + Vercel (web) | Genuinely free tiers, no credit card |
| **Testing** | Node's built-in test runner, supertest, PGlite | Real SQL against an in-memory Postgres — no test database to host |
| **Tooling** | Git + GitHub, Thunder Client, ESLint | Standard professional workflow |

---

## 🏗 Architecture

The backend follows a strict **MVC separation of concerns** — every request flows through the same layers and each layer has exactly one job.

```
Request
  │
  ▼
routes/          maps HTTP verb + path  →  delegates to a controller
  │
  ▼
middleware/      auth (verify JWT) · roles (check req.user.role) · rate limit · id check
  │
  ▼
controllers/     request/response logic only — no SQL
  │                (input checks live in utils/validation.js: pure functions, no req/res)
  │
  ▼
models/          all SQL queries live here — nothing else
  │
  ▼
PostgreSQL (Neon)
```

**Hard rules enforced throughout the codebase:**

- `routes/` only maps paths → `controllers/` handle req/res → `models/` run SQL. **Never write SQL in a controller.**
- A single `pg` connection **Pool** is created once in `config/db.js` and imported everywhere.
- Environment variables are read and validated in **one** place, `config/env.js`. A missing variable stops the server at boot with a clear message.
- **Ownership is enforced in SQL** (`WHERE id = $1 AND posted_by = $2`), never by trusting an id from the request body.
- `server/index.js` is the **only** file that calls `app.listen()`. `app.js` builds the app and exports it.
- All frontend API calls go through `client/src/services/api.js` — **never** inline `fetch()` in components.
- Scholarships are **soft-deleted** (`status = 'closed'`) — never `DELETE FROM`.

---

## 🗄 Database Schema

Three tables, two foreign keys, normalized to 3NF.

```sql
-- Users (both roles live here)
users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role          VARCHAR CHECK (role IN ('admin', 'student')) NOT NULL,
  name          VARCHAR,
  course        VARCHAR,
  school        VARCHAR,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Scholarships (admins create these)
scholarships (
  id           SERIAL PRIMARY KEY,
  posted_by    INTEGER NOT NULL REFERENCES users(id),
  title        VARCHAR NOT NULL,
  organization VARCHAR NOT NULL,
  description  TEXT,
  amount       NUMERIC,
  slots        INTEGER,
  requirements TEXT,
  deadline     DATE NOT NULL,
  status       VARCHAR CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Applications (students track these)
applications (
  id             SERIAL PRIMARY KEY,
  student_id     INTEGER NOT NULL REFERENCES users(id),
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id),
  status         VARCHAR CHECK (status IN ('interested','applied','interview','result')),
  notes          TEXT,
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, scholarship_id)
);
```

> The canonical schema lives in [`server/db/schema.sql`](server/db/schema.sql) and is committed to the repo — a lightweight form of migrations that can rebuild the database from scratch.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 22 or newer** (24 LTS recommended) — verify with `node -v`
- A free **[Neon.tech](https://neon.tech)** PostgreSQL database (PostgreSQL 17)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/skolartrack.git
cd skolartrack
```

### 2. Set up the database

Open the Neon SQL Editor and run the contents of [`server/db/schema.sql`](server/db/schema.sql) to create the three tables. Copy your connection string from the Neon dashboard.

### 3. Configure & run the backend

```bash
cd server
cp .env.example .env        # then fill in real values (see below)
npm install
npm run dev                 # nodemon → http://localhost:3000
```

Verify the wiring is live:

```bash
curl http://localhost:3000/health
# → { "status": "ok", "db": "connected" }
```

### 4. Create an admin account

Public sign-up always creates a **student**. Admin accounts are created from the command line, by someone who holds the database credentials:

```bash
cd server
npm run create-admin -- coordinator@school.edu.ph "a-strong-password" "Coordinator Name"
```

### 5. Configure & run the frontend

```bash
cd client
npm install
npm run dev                 # vite → http://localhost:5173
```

The frontend talks to `http://localhost:3000` in development and to the hosted API in a production build. To point it somewhere else, copy `client/.env.example` to `client/.env.local` and set `VITE_API_URL`.

### 6. Run the checks

```bash
cd server && npm test       # API tests against an in-memory Postgres — never touches Neon
cd client && npm test       # unit tests for the date, filter, format and token helpers
cd client && npm run lint
cd client && npm run build
```

---

## 🔐 Environment Variables

Create `server/.env` from `server/.env.example`. **Never commit `.env`** — it holds secrets and is git-ignored.

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret for signing JWTs — generate a strong random string | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API | `http://localhost:5173,https://skolar-track.vercel.app` |
| `PORT` | Port the API listens on | `3000` |
| `JWT_EXPIRES_IN` | How long a login token stays valid | `7d` |
| `AUTH_RATE_LIMIT_MAX` | *(optional)* Failed logins / sign-ups allowed per IP every 15 minutes | `30` |
| `TRUST_PROXY` | *(optional)* Number of reverse proxies in front of the server | `1` |

`DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGINS` are required — the server refuses to start without them. In production `JWT_SECRET` must be at least 32 characters.

> 💡 Generate a `JWT_SECRET` with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 📡 API Reference

Base URL (local): `http://localhost:3000`

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a student account, return the user (log in next to get a token) |
| `POST` | `/auth/login` | Public | Verify credentials, return a JWT |

Both are rate limited per IP address.

### Scholarships

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/scholarships` | Public | List all scholarships |
| `GET` | `/scholarships/:id` | Public | Get one scholarship |
| `GET` | `/scholarships/mine` | **Admin** | The caller's own listings, each with an applicant count |
| `GET` | `/scholarships/:id/applications` | **Admin (owner)** | Students who saved this listing |
| `POST` | `/scholarships` | **Admin** | Create a scholarship |
| `PUT` | `/scholarships/:id` | **Admin (owner)** | Replace a scholarship (full body, including `status`) |
| `DELETE` | `/scholarships/:id` | **Admin (owner)** | Soft-delete (`status = 'closed'`) |

### Applications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/applications` | **Student** | Get the logged-in student's applications |
| `POST` | `/applications` | **Student** | Save / apply to a scholarship |
| `PUT` | `/applications/:id` | **Student (owner)** | Update application status and notes |
| `DELETE` | `/applications/:id` | **Student (owner)** | Remove from tracker |

### Other

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | `{ "status": "ok", "db": "connected" }` when the API can reach the database |

### Errors

Every error is JSON in one shape — `{ "error": "what went wrong" }` — so the frontend can always show it.

| Status | Meaning |
|---|---|
| `400` | The request failed validation (the message names the field), or an id isn't a number |
| `401` | No token, an invalid or expired token, or a token for the wrong role |
| `404` | It doesn't exist — **or** it exists but isn't yours (deliberately indistinguishable) |
| `409` | Conflict: email already registered, scholarship already saved, or scholarship closed |
| `413` | Request body larger than 50 KB |
| `429` | Too many login or sign-up attempts — try again in a few minutes |

### Authentication header

Protected routes expect the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

### Example: register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@up.edu.ph",
    "password": "at-least-8-characters",
    "name": "Juan Dela Cruz",
    "course": "BS Computer Science",
    "school": "UP Diliman"
  }'
```

```json
{
  "user": {
    "id": 1,
    "email": "student@up.edu.ph",
    "role": "student",
    "name": "Juan Dela Cruz",
    "course": "BS Computer Science",
    "school": "UP Diliman",
    "created_at": "2026-10-08T03:00:00.000Z"
  }
}
```

A `role` sent in the body is ignored — the server always assigns `student`. Registering does not log you in; call `POST /auth/login` with the same credentials to receive `{ "token": "..." }`.

---

## 🗂 Project Structure

```
skolartrack/
├── server/                     # Node.js + Express API
│   ├── index.js                # Entry point — the only app.listen()
│   ├── .env.example            # Template for required secrets
│   ├── db/
│   │   └── schema.sql          # CREATE TABLE statements (committed)
│   ├── scripts/
│   │   └── createAdmin.js      # The only way to create an admin account
│   ├── test/                   # API tests (node --test + supertest + PGlite)
│   └── src/
│       ├── app.js              # Express setup: middleware + route mounting
│       ├── config/
│       │   ├── env.js          # Reads + validates environment variables, once
│       │   └── db.js           # Single pg Pool, exported
│       ├── routes/             # HTTP verb + path → controller
│       ├── controllers/        # Request/response logic
│       ├── models/             # All SQL queries
│       ├── utils/
│       │   └── validation.js   # Pure input checks shared by the controllers
│       └── middleware/
│           ├── auth.js         # Verifies JWT
│           ├── roles.js        # Checks req.user.role (RBAC)
│           ├── rateLimit.js    # Slows down password guessing and mass sign-ups
│           ├── validateId.js   # Rejects non-numeric :id before it reaches SQL
│           └── errorHandler.js # JSON 404 + last-resort error handler
│
└── client/                     # React + Vite frontend
    ├── vercel.json             # SPA rewrite + security headers for Vercel
    ├── test/                   # Unit tests for the pure helpers
    └── src/
        ├── main.jsx            # ReactDOM entry point
        ├── App.jsx             # React Router — all routes
        ├── pages/              # One file per route
        ├── components/         # Reusable UI pieces
        ├── context/            # AuthProvider + useAuth (who is logged in)
        ├── hooks/
        │   └── useApi.js       # Load-on-mount with loading / error / retry
        ├── utils/              # Dates, peso formatting, filters, pipeline stages
        └── services/
            ├── api.js          # ALL API calls live here
            └── auth.js         # Token storage + decoding (for display only)
```

### Pages

| Route | Role | Purpose |
|---|---|---|
| `/register` | Everyone | Create an account |
| `/login` | Everyone | Authenticate, receive JWT |
| `/scholarships` | Everyone | Browse listings (open ones only when logged out) |
| `/scholarships/:id` | Everyone | Full details; students save it to their tracker from here |
| `/my-tracker` | Student | Personal application pipeline |
| `/admin/dashboard` | Admin | Manage posted scholarships |
| `/admin/scholarships/new` | Admin | Create a new listing |
| `/admin/scholarships/:id/edit` | Admin | Edit an existing listing |
| `/admin/scholarships/:id/applicants` | Admin | Students who saved a listing, filterable by stage |

---

## 🛡 Security

- **Passwords** are hashed with **bcrypt** (salted, deliberately slow) — plain-text passwords are never stored. New passwords must be 8–72 characters.
- **JWTs** are signed with a server-only secret, pinned to HS256, and expire after `JWT_EXPIRES_IN`.
- **RBAC middleware** rejects student tokens on admin routes with `401 Unauthorized`. Nobody can self-register as an admin: the role is never read from a request.
- **Ownership** is checked in the SQL itself. One admin cannot edit, close, or read the applicants of another admin's listing; one student cannot touch another's tracker. A student's private notes are never sent to admins.
- **Input validation** runs on every write: types, lengths, real calendar dates, non-negative amounts. Bad input gets a `400`, not a database error.
- **SQL injection** is prevented via parameterized queries (`$1` placeholders) in every model.
- **Brute-force protection** — login and sign-up are rate limited per IP, and a failed login takes the same time whether or not the email exists.
- **Security headers** on the API (helmet) and on the frontend (`client/vercel.json`: a Content-Security-Policy, no framing, no MIME sniffing).
- **CORS** is an explicit allowlist read from `CORS_ORIGINS` — never `*`.
- **Errors never leak internals**: a `500` returns a generic message; the detail goes to the server log.
- **Secrets** live only in `.env`, which is git-ignored. A leaked secret is treated as burned and rotated immediately.
- **TLS** is enforced on the database connection.

Known trade-off: the JWT lives in `localStorage` (as the spec asks), which any script running on the page could read. The Content-Security-Policy is the mitigation — it blocks scripts from anywhere but this site. Moving to an `httpOnly` cookie is the stronger fix and is on the roadmap.

---

## 🗺 Roadmap

**v1 (current)** — Full-stack CRUD, JWT auth, RBAC, deployed on Render + Vercel.

Planned for later versions (explicitly **out of scope for v1**):

- 📧 Email notifications for deadlines and status changes
- 📎 File uploads for application documents
- ⚡ Real-time updates (WebSockets)
- 📱 Native mobile app
- 🍪 Session in an `httpOnly` cookie instead of `localStorage`
- ✉️ Email verification and password reset

---

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

Built in the Philippines 🇵🇭 as Project 1 of a 3-project full-stack portfolio.

</div>
