# Concencus Setup Guide

This is the full onboarding guide for teammates who need to catch up with the current implementation.

Current app architecture:

- `frontend/`: React + Vite + Tailwind + Supabase client + Socket.IO client
- `backend/`: Node.js + Express + Socket.IO + Supabase admin client
- `database/`: SQL migrations for chat schema, RLS, and realtime publication

## 1. Prerequisites

Required:

- Node.js 20+ (LTS recommended)
- npm (included with Node.js)
- Git
- Supabase account + project
- Modern browser (Chrome, Edge, Firefox)

Verify Node.js and npm:

```bash
node -v
npm -v
```

## 2. Clone And Install Dependencies

```bash
git clone <your-repo-url>
cd Concencus
```

Install all required packages for workspace, frontend, and backend:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

## 3. Required Packages (Reference)

These are already declared in package files. Teammates usually only need the install commands above.

Frontend key dependencies:

- `@supabase/supabase-js`
- `socket.io-client`
- `react-router-dom`
- `lucide-react`

Backend key dependencies:

- `express`
- `socket.io`
- `cors`
- `dotenv`
- `@supabase/supabase-js`

If anyone needs to reinstall specific packages manually:

```bash
npm install --prefix frontend @supabase/supabase-js socket.io-client react-router-dom lucide-react
npm install --prefix backend express socket.io cors dotenv @supabase/supabase-js
```

## 4. Environment Setup

Create local env files from examples.

PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

Git Bash:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Fill these values:

`frontend/.env`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
VITE_SOCKET_URL=http://localhost:3001
```

`backend/.env`

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Supabase dashboard mapping:

- Project Settings -> API -> Project URL -> `VITE_SUPABASE_URL`, `SUPABASE_URL`
- Project Settings -> API -> anon public key -> `VITE_SUPABASE_ANON_KEY`
- Project Settings -> API -> service_role key -> `SUPABASE_SERVICE_ROLE_KEY`

Security rule:

- Never put `SUPABASE_SERVICE_ROLE_KEY` in `frontend/.env`.

## 5. Supabase SQL Setup (Database + RLS + Realtime)

Open Supabase SQL Editor and run files in this exact order:

1. `database/migrations/001_create_user_profiles.sql`
2. `database/migrations/002_create_dm_conversations.sql`
3. `database/migrations/003_create_dm_messages.sql`
4. `database/migrations/004_create_dm_read_receipts.sql`
5. `database/migrations/010_enable_rls_and_helpers.sql`
6. `database/migrations/011_policies_user_profiles.sql`
7. `database/migrations/012_policies_dm_conversations.sql`
8. `database/migrations/013_policies_dm_messages.sql`
9. `database/migrations/014_policies_dm_read_receipts.sql`
10. `database/migrations/020_enable_realtime_publication.sql`

Reference: `database/README.md`

## 6. Run Frontend + Backend (Socket.IO)

Run both servers together:

```bash
npm run dev:all
```

Or run separately:

```bash
npm run dev
npm run backend:dev
```

Expected local endpoints:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`

## 7. Validation Checklist

1. Login works with Supabase auth.
2. Search profile starts/opens DM conversation.
3. Sending message works in one tab and receives in another account/tab (realtime).
4. Backend health endpoint returns `{ ok: true }`.

Optional checks:

```bash
npm run lint
npm run build
```

## 8. Team Contribution Flow

Rules:

- Do not push directly to main.
- Create your own feature branch.

Example:

```bash
git checkout main
git pull origin main
git checkout -b <task>-<yourName>
```

Before push, sync latest main:

```bash
git checkout main
git pull origin main
git checkout <task>-<yourName>
git merge main
```

Then push:

```bash
git add .
git commit -m "<message>"
git push -u origin <task>-<yourName>
```

Create PR to `main` and request review.
