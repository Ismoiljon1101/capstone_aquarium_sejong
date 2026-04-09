# Fishlinic Operations Guide

## Cron Schedule (`CronService`)

The backend performs several automated maintenance tasks:

1. **Sensor Cleanup**: Daily at 00:00 - Archives readings older than 30 days.
2. **Fish Health Report**: Every 6 hours - Aggregates YOLO/Behavior data into a health score.
3. **Alert Reset**: Every hour - Auto-resolves alerts that haven't triggered in 60 minutes.
4. **Backup**: Weekly (Sunday 03:00) - Backs up the SQLite database to `backups/`.

---

## Supabase Integration

To move from local SQLite to Production (Supabase):

1. **DATABASE_URL**: Update in `.env` with the connection string from Supabase Project Settings.
2. **Migrations**: 
   - `pnpm prisma migrate deploy` (or TypeORM equivalent).
3. **SSL**: Ensure the connection string includes `?sslmode=require`.
