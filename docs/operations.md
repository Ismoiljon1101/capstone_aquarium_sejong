# Fishlinic Operations Guide

_Last updated: 2026-04-17_

## Dynamic scheduler (`CronService` — 60s tick)

The backend runs a single 60-second scheduler loop in
`services/backend/src/modules/cron/cron.service.ts`. On every tick:

1. **Feed schedules** — iterates all enabled rows in `/management/feed-schedules`.
   If `time` matches current HH:MM and today is in the day mask, it calls
   `actuators.triggerFeed(portionSeconds)`.
2. **Light schedule** — reads the single row from `/management/light-schedule`.
   Compares current time to the configured on/off window (supports overnight
   ranges where off-time < on-time). Toggles LED relay only on state change.
3. **Emergency thresholds** — reads latest sensor values, compares to
   `tankConfig.emergencyThresholds` (pH min/max, temp min/max, DO min). Creates
   a CRITICAL alert via `alerts.createAlert()` if any reading is outside bounds.
   Alert is emitted on the `alert:new` socket event.
4. **Cleaning reminder** — compares `tankConfig.lastCleanedAt` to
   `tankConfig.cleaningIntervalDays`. If overdue, creates a WARNING alert.

There are **no separate cron jobs** — everything time-based runs through the
same tick. This keeps scheduling predictable and easy to test.

## Sensor simulator

Running separately, `services/backend/src/modules/sensors/sensor.simulator.ts`
pushes a synthetic pH / temp / DO / CO2 reading every 8 seconds whenever
`SIMULATE_SENSORS != false`. It simulates realistic drift + occasional
out-of-bounds spikes to exercise the alert pipeline.

**To disable when real hardware is connected**: set `SIMULATE_SENSORS=false`
in `services/backend/.env`. The serial bridge will then be the only source
of `/serial/reading` POSTs.

---

## Database

### Development (default)

TypeORM with `better-sqlite3`. File at `services/backend/fishlinic.sqlite`.
`synchronize: true` keeps the schema up to date automatically — fine for
dev but **must be replaced with migrations before production** (Maral's task).

### Production (Supabase)

To move from local SQLite to Supabase Postgres:

1. Create a Supabase project (see [`supabase-setup.md`](supabase-setup.md)).
2. Set `DATABASE_URL` in `services/backend/.env.production`:
   ```
   DATABASE_URL=postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres?sslmode=require
   ```
3. Ensure SSL is enabled in the TypeORM config
   (`services/backend/src/modules/database/database.module.ts`).
4. Run migrations once they exist:
   ```
   pnpm --filter @fishlinic/backend migration:run
   ```
   (Migrations are currently **not yet written** — see `docs/team-ownership.md`
   § Maral task 1.)

---

## Health & readiness

Currently **not implemented** — see `docs/team-ownership.md` § Sarvar task 3.

Planned:
- `GET /health` → 200 if the process is up
- `GET /ready` → 200 only if DB is reachable **and** required models are loaded

All three services (backend, ai-predictor, serial-bridge) will expose both.

---

## Logs

- Backend: stdout (NestJS default logger). Pipe to a file in production.
- AI predictor: uvicorn access + app logs on stdout.
- Serial bridge: stdout; logs every raw serial frame and every POST to backend.

No centralized log shipping yet. Add later if needed.
