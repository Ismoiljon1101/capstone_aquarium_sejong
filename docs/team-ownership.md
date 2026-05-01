# Team Ownership & Current Sprint

_Last updated: 2026-05-01 · HEAD: `4399eb3` · Branch to pull: `develop`_ · Demo: **June 30, 2026**

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
| Ismail   | Lead — everything (backend, mobile, AI, agent) | `services/backend/`, `apps/mobile/`, `shared/types/`, `docs/` |
| Maral    | Database + Dashboard         | `services/backend/src/modules/database/`, `migrations/`, `apps/dashboard/`       |
| Sarvar   | Hardware (complete)          | `firmware/`, `services/serial-bridge/`                                           |
| Firdavs  | AI Predictor (support)       | `services/ai-predictor/`, `resources/models/`                                    |

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
| Serial bridge (`:3001`)           | ✅ live         | real Arduino connected, `SIMULATE_SENSORS=false` |
| Mobile (`:8081`)                  | ✅ production   | Dashboard (live data), Controls, Fish AI (ChatGPT-style), Settings, Alerts, History |
| Veronica (Ollama `gemma4:e2b`)    | ✅ working      | real sensor context, aiOffline flag, STT fixed |
| Dashboard (`:3002`)               | ⚠️ partial     | feeder panel done; camera / growth / alerts pages need wiring |
| Dynamic scheduler                 | ✅ running      | 60s tick: feed schedules, light cycle, emergency thresholds |
| Tank management (BE + mobile UI)  | ✅ done         | feed schedules, light schedule, tank config, cleaning tracker |
| Trained ML models                 | ✅ loaded       | `resources/models/` — rf_quality.pkl, yolo_disease.pt, yolo_count.pt, convlstm_vae.pth |
| Autonomous AI agent               | 🔴 starting    | WOW feature — Ismail, 5–10 days |
| DB migrations                     | ❌ not started | backend uses `synchronize: true`; no migration files |
| Supabase production               | ❌ not started | `DATABASE_URL` + SSL config not set |
| Push notifications                | ❌ not started | after agent — Ismail, 2–3 days |

**Big picture**: hardware live, mobile production-quality, AI voice working.
Next = autonomous agent (WOW) → push notifications → Supabase → dashboard parity → demo June 30.

---

## Sarvar — Hardware (COMPLETE ✅)

Single unified Arduino wired and live. All sensor readings real.
`SIMULATE_SENSORS=false` confirmed in production `.env`.

Hardware: pH (A0), DO (A1), CO2 (A2), Temp DS18B20 (pin 2), Feeder Servo MG996R (pin 9), RTC DS1307.
No secondary Arduino — single controller handles everything.

---

## Maral — Database & Dashboard

**Goal**: production-ready DB + dashboard wiring.

### Database (priority first)

| # | Task                                                                      | Files                                                                                      | Done when                                         |
|---|---------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|---------------------------------------------------|
| 1 | Replace TypeORM `synchronize: true` with proper migrations                | `services/backend/src/modules/database/database.module.ts`, `migrations/` (new folder)     | `pnpm migration:run` applies schema on fresh PG   |
| 2 | Supabase production setup — `DATABASE_URL` in `.env.production`, SSL      | `services/backend/src/modules/database/database.module.ts`                                 | backend connects to Supabase, persists on restart |
| 3 | Seed script for default tank config + light schedule (singleton id=1)     | `services/backend/src/modules/database/seed.ts` (new)                                      | fresh DB has sane defaults, no null crashes       |

### Dashboard (low priority — end of sprint)

| # | Task                                                                      | Files                                                                        | Done when                                         |
|---|---------------------------------------------------------------------------|------------------------------------------------------------------------------|---------------------------------------------------|
| 4 | Camera snapshot + YOLO bounding boxes on fish-health page                 | `apps/dashboard/app/dashboard/fish-health/`, backend `modules/vision`        | latest frame + boxes render                       |
| 5 | Alerts page — ack / resolve from web (`PATCH /alerts/:id/acknowledge`)    | `apps/dashboard/app/dashboard/alerts/`                                       | button marks alert resolved                       |
| 6 | Wire dashboard settings → `/management/*` (schedules + thresholds)        | `apps/dashboard/app/settings/`                                               | web CRUD matches mobile Controls screen           |

---

## Firdavs — AI Predictor (support role)

> **Full setup guide: [`docs/ai-llm-setup.md`](ai-llm-setup.md)**

Core Veronica voice pipeline is owned by Ismail. Firdavs supports the Python predictor service.

| # | Task                                                                                        | Files                                                                                                 | Done when                                                     |
|---|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| 1 | GPU detection + CPU fallback in predictor                                                   | `services/ai-predictor/src/main.py`, `routes/*.py`                                                    | service logs `device: cuda` or `device: cpu` on start         |
| 2 | Graceful missing-model handling — service starts even if a `.pt` / `.pkl` absent            | `services/ai-predictor/src/routes/predict_quality.py`, `predict_disease.py`, `predict_count.py`        | 503 returned cleanly, no crash                               |
| 3 | ConvLSTM-VAE anomaly detection: `/predict/anomaly` route over 10-reading window             | `services/ai-predictor/src/routes/predict_anomaly.py` (new)                                           | anomaly score available for agent context                    |

---

## Ismail — Autonomous AI Agent + Push Notifications

**Priority 1: Autonomous AI Agent (5–10 days)**

| # | Task                                                                                          | Files                                                                          | Done when                                                      |
|---|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------|
| 1 | Tool schema for Ollama: `readSensors`, `readHistory`, `controlActuator`, `triggerFeed`, `addSchedule` | `services/backend/src/modules/voice/voice.service.ts`             | LLM can call each tool by name                                 |
| 2 | Agent loop: LLM picks tool → backend executes → LLM reasons → repeats or responds            | `services/backend/src/modules/voice/voice.service.ts`                          | multi-step tasks complete autonomously                         |
| 3 | Confirm-before-act UI: proposed action card with Confirm / Cancel                             | `apps/mobile/src/screens/FishHealthScreen.tsx`                                 | user sees reasoning + taps confirm before any action executes  |
| 4 | Proactive monitor: trend detector on sensor stream → triggers agent → push to mobile          | `services/backend/src/modules/voice/` (new monitor service)                    | agent proactively warns before emergency                       |
| 5 | Morning health brief: cron 07:00 → overnight summary delivered to chat                        | `services/backend/src/modules/cron/`                                           | morning brief appears in Fish AI chat at 07:00                 |

**Priority 2: Push Notifications (2–3 days, after agent)**

| # | Task                                                                       | Files                                                                                          | Done when                                          |
|---|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|----------------------------------------------------|
| 6 | Expo push token registration on app start                                  | `apps/mobile/App.tsx`, `src/hooks/usePushToken.ts` (new)                                       | token saved via `PATCH /management/tank-config`    |
| 7 | Backend push sender when scheduler creates CRITICAL alert                  | `services/backend/src/modules/alerts/push.service.ts` (new)                                    | phone buzzes on emergency threshold breach         |
| 8 | Deep linking — notification tap → Alerts screen                            | `apps/mobile/src/navigation/AppNavigator.tsx`                                                   | tap opens the correct alert                        |

---

## Sprint order (toward June 30 demo)

1. **Ismail** — autonomous AI agent → push notifications
2. **Maral** — DB migrations + Supabase + dashboard wiring (parallel)
3. Merge all → `develop` → demo on real tank.

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
| Backend API / architecture / mobile / AI agent | Ismail |
| Database schema / migration / dashboard | Maral |
| AI predictor / Python models      | Firdavs    |
| Arduino / serial / hardware       | Sarvar     |
