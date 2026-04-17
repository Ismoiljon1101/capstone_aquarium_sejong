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

## Maral — Dashboard & Vision

**Goal**: professor-ready web dashboard with AI visualization + feature parity with mobile.

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | Camera snapshot + YOLO disease overlay on fish-health page | `apps/dashboard/app/dashboard/fish-health/`, backend `modules/vision` | latest frame + bounding boxes render |
| 2 | Growth tracking chart (fish count over time) | `apps/dashboard/app/dashboard/fish-health/` | line chart from `/fish/count` history |
| 3 | Alerts management page — ack/resolve from web | `apps/dashboard/app/dashboard/alerts/` | uses `PATCH /alerts/:id/acknowledge` |
| 4 | History — time-range export to CSV | `apps/dashboard/app/dashboard/history/` | download button outputs valid CSV |
| 5 | Wire dashboard settings to `/management/*` endpoints (schedules + thresholds) | `apps/dashboard/app/settings/` | web CRUD matches mobile Controls screen |

**Branch**: `feat/maral-dashboard`
**Deliverable**: dashboard has feature parity with mobile.

---

## Firdavs — Mobile Push & AI Polish

**Goal**: production-feel mobile with real push alerts + AI predictor robustness.

| # | Task | Files | Done when |
|---|---|---|---|
| 1 | Expo push notifications — register token, save via `PATCH /management/tank-config` (`pushToken` field already in entity) | `apps/mobile/App.tsx`, `src/hooks/usePushToken.ts` (new), backend `management.service.ts` | token stored in DB |
| 2 | Backend route: send push via Expo API when scheduler creates CRITICAL alert | `services/backend/src/modules/alerts/push.service.ts` (new) | phone buzzes on emergency |
| 3 | Deep linking — notification tap → Alerts screen highlighting that alert | `apps/mobile/src/navigation/AppNavigator.tsx`, `AlertsScreen.tsx` | tapping notif opens app to correct alert |
| 4 | AI predictor GPU detection + graceful model-missing handling | `services/ai-predictor/src/routes/*.py` | service starts even if a model file missing |
| 5 | Alert sound + haptic on critical (toggle already in SettingsScreen) | `apps/mobile/src/hooks/useSocket.ts` | haptic fires when critical alert arrives |

**Branch**: `feat/firdavs-push`
**Deliverable**: phone buzzes when water quality critical, even if app closed.

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
