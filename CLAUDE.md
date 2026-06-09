# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SkolarTrack — a full-stack scholarship tracker for Filipino students. Admins (school coordinators) post scholarship listings; students browse, save, and track their application status through a personal pipeline (Interested → Applied → Interview → Result).

## Tech Stack

- **Frontend**: React + Vite (`client/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: PostgreSQL on Neon.tech (hosted, no local install)
- **Auth**: JWT + bcrypt, role-based access control (RBAC)
- **Deploy**: Railway (backend) + Vercel (frontend)

## Development Commands

These are not yet configured — `package.json` files don't exist yet. Once set up, they will be:

```bash
# Server
cd server && npm run dev     # nodemon server/index.js
cd server && npm start       # node server/index.js

# Client
cd client && npm run dev     # vite
cd client && npm run build   # vite build
```

No test runner is configured yet.

## Architecture

### Backend (MVC)

```
server/
  index.js          ← Entry point only — calls app.listen()
  src/
    app.js          ← Express setup: middleware, route mounting (no listen here)
    routes/         ← HTTP verb + path mapping only, delegates to controllers
    controllers/    ← Request/response logic, calls models
    models/         ← All SQL queries live here, nothing else
    middleware/     ← Reusable auth and role-check functions
```

**Pattern**: `routes/` only maps paths → `controllers/` handles req/res → `models/` runs SQL. Never write SQL in controllers. Never write req/res logic in models.

### Frontend

```
client/src/
  App.jsx           ← React Router setup, all routes defined here
  main.jsx          ← ReactDOM.render entry point
  pages/            ← One file per route (Login, Register, Scholarships, etc.)
  components/       ← Reusable UI pieces
  services/api.js   ← ALL API calls go here — never inline fetch() in components
```

### Auth Flow

- JWT issued on login/register, stored in `localStorage` on the client
- Every protected request sends `Authorization: Bearer <token>`
- `middleware/auth.js` verifies the token
- `middleware/roles.js` checks `req.user.role` — admin routes reject student tokens with 401

### Database (3 tables)

- `users` — both roles, `role` column is `'admin'` or `'student'`
- `scholarships` — created by admins, soft-deleted by setting `status: 'closed'` (never hard delete)
- `applications` — student's tracker entries, `status` is `'interested'|'applied'|'interview'|'result'`

## Environment Variables

Copy `server/.env.example` → `server/.env` and fill in real values. Required vars:

- `DATABASE_URL` — Neon.tech connection string
- `JWT_SECRET` — any strong random string
- `PORT` — defaults to 3000
- `JWT_EXPIRES_IN` — defaults to `7d`

## Key Constraints

- Soft delete only — never `DELETE FROM scholarships`. Set `status = 'closed'`.
- All API calls go through `client/src/services/api.js`, not inline in components.
- `server/index.js` is the only file that calls `app.listen()`.
- Admin routes must return `401` for non-admin JWT tokens.
- Passwords must be hashed with bcrypt — never stored plain.
