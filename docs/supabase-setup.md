# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name: `fishlinic`
4. Database Password: generate a strong password and save it
5. Region: choose closest to your deployment

## 2. Get Connection String

1. Go to **Project Settings** > **Database**
2. Under **Connection string**, select **URI**
3. Copy the connection string — it looks like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Replace `[password]` with your database password

## 3. Configure Backend .env

In `services/backend/.env`:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # from Project Settings > API > anon public
```

Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from **Project Settings** > **API**.

## 4. Run Migrations

From the repo root:

```bash
cd services/backend
pnpm run migration:run
```

Or if using TypeORM CLI directly:

```bash
npx typeorm migration:run -d src/modules/database/database.module.ts
```

## 5. Verify Connection

```bash
cd services/backend
pnpm dev
```

Check logs for: `Database connection established` or similar TypeORM success message.

## 6. Supabase Dashboard

- **Table Editor**: view/edit data at `https://supabase.com/dashboard/project/[ref]/editor`
- **SQL Editor**: run raw queries at `https://supabase.com/dashboard/project/[ref]/sql`
- **Logs**: monitor connections at `https://supabase.com/dashboard/project/[ref]/logs`

## 7. Environment Variables Summary

| Variable | Where to find | Used by |
|----------|--------------|---------|
| `DATABASE_URL` | Settings > Database > URI | Backend (TypeORM) |
| `SUPABASE_URL` | Settings > API | Backend |
| `SUPABASE_ANON_KEY` | Settings > API > anon public | Backend |
