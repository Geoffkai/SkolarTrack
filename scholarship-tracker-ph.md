# Scholarship Tracker Philippines
### Project 1 — Full Stack CRUD | Career Deployment Pipeline

---

## The Problem

Filipino students miss scholarships constantly — not because they don't qualify, but because:

- Deadlines are scattered across Facebook pages, school bulletin boards, and obscure government websites
- No central platform aggregates CHED, DOST, SM Foundation, Ayala Foundation, and local government scholarships
- Students have no structured way to track their own application status per scholarship
- Schools have no dedicated tool to announce and manage scholarship slots

This is a genuine **information access problem** in the Philippines. Not a tutorial project — a real solution.

---

## Project Goal

Build a full-stack web application where:
- **Admins** (school coordinators) post and manage scholarship listings
- **Students** browse scholarships, save them, and track their application status through a personal pipeline

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | ~75% of PH job ads require React |
| Language | JavaScript (ES6+) | Universal, transfers everywhere |
| Backend | Node.js + Express | ~70% of PH job ads, pairs with React |
| Database | PostgreSQL on Neon.tech | Hosted, free tier — no local install needed |
| Auth | JWT + bcrypt | Industry standard for auth |
| Deploy | Railway (backend) + Vercel (frontend) | Free tier, beginner-friendly |
| Version Control | Git + GitHub | Required in every job posting |

> **Why not Java backend?** Java is already a strength, but the PH market signals point to Node.js for full-stack web roles. Learn it now — your Java knowledge transfers faster than you think.

> **PH-specific note:** Laravel (PHP) appears in ~55% of local job ads. Learn it after the 3 projects — many BPOs and local companies run on it.

---

## User Roles & Access (RBAC)

### Admin
Represents a school coordinator or scholarship-posting organization.

- Post new scholarship listings
- Edit and update existing listings (deadline, slots, status)
- Soft-delete/close expired listings
- View all students who applied per scholarship

### Student
The applicant.

- Browse and search all scholarship listings
- Filter by deadline, amount, course, or open/closed status
- Save scholarships to a personal tracker
- Update their own application status per scholarship
- Remove scholarships from their tracker

---

## CRUD Feature Map

### Admin CRUD

| Operation | Action | Details |
|---|---|---|
| **Create** | Post scholarship | Name, org, deadline, amount, requirements, slots |
| **Read** | View applicants | See all students per scholarship |
| **Update** | Edit listing | Change deadline, slots, requirements, open/closed status |
| **Delete** | Remove listing | Soft delete — marks as expired, not permanently gone |

### Student CRUD

| Operation | Action | Details |
|---|---|---|
| **Create** | Save scholarship | Bookmark to personal tracker list |
| **Read** | Browse & search | Filter by deadline, amount, course, status |
| **Update** | Update app status | Interested → Applied → Interview → Result |
| **Delete** | Remove from tracker | Remove scholarships no longer being pursued |

---

## Database Schema

```sql
-- Users (both roles live here)
users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role          VARCHAR CHECK (role IN ('admin', 'student')),
  name          VARCHAR,
  course        VARCHAR,
  school        VARCHAR,
  created_at    TIMESTAMP DEFAULT NOW()
)

-- Scholarships (admin creates these)
scholarships (
  id          SERIAL PRIMARY KEY,
  posted_by   INTEGER REFERENCES users(id),
  title       VARCHAR NOT NULL,
  organization VARCHAR NOT NULL,
  description TEXT,
  amount      NUMERIC,
  slots       INTEGER,
  requirements TEXT,
  deadline    DATE NOT NULL,
  status      VARCHAR CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Applications (student tracks these)
applications (
  id             SERIAL PRIMARY KEY,
  student_id     INTEGER REFERENCES users(id),
  scholarship_id INTEGER REFERENCES scholarships(id),
  status         VARCHAR CHECK (status IN ('interested','applied','interview','result')),
  notes          TEXT,
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE (student_id, scholarship_id)
)
```

Three tables. Two foreign keys. Clean relational design that's easy to extend later.

---

## Pages to Build

| Route | Role | Purpose |
|---|---|---|
| `/register` | Everyone | Create an account |
| `/login` | Everyone | Authenticate, receive JWT |
| `/scholarships` | Student | Browse all open listings |
| `/scholarships/:id` | Student | View full scholarship details |
| `/my-tracker` | Student | Personal application pipeline |
| `/admin/dashboard` | Admin | Manage posted scholarships |
| `/admin/scholarships/new` | Admin | Create new listing |
| `/admin/scholarships/:id/edit` | Admin | Edit existing listing |

---

## API Routes

```
POST   /auth/register              → create user, return JWT
POST   /auth/login                 → verify credentials, return JWT

GET    /scholarships               → list all scholarships (public)
GET    /scholarships/:id           → get one scholarship (public)
POST   /scholarships               → create scholarship (admin only)
PUT    /scholarships/:id           → update scholarship (admin only)
DELETE /scholarships/:id           → soft delete scholarship (admin only)

GET    /applications               → get logged-in student's applications
POST   /applications               → save/apply to a scholarship (student only)
PUT    /applications/:id           → update application status (student only)
DELETE /applications/:id           → remove from tracker (student only)
```

---

## Constraints

### Technical
- No local PostgreSQL install — use **Neon.tech** (hosted, free tier)
- JWT must be stored in memory or `localStorage` on the frontend
- Admin routes must reject non-admin JWT tokens with `401 Unauthorized`
- Passwords must be hashed with **bcrypt** — never stored in plain text
- Soft delete scholarships — never hard delete, mark as `status: 'closed'` instead

### Scope (what NOT to build in v1)
- No payment or financial integration
- No email notifications (save for v2)
- No file uploads for application documents (save for v2)
- No real-time updates — plain HTTP REST is enough
- No mobile app — responsive web is sufficient

### Error Handling (must implement)
- Invalid credentials → clear error message, no app crash
- Expired/missing JWT → redirect to login
- Student hitting admin route → 401 response
- Empty states → "No scholarships found" message, not a blank screen
- Network failure → user-facing error, not a silent failure

---

## Build Timeline

With **5–6 hours/day** during vacation:

| Days | Phase | What You Build |
|---|---|---|
| Day 1 | Setup | Install Node, PostgreSQL, VS Code extensions, Git init, Neon.tech DB connected |
| Day 2 | Express server | Server running, DB connected, `GET /health` returns `{ status: "ok" }` |
| Day 3 | Auth routes | `POST /auth/register` and `/auth/login` working, tested in Thunder Client |
| Day 4 | JWT middleware | Protected routes working, role check middleware in place |
| Day 5–6 | Scholarship CRUD | All admin scholarship routes built and tested |
| Day 7–8 | Application routes | All student application routes built and tested |
| Day 9 | React setup | Vite + React Router, all 8 pages scaffolded |
| Day 10 | Auth UI | Register and Login forms wired to backend, JWT saved, redirect on success |
| Day 11 | Student pages | Browse scholarships, view detail, personal tracker page |
| Day 12 | Admin pages | Admin dashboard, create and edit scholarship forms |
| Day 13 | Polish | Error states, loading spinners, empty states, edge cases |
| Day 14 | Deploy | Railway (backend) + Vercel (frontend) — live link |

**Target: 2 weeks. One deployed, interview-ready project.**

---

## The Interview Answer

When they ask *"walk me through your project"*:

> "I built a scholarship aggregator for Filipino students because there's no central platform for DOST, CHED, and private scholarship listings. Admins post scholarships with deadlines and slot counts. Students browse, filter by deadline or course, and track their application status through a personal pipeline — from Interested to Applied to Interview to Result. I used JWT with role-based middleware so admin routes are protected — a student token hitting an admin endpoint gets a 401 immediately. The backend runs on Railway, the frontend on Vercel, and the database is hosted PostgreSQL on Neon — no local setup required."

That answer shows: problem-solving, architecture thinking, security awareness, and deployment experience.

---

## What You'll Learn Building This

- Full lifecycle of a web application (frontend → backend → database → deploy)
- JWT authentication and how it actually works
- Role-based access control (RBAC) with middleware
- Relational database design with foreign keys
- REST API design
- React with routing, state management, and API calls
- How to deploy a real app that anyone can use without installing anything

---

## After This Project

This is **Project 1 of 3** in the Career Deployment Pipeline.

| Project | Type | What it adds |
|---|---|---|
| ✅ Project 1 | Full Stack CRUD | Auth, RBAC, PostgreSQL, Deploy |
| Project 2 | AI-Integrated App | AI API, async ops, LLM integration |
| Project 3 | Real-Time Collab | WebSockets, multi-user, CI/CD |

Each project builds on the last. The Warehouse Management System (handling 500+ daily shipments with real-time inventory tracking and role-based access for 3 user types) is the natural target for Project 3.

---

## Background & Context

**Developer profile:**
- Computer Science student, Quezon City, Philippines
- Proficient: Java, SQL queries, HTML, CSS, JavaScript
- Prior projects: games, Dorm Management System (CRUD + SQL, local setup required)
- Goal: 3 portfolio projects → junior full-stack developer role

**Market data (PH, June 2026):**
- Junior full-stack salary range: ₱35,000 – ₱55,000/month
- Most in-demand: React, Node.js, TypeScript, PostgreSQL, Git
- PH-specific demand: Laravel/PHP (~55% of local ads) — learn post-projects

---

*Built during vacation. Started June 2026.*
