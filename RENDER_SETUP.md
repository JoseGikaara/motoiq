# Render setup (backend API)

Use this so your backend deploys with the latest code (including `GET /api/dealers/slug/:slug`) and has the database connected.

## 1. Connect the repo

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. **New** → **Web Service**.
3. Connect your GitHub account and select the **motoiq** repo (or your fork).
4. Use these settings:
   - **Name:** `motoiq-api` (or any name).
   - **Region:** Pick one close to you.
   - **Root Directory:** `server` (important — so Render runs the Node app in `server/`).
   - **Runtime:** Node.
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node index.js`
   - **Instance type:** Free (or paid if you prefer).

## 2. Add database and env vars

### Option A — Supabase (you already use it)

1. In [Supabase](https://supabase.com): Project → **Settings** → **Database**.
2. Copy:
   - **Connection string (URI)** — use “Transaction” / pooler for the app.
   - **Direct connection** (or “Session” / non-pooler) for migrations if needed.
3. In Render: your Web Service → **Environment**.
4. Add:

| Key            | Value |
|----------------|--------|
| `DATABASE_URL` | Supabase **Connection string (URI)** (Transaction mode). Example: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `DIRECT_URL`   | Supabase **Direct connection** URL (port 5432). Example: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` |
| `JWT_SECRET`   | A long random string (e.g. from `openssl rand -base64 32`) |
| `NODE_ENV`     | `production` |
| `CLIENT_URL`   | `https://motoiq.vercel.app` |

Save. Render will redeploy when you add/change env vars.

### Option B — Render Postgres

1. In Render: **New** → **PostgreSQL**.
2. Create the database and copy the **Internal Database URL** (and **External** if you run migrations from your machine).
3. In your Web Service → **Environment**:
   - `DATABASE_URL` = Internal Database URL (or External if you need it).
   - `DIRECT_URL` = same as `DATABASE_URL` (Render Postgres doesn’t need a separate pooler).
   - Add `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` as above.

## 3. Apply schema (first time or after Prisma changes)

If the database is empty or schema changed:

- **From your machine** (with `DATABASE_URL` / `DIRECT_URL` pointing at the DB):
  ```bash
  cd server
  npx prisma db push
  ```
- Or use Render **Shell** (from the Web Service):  
  `cd server && npx prisma db push`

## 4. Why you still see “Cannot GET /api/dealers/slug/host”

That usually means the live app is running **old code** (without the dealers route). Fix it by:

1. **Redeploy:** Render Dashboard → your Web Service → **Manual Deploy** → **Deploy latest commit** (or push a new commit so Render auto-deploys).
2. **Root directory:** In the service settings, **Root Directory** must be `server` so the repo’s `server/routes/dealers.js` is the one that runs.
3. **Branch:** Under “Branch”, use the same branch you push to (e.g. `main`).

After a successful deploy, `https://your-app.onrender.com/api/dealers/slug/host` should return JSON (either the dealer or `{"error":"Dealer not found"}`), not “Cannot GET”.

## 5. Quick check

- Health: `https://your-app.onrender.com/` → `{"status":"MotoIQ API is running"}`.
- Dealers by slug: `https://your-app.onrender.com/api/dealers/slug/demo-showroom` (or any real `websiteSlug` from your DB).
