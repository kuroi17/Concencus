# Concencus Workspace

Centralized governance app workspace with realtime DM chat.

Current architecture:

- `frontend/`: React + Vite + Tailwind + Supabase + Socket.IO client
- `backend/`: Node.js + Express + Socket.IO + Supabase admin client
- `database/`: SQL migrations (chat schema, RLS, realtime)

## Tech Stack

- React + Vite
- Tailwind CSS
- Node.js + Express
- Socket.IO (backend + client)
- Supabase (auth, database, realtime)

## Prerequisites

- Node.js 20+ and npm
- Git
- Supabase project
- Modern browser

Verify Node/npm:

```bash
node -v
npm -v
```

## Quick Teammate Setup

1. Clone repo and open project folder.
2. Install dependencies for all app parts.
3. Create `frontend/.env` and `backend/.env` from examples.
4. Add Supabase values.
5. Run SQL migrations in Supabase.
6. Start frontend and backend together.

### Install Dependencies

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Manual package install fallback (if needed):

```bash
npm install --prefix frontend @supabase/supabase-js socket.io-client react-router-dom lucide-react
npm install --prefix backend express socket.io cors dotenv @supabase/supabase-js
```

## Environment Files

Copy from examples.

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

Supabase mapping:

- Project URL -> `VITE_SUPABASE_URL`, `SUPABASE_URL`
- anon public key -> `VITE_SUPABASE_ANON_KEY`
- service_role key -> `SUPABASE_SERVICE_ROLE_KEY`

Important:

- `SUPABASE_SERVICE_ROLE_KEY` is backend-only. Never expose it in frontend.

## Supabase SQL Migration Order

Run these files in Supabase SQL Editor:

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
11. `database/migrations/030_create_user_follows.sql`
12. `database/migrations/040_create_forum_tables.sql`
13. `database/migrations/041_forum_rls_policies.sql`
14. `database/migrations/050_create_announcements.sql`
15. `database/migrations/051_announcements_rls_policies.sql`
16. `database/migrations/052_user_profiles_admin_update_policy.sql`

See `database/README.md` for details.

## Admin Management

- Admin users can access the in-app role management screen at `/admin`.
- Announcement posting is visible and allowed for admin users only.
- Non-admin users can still read announcements but cannot create/update/delete them.

Bootstrap note:

- If no admin exists yet, run a one-time SQL update in Supabase SQL Editor to promote your first admin account:

```sql
update public.user_profiles
set campus_role = 'admin'
where id = '<auth_user_id>';
```

## Run The App

Run both frontend and backend:

```bash
npm run dev:all
```

Run separately:

```bash
npm run dev
npm run backend:dev
```

Endpoints:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`

## Useful Commands

```bash
npm run lint
npm run build
npm run preview
npm run backend:start
```

## Full Setup Doc

For complete onboarding instructions and team workflow, see `SETUP.md`.
