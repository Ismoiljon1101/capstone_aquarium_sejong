# Team Ownership & Current Sprint

_Last updated: 2026-04-17 · HEAD: `d57a4dc` · Branch to pull: `develop`_

## Setup (everyone)

```bash
git checkout develop
git pull origin develop
pnpm install                  # from repo root
```

**DO NOT** touch `apps/mobile/package.json` versions — pinned stable set is
expo~54 + RN 0.81.5 + react 19.1.0. Upgrading breaks the web build with a
white screen. See `_versionNote` field in that file.

---

## Roles

| Person   | Role                         | Primary folders                                                                  |
|----------|------------------------------|----------------------------------------------------------------------------------|
| Ismail   | Lead Architect / Backend / Mobile | `services/backend/`, `apps/mobile/`, `shared/types/`, `docs/`               |
| Maral    | Database Specialist          | `services/backend/src/modules/database/`, `migrations/`, Supabase                |
| Hamidullah | Frontend / UI / Dashboard  | `apps/dashboard/`, atoms/molecules/organisms, mobile UI styling                  |
| Firdavs  | AI Engineer                  | `services/ai-predictor/`, ML models in `resources/models/`, Veronica LLM core    |
| Sarvar   | Hardware Engineer            | `firmware/main/`, `firmware/secondary/`, `services/serial-bridge/`               |

Ports: backend **3000**, serial-bridge **3001**, dashboard **3002**,
ai-predictor **8001**, mobile **8081**.

Socket events: `sensor:update`, `alert:new`, `fish:count`, `health:report`,
`actuator:state`.

---

## Current system state

| Area                              | Status          | Notes |
|-----------------------------------|-----------------|-------|
| NestJS backend (`:3000`)          | ✅ working      | sensors, alerts, actuators, voice, vision, management, cron |
| AI predictor (`:8001`)            | ✅ working      | RF quality, YOLO disease/count, ConvLSTM-VAE loaded |
| Serial bridge (`:3001`)           | ⚠️ mock mode   | falls back when no Arduino plugged in — **real hardware not wired** |
| Mobile (`:8081`)                  | ✅ working      | Dashboard, Controls+Management, Fish AI (Veronica), Settings, Alerts |
| Dashboard (`:3002`)               | ⚠️ partial     | camera / growth / alerts pages need wiring to new endpoints |
| Sensor simulator                  | ✅ running      | fake pH/temp/DO/CO2 every 8s when `SIMULATE_SENSORS != false` |
| Dynamic scheduler                 | ✅ running      | 60s tick: feed schedules, light cycle, emergency thresholds, cleaning reminder |
| Tank management (BE + mobile UI)  | ✅ done         | feed schedules, light schedule, tank config, cleaning tracker |
| Trained ML models                 | ✅ loaded       | `resources/models/` — rf_quality.pkl, yolo_disease.pt, yolo_count.pt, convlstm_vae.pth |
| DB migrations                     | ❌ missing     | backend uses `synchronize: true`; no migration files exist |
| Push notifications                | ❌ not started | `pushToken` field exists on entity; registration + sender pending |
| Hardware integration end-to-end   | ❌ not done    | fake data flowing — real tank never connected |

**Big picture**: software stack works in simulation. Next milestone =
replace simulator with real Arduino via serial-bridge, wire DB to Supabase,
ship push notifications, finish dashboard parity.

---

## Sarvar — Hardware Bridge & Backend Infra

**Branch**: `feat/sarvar-hardware`
**Goal**: real Arduino plugged in → readings land on mobile Dashboard.

| # | Task                                                                 | Files                                                                                      | Done when                                             |
|---|----------------------------------------------------------------------|--------------------------------------------------------------------------------------------|-------------------------------------------------------|
| 1 | Wire secondary Arduino (firmware exists but bridge ignores it)       | `services/serial-bridge/src/`, `firmware/secondary/secondary.ino`                          | secondary sensors ingest into backend                 |
| 2 | CRC / checksum on serial packets                                     | `services/serial-bridge/src/parser.ts`, `firmware/main/main.ino`                           | corrupt packet rejected, logged                       |
| 3 | Health / ready endpoints on all services                             | `services/backend`, `services/ai-predictor`, `services/serial-bridge`                      | `/health` returns 200, `/ready` checks DB + model load |
| 4 | Multi-tank support — parameterize hardcoded `sensorId: 1` / `tankId: 1` | `services/backend/src/modules/sensors`, `alerts`, `management`                          | second tank config can be added via API               |
| 5 | Flip `SIMULATE_SENSORS=false`, verify end-to-end with real tank      | `.env`, live serial test                                                                   | real pH/temp reading on mobile Dashboard              |

**Deliverable**: physical tank readings visible on mobile Dashboard.

---

## Maral — Database & Dashboard

**Branch**: `feat/maral-db-dashboard`
**Goal**: production-ready DB + professor-ready web dashboard with feature
parity with mobile.

### Database (priority first)

| # | Task                                                                      | Files                                                                                      | Done when                                         |
|---|---------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|---------------------------------------------------|
| 1 | Replace TypeORM `synchronize: true` with proper migrations                | `services/backend/src/modules/database/database.module.ts`, `migrations/` (new folder)     | `pnpm migration:run` applies schema on fresh PG   |
| 2 | Supabase production setup — `DATABASE_URL` in `.env.production`, SSL      | `services/backend/src/modules/database/database.module.ts`                                 | backend connects to Supabase, persists on restart |
| 3 | Verify all entities registered — `FishGrowth`, all management entities    | `services/backend/src/modules/database/database.config.ts`                                 | no `EntityMetadataNotFoundError` on startup       |
| 4 | Seed script for default tank config + light schedule (singleton id=1)     | `services/backend/src/modules/database/seed.ts` (new)                                      | fresh DB has sane defaults, no null crashes       |

### Dashboard

| # | Task                                                                      | Files                                                                        | Done when                                         |
|---|---------------------------------------------------------------------------|------------------------------------------------------------------------------|---------------------------------------------------|
| 5 | Camera snapshot + YOLO bounding boxes on fish-health page                 | `apps/dashboard/app/dashboard/fish-health/`, backend `modules/vision`        | latest frame + boxes render                       |
| 6 | Growth tracking chart (fish count over time)                              | `apps/dashboard/app/dashboard/fish-health/`                                  | line chart from `/fish/count` history             |
| 7 | Alerts page — ack / resolve from web (`PATCH /alerts/:id/acknowledge`)    | `apps/dashboard/app/dashboard/alerts/`                                       | button marks alert resolved                       |
| 8 | Wire dashboard settings → `/management/*` (schedules + thresholds)        | `apps/dashboard/app/settings/`                                               | web CRUD matches mobile Controls screen           |

**Deliverable**: Supabase connected, migrations scripted, dashboard has
feature parity with mobile.

---

## Firdavs — AI Predictor & ML Models

**Branch**: `feat/firdavs-ai`
**Goal**: robust, accurate AI inference — all models load, GPU-aware,
results visible in UI.

| # | Task                                                                                        | Files                                                                                                 | Done when                                                     |
|---|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| 1 | GPU detection + CPU fallback in predictor                                                   | `services/ai-predictor/src/main.py`, `routes/*.py`                                                    | service logs `device: cuda` or `device: cpu` on start         |
| 2 | Graceful missing-model handling — service starts even if a `.pt` / `.pkl` absent            | `services/ai-predictor/src/routes/predict_quality.py`, `predict_disease.py`, `predict_count.py`        | 503 returned cleanly, no crash                                |
| 3 | Model readiness endpoint `/ready` — returns which models loaded                             | `services/ai-predictor/src/main.py`                                                                    | Settings screen AI Predictor badge shows per-model status     |
| 4 | Disease detection: `/vision/detect-disease` → camera snapshot → annotated bounding boxes    | `services/backend/src/modules/vision/vision.service.ts`, `services/ai-predictor/src/routes/predict_disease.py` | YOLO boxes returned as JSON `[{label, confidence, bbox}]` |
| 5 | ConvLSTM-VAE anomaly detection: `/predict/anomaly` route over 10-reading window             | `services/ai-predictor/src/routes/predict_anomaly.py` (new), backend `voice.service.ts` prompt        | anomaly score included in Veronica's context                  |

**Deliverable**: all 4 models load reliably, disease boxes display on
dashboard, anomaly score fed to Veronica.

---

## Ismail — Mobile Push Notifications

**Branch**: `feat/ismail-push`
**Goal**: critical alerts wake the phone.

| # | Task                                                                       | Files                                                                                          | Done when                                          |
|---|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|----------------------------------------------------|
| 1 | Expo push token registration on app start                                  | `apps/mobile/App.tsx`, `src/hooks/usePushToken.ts` (new)                                       | token saved via `PATCH /management/tank-config`    |
| 2 | Backend push sender when scheduler creates CRITICAL alert                  | `services/backend/src/modules/alerts/push.service.ts` (new)                                    | phone buzzes on emergency threshold breach         |
| 3 | Deep linking — notification tap → Alerts screen                            | `apps/mobile/src/navigation/AppNavigator.tsx`, `AlertsScreen.tsx`                               | tap opens the correct alert                        |

---

## Hamidullah — Frontend polish

**Branch**: `feat/hamidullah-ui`
**Goal**: atomic design enforcement + shared UI kit across mobile + dashboard.

| # | Task                                                                       | Files                                                           | Done when                                           |
|---|----------------------------------------------------------------------------|-----------------------------------------------------------------|-----------------------------------------------------|
| 1 | Extract repeated card/badge/gauge patterns into `components/atoms`         | `apps/dashboard/src/components/`, `apps/mobile/src/components/` | no duplicated style blocks across screens           |
| 2 | Dark theme tokens shared — bg `#020617`, card `#0f172a`                    | `apps/dashboard/src/styles/`, `apps/mobile/src/theme/`          | single source of color tokens                       |
| 3 | Mobile screen files < 300 lines each (split into organisms)                | `apps/mobile/src/screens/`                                      | every `*.tsx` under 300 lines                       |

---

## Integration order

1. **Sarvar first** — hardware bridge unlocks real data for everyone.
2. **Maral + Firdavs parallel** — both consume backend APIs, no overlap.
3. **Ismail + Hamidullah** — mobile push + UI polish land last.
4. Merge all → `develop` → demo on real tank.

## Rules

- Branch per task; PR into `develop`. No direct pushes to `develop`.
- Before committing: `pnpm install` from root, verify mobile loads at
  `localhost:8081`, backend at `localhost:3000`.
- **Never upgrade mobile package versions** — expo~54 + RN 0.81.5 +
  react 19.1.0 is locked.
- Atomic Design on mobile / dashboard: atoms → molecules → organisms → screens.
- Max 300 lines per file (GEMINI Rule 3) — split if you go over.
- Shared TS types only in `shared/types/` — never duplicate per app.
- Real secrets never committed. Only `.env.example`.

## Who to ask

| Question                          | Ask        |
|-----------------------------------|------------|
| Backend API / architecture        | Ismail     |
| Database schema / migration       | Maral      |
| Dashboard UI, mobile styling      | Hamidullah |
| AI model / voice pipeline         | Firdavs    |
| Arduino / serial data / wiring    | Sarvar     |
