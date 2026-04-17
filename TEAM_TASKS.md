# Team Tasks — Integration Sprint (2026-04-17)

> **Branch to pull**: `develop` (HEAD: `920ca1e`)
> **Setup**: `git checkout develop && git pull origin develop && pnpm install`
> **DO NOT** touch `apps/mobile/package.json` versions — pinned stable set (see `_versionNote`).

---

## Current system state

| Area | Status | Notes |
|---|---|---|
| NestJS backend (`:3000`) | ✅ working | sensors, alerts, actuators, voice, vision, management, cron |
| AI predictor (`:8001`) | ✅ working | RF quality, YOLO disease/count, ConvLSTM VAE |
| Serial bridge (`:3001`) | ⚠️ mock mode | falls back when no Arduino plugged in |
| Mobile (`:8081`) | ✅ working | Dashboard, Controls+Management, Fish AI (Veronica), Settings, Alerts |
| Dashboard (`:3002`) | ⚠️ partial | needs camera/growth/alerts wiring to new endpoints |
| Sensor simulator | ✅ running | pushes pH/temp/DO/CO2 every 8s when `SIMULATE_SENSORS!=false` |
| Dynamic scheduler | ✅ running | 60s tick: feed schedules, light cycle, emergency thresholds, cleaning reminder |
| Tank management (backend + mobile UI) | ✅ done | feed schedules, light schedule, tank config, cleaning tracker |
| Trained ML models | ✅ loaded | `resources/models/` — rf_quality.pkl, yolo_disease.pt, yolo_count.pt, convlstm_vae.pth |

---

## Sarvar — Hardware Bridge & Backend Infra

**Goal:** real Arduino plugged in → everything works like clockwork.

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | Wire secondary Arduino in serial bridge (firmware exists but bridge ignores it) | `services/serial-bridge/src/`, `firmware/secondary/secondary.ino` | secondary sensors ingest into backend |
| 2 | CRC/checksum on serial packets | `services/serial-bridge/src/parser.ts`, `firmware/main/main.ino` | corrupt packet rejected, logged |
| 3 | Health/ready endpoints on all services | `services/backend`, `services/ai-predictor`, `services/serial-bridge` | `/health` returns 200, `/ready` checks DB + model load |
| 4 | Multi-tank support — parameterize hardcoded `sensorId: 1` / `tankId: 1` | `services/backend/src/modules/sensors`, `alerts`, `management` | second tank config can be added via API |
| 5 | Flip `SIMULATE_SENSORS=false`, verify end-to-end with real tank | `.env`, live serial test | real pH/temp reading on mobile Dashboard |

**Branch**: `feat/sarvar-hardware`
**Deliverable**: physical tank readings land on mobile Dashboard.

---

## Maral — Database & Dashboard

**Goal**: production-ready DB + professor-ready web dashboard with feature parity with mobile.

### Database (priority first)

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | Replace TypeORM `synchronize: true` with proper migrations | `services/backend/src/modules/database/database.module.ts`, `migrations/` (new folder) | `pnpm migration:run` applies schema cleanly on fresh Postgres |
| 2 | Supabase production setup — `DATABASE_URL` in `.env.production`, SSL config | `services/backend/src/modules/database/database.module.ts` | backend connects to Supabase, data persists across restarts |
| 3 | Add missing entities to DB config — verify `FishGrowth`, all new management entities registered | `services/backend/src/modules/database/database.config.ts` | no `EntityMetadataNotFoundError` on startup |
| 4 | Seed script for default tank config + light schedule (singleton rows id=1) | `services/backend/src/modules/database/seed.ts` (new) | fresh DB has sane defaults, no null crashes |

### Dashboard

| # | Task | Files | Done when |
|---|---|---|---|
| 5 | Camera snapshot + YOLO bounding boxes on fish-health page | `apps/dashboard/app/dashboard/fish-health/`, backend `modules/vision` | latest frame + boxes render |
| 6 | Growth tracking chart (fish count over time) | `apps/dashboard/app/dashboard/fish-health/` | line chart from `/fish/count` history |
| 7 | Alerts page — ack/resolve from web (`PATCH /alerts/:id/acknowledge`) | `apps/dashboard/app/dashboard/alerts/` | button marks alert resolved |
| 8 | Wire dashboard settings → `/management/*` (schedules + thresholds) | `apps/dashboard/app/settings/` | web CRUD matches mobile Controls screen |

**Branch**: `feat/maral-db-dashboard`
**Deliverable**: Supabase connected, migrations scripted, dashboard has feature parity with mobile.

---

## Firdavs — AI Predictor & ML Models

**Goal**: robust, accurate AI inference — all models load, GPU-aware, results visible in UI.

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | GPU detection + CPU fallback in predictor | `services/ai-predictor/src/main.py`, `routes/*.py` | service logs `device: cuda` or `device: cpu` on start |
| 2 | Graceful missing-model handling — service starts even if a `.pt`/`.pkl` file absent | `services/ai-predictor/src/routes/predict_quality.py`, `predict_disease.py`, `predict_count.py` | 503 returned cleanly, no crash |
| 3 | Model readiness endpoint `/ready` — returns which models loaded successfully | `services/ai-predictor/src/main.py` | Settings screen AI Predictor badge shows per-model status |
| 4 | Disease detection: wire `/vision/detect-disease` → camera snapshot → return annotated bounding boxes | `services/backend/src/modules/vision/vision.service.ts`, `services/ai-predictor/src/routes/predict_disease.py` | YOLO boxes returned as JSON `[{label, confidence, bbox}]` |
| 5 | ConvLSTM-VAE anomaly detection: `/predict/anomaly` route consuming 10-reading window from sensor history | `services/ai-predictor/src/routes/predict_anomaly.py` (new), backend `voice.service.ts` system prompt | anomaly score included in Veronica's context |

**Branch**: `feat/firdavs-ai`
**Deliverable**: all 4 models load reliably, disease bounding boxes display on dashboard, anomaly score fed to Veronica.

---

## Ismail (you) — Mobile Push Notifications

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | Expo push token registration on app start | `apps/mobile/App.tsx`, `src/hooks/usePushToken.ts` (new) | token saved via `PATCH /management/tank-config` |
| 2 | Backend push sender when scheduler creates CRITICAL alert | `services/backend/src/modules/alerts/push.service.ts` (new) | phone buzzes on emergency threshold breach |
| 3 | Deep linking — notification tap → Alerts screen | `apps/mobile/src/navigation/AppNavigator.tsx`, `AlertsScreen.tsx` | tap opens correct alert |

---

## Integration order

1. **Sarvar first** — hardware bridge unlocks real data for everyone.
2. **Maral + Firdavs parallel** — both consume backend APIs, no overlap.
3. Merge all → `develop` → demo on real tank.

## Rules

- Branch per task; PR into `develop`.
- Before committing: `pnpm install` from root, verify mobile loads at `localhost:8081`, backend at `localhost:3000`.
- Backend port **3000**, mobile port **8081**, dashboard **3002**, ai-predictor **8001**, serial-bridge **3001**.
- **Never upgrade mobile package versions** — expo~54 + RN 0.81.5 + react 19.1.0 is locked.
- Socket events: `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`.
- Atomic Design on mobile/dashboard: atoms → molecules → organisms → screens.
