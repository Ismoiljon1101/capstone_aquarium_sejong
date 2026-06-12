# Project Status: Fishlinic

_Last updated: 2026-06-06 · Branch: `master`_  
_Demo date: **June 30, 2026**_

## Mission

Build an **integrated smart aquarium** — physical tank + Arduino sensors +
NestJS backend + AI models + web dashboard, with real-time monitoring,
disease detection, water quality prediction, and behavior analysis.

---

## ✅ Complete

### Infrastructure & Backend
- [x] Monorepo (pnpm workspaces): `apps/`, `services/`, `firmware/`, `shared/`, `models/`, `docs/`
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend (`:3001`) — modules: sensors, alerts, actuators, vision, voice, cron, gateway, fish, serial, management, database
- [x] TypeORM with better-sqlite3 (dev) / Postgres (prod) fallback
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### AI Predictor (`:8000`) — FastAPI
- [x] Water quality prediction — Random Forest (`models/quality/best_rf_water_quality.pkl`)
  - Predicts Good/Average/Bad from pH, temp, DO
  - Per-parameter warnings (pH, temp, DO thresholds)
  - DB logging + history + alerts endpoints
- [x] Disease detection — YOLOv11 (`models/disease/yolo_disease.pt`)
  - Detects BD, PD, FD, HF from images and video frames
  - Multi-detection support, alert flagging
  - DB logging + history + alerts + stats endpoints
- [x] Fish attitude detection — YOLO (`models/behavior/`)
  - Swim angle analysis, tilt severity classification
  - DB logging + history + alerts endpoints
- [x] Fish behavior detection — R3D-18 (`models/behavior/best_model.pth`)
  - Video-based behavior classification
- [x] Fish movement tracking — YOLO + optical flow
  - Speed, direction, zone analysis
- [x] Fish count — YOLO (`models/disease/yolo_disease.pt`)
- [x] Anomaly detection model present (`models/anomaly/convlstm_vae_anomaly.pth`)

### Models (all consolidated in `models/`)
- [x] `models/disease/` — yolo_disease.pt, yolo11n.pt, latest.pt
- [x] `models/behavior/` — best_model.pth, behavior_random_forest.pkl, encoders
- [x] `models/quality/` — best_rf_water_quality.pkl
- [x] `models/anomaly/` — convlstm_vae_anomaly.pth

### Frontend Dashboard (`:3000`) — Next.js
- [x] All main pages: dashboard, fish-health, alerts, controls, history, settings
- [x] Live telemetry via Socket.IO
- [x] FishHealthPanel, LiveTelemetry, ControlPanel, AlertFeed, VeronicaChat
- [x] AIMonitorPanel — unified water quality + disease + behavior panel
- [x] Authentication (email/password + Google/Kakao OAuth)

### Hardware
- [x] Arduino UNO R3 — pH, DO, Temperature sensors + Fish Feeder + RTC
- [x] Serial bridge (`:3002`) — JSON parser, Arduino ↔ NestJS
- [x] Firmware documented (`firmware/arduino/`)

### Project Structure (cleaned 2026-06-06)
- [x] All models consolidated in `models/` with 4 subfolders
- [x] All AI routes updated to use new model paths
- [x] Removed duplicate files, old training scripts archived
- [x] Components organized into atoms/molecules/organisms

---

## 🏗 Architecture

```
Hardware (Arduino) → Serial Bridge (:3002)
                              ↓
                    NestJS Backend (:3001)
                    ↙              ↘
          FastAPI AI (:8000)    Next.js Dashboard (:3000)
                    ↓
              SQLite DB (fishlinic.sqlite)
```

## 🔌 Ports
| Service | Port |
|---------|------|
| Next.js Dashboard | 3000 |
| NestJS Backend | 3001 |
| Serial Bridge | 3002 |
| FastAPI AI Predictor | 8000 |
---

## ⚠️ Remaining

| Area | Owner | Status |
|------|-------|--------|
| Autonomous AI agent | Ismail | Starting now — 5–10 days |
| Push notifications | Ismail | After agent — 2–3 days |
| DB migrations (replace `synchronize:true`) | Maral | Not started |
| Supabase production setup | Maral | Not started |
| Dashboard wiring (camera / growth / alerts) | Maral | Low priority — end of sprint |

## ❌ Not started

- [ ] Push notifications (Expo → backend → phone)
- [ ] DB migrations / Supabase production
- [ ] Health / ready probes on all services
- [ ] Docker / CI / deployment pipeline
- [ ] Unit + E2E tests

---

## Known constraints

- **Mobile package versions are pinned** — do not upgrade.
  expo~54 + RN 0.81.5 + react 19.1.0. Upgrading breaks web build with a white screen.
- Voice queries need 60s timeout in mobile client (Ollama cold start).
- Single Arduino handles all sensors + feeder. No secondary controller.

## Demo readiness

**Works right now with real hardware:**
- Mobile with live sensor stream (pH, temp, DO, CO2)
- Veronica AI voice + chat with real ML quality score
- CRITICAL alerts from real readings outside thresholds
- Fish count + YOLO disease detection
- Full tank management CRUD + dynamic scheduler
- Feed Now with real success/failure feedback (mobile + web dashboard)

**Unlocks in next 10 days:**
- Autonomous AI agent with confirm-before-act (WOW)
- Push notifications on emergency threshold breach

## Sprint order (toward June 30 demo)

1. **Ismail** — autonomous AI agent (WOW, 5–10 days) → push notifications (2–3 days)
2. **Maral** — DB migrations + Supabase + dashboard wiring (parallel)
3. Merge all → `develop` → demo on real tank.

See `docs/team-ownership.md` for the full punch list per engineer.
