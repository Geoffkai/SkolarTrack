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

> **Status:** 🚧 In active development. This README documents the intended production architecture; backend and frontend are being built feature-first (schema → server → auth → API → UI → deploy).

---

## ✨ Features

### For Students
- 🔍 **Browse & search** all open scholarships
- 🧮 **Filter** by deadline, amount, course, or open/closed status
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
- 🧯 **Graceful error handling** — clear messages, empty states, no silent failures
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
| **Deploy** | Railway (API) + Vercel (web) | Beginner-friendly free tiers |
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
middleware/      auth (verify JWT) · roles (check req.user.role)
  │
  ▼
controllers/     request/response logic only — no SQL
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

- **Node.js 24 LTS** — verify with `node -v`
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

### 4. Configure & run the frontend

```bash
cd client
npm install
npm run dev                 # vite → http://localhost:5173
```

---

## 🔐 Environment Variables

Create `server/.env` from `server/.env.example`. **Never commit `.env`** — it holds secrets and is git-ignored.

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret for signing JWTs — generate a strong random string | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | Port the API listens on | `3000` |
| `JWT_EXPIRES_IN` | How long a login token stays valid | `7d` |

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
| `POST` | `/auth/register` | Public | Create a user, return a JWT |
| `POST` | `/auth/login` | Public | Verify credentials, return a JWT |

### Scholarships

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/scholarships` | Public | List all scholarships |
| `GET` | `/scholarships/:id` | Public | Get one scholarship |
| `POST` | `/scholarships` | **Admin** | Create a scholarship |
| `PUT` | `/scholarships/:id` | **Admin** | Update a scholarship |
| `DELETE` | `/scholarships/:id` | **Admin** | Soft-delete (`status = 'closed'`) |

### Applications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/applications` | **Student** | Get the logged-in student's applications |
| `POST` | `/applications` | **Student** | Save / apply to a scholarship |
| `PUT` | `/applications/:id` | **Student** | Update application status |
| `DELETE` | `/applications/:id` | **Student** | Remove from tracker |

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
    "password": "secret123",
    "role": "student",
    "name": "Juan Dela Cruz"
  }'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "student@up.edu.ph", "role": "student" }
}
```

---

## 🗂 Project Structure

```
skolartrack/
├── server/                     # Node.js + Express API
│   ├── index.js                # Entry point — the only app.listen()
│   ├── .env.example            # Template for required secrets
│   ├── db/
│   │   └── schema.sql          # CREATE TABLE statements (committed)
│   └── src/
│       ├── app.js              # Express setup: middleware + route mounting
│       ├── config/
│       │   └── db.js           # Single pg Pool, exported
│       ├── routes/             # HTTP verb + path → controller
│       ├── controllers/        # Request/response logic
│       ├── models/             # All SQL queries
│       └── middleware/
│           ├── auth.js         # Verifies JWT
│           └── roles.js        # Checks req.user.role (RBAC)
│
└── client/                     # React + Vite frontend
    └── src/
        ├── main.jsx            # ReactDOM entry point
        ├── App.jsx             # React Router — all routes
        ├── pages/              # One file per route
        ├── components/         # Reusable UI pieces
        └── services/
            └── api.js          # ALL API calls live here
```

### Pages

| Route | Role | Purpose |
|---|---|---|
| `/register` | Everyone | Create an account |
| `/login` | Everyone | Authenticate, receive JWT |
| `/scholarships` | Student | Browse all open listings |
| `/scholarships/:id` | Student | View full scholarship details |
| `/my-tracker` | Student | Personal application pipeline |
| `/admin/dashboard` | Admin | Manage posted scholarships |
| `/admin/scholarships/new` | Admin | Create a new listing |
| `/admin/scholarships/:id/edit` | Admin | Edit an existing listing |

---

## 🛡 Security

- **Passwords** are hashed with **bcrypt** (salted, deliberately slow) — plain-text passwords are never stored.
- **JWTs** are signed with a server-only secret and expire after `JWT_EXPIRES_IN`.
- **RBAC middleware** rejects student tokens on admin routes with `401 Unauthorized`.
- **SQL injection** is prevented via parameterized queries (`$1` placeholders) in every model.
- **Secrets** live only in `.env`, which is git-ignored. A leaked secret is treated as burned and rotated immediately.
- **TLS** is enforced on the database connection (`sslmode=require`).

---

## 🗺 Roadmap

**v1 (current)** — Full-stack CRUD, JWT auth, RBAC, deployed on Railway + Vercel.

Planned for later versions (explicitly **out of scope for v1**):

- 📧 Email notifications for deadlines and status changes
- 📎 File uploads for application documents
- ⚡ Real-time updates (WebSockets)
- 📱 Native mobile app

---

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

Built in the Philippines 🇵🇭 as Project 1 of a 3-project full-stack portfolio.

</div>
