# Project Status: Fishlinic

_Last updated: 2026-06-12 · Branch: `develop` (Merged with Maral)_  
_Demo date: **June 30, 2026**_

## Mission

Build an **integrated smart aquarium** — physical tank + Arduino sensors + NestJS backend + AI models + web dashboard, with real-time monitoring, disease detection, water quality prediction, and behavior analysis.

---

## ✅ Complete

### Infrastructure & Backend
- [x] Monorepo (pnpm workspaces): `apps/`, `services/`, `firmware/`, `shared/`, `models/`, `docs/`
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend (`:3000`) — modules: sensors, alerts, actuators, vision, voice, cron, gateway, fish, serial, management, database, auth
- [x] TypeORM with better-sqlite3 (dev) / Postgres (prod) fallback
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### AI Predictor & Voice — FastAPI & NestJS
- [x] AI predictor (`:8000`) — FastAPI, loads trained models
- [x] Models present at `models/`:
  - `models/quality/best_rf_water_quality.pkl` (Water quality Good/Average/Bad)
  - `models/disease/yolo_disease.pt` (Fish disease detection)
  - `models/behavior/best_model.pth` (Behavior classification)
  - `models/anomaly/convlstm_vae_anomaly.pth` (Anomaly detection)
- [x] Fish count endpoint (`/predict/count`)
- [x] Fish attitude detection (`/predict/attitude`) — swim angle and tilt severity
- [x] Fish movement tracking (`/predict/movement`) — speed, direction, drift ratio
- [x] Live Analysis pipeline (`live_analysis.py`) — frame-by-frame attitude, movement, and behavior anomaly detection
- [x] Voice assistant (Veronica) — OpenRouter cloud LLM, real sensor context injected per query
- [x] **Autonomous AI agent** — `agent.service.ts`, tool loop with 17 tools
- [x] **Confirm-before-act UI** — `FishHealthScreen.tsx` shows proposed action card with Confirm/Cancel
- [x] **Auto vs confirm mode** — `tankConfig.agentMode`: `'confirm'` (default) | `'auto'`
- [x] **Proactive monitor** — `agent.monitor.ts`, checks sensors every 5 min, pushes alert if issue detected
- [x] **Morning health brief** — cron `1 7 * * *`, Veronica overnight summary → push notification
- [x] **addSchedule tool** — Veronica can create feed schedules via voice

### Mobile (Ismail — complete)
- [x] 4-tab nav: Dashboard, Alerts, Controls, Fish AI
- [x] Dashboard: health score hero, 2×2 live sensor grid, quick actions, alert feed, fish intelligence
- [x] Fish AI — full ChatGPT/Claude-style redesign:
  - Full-screen voice overlay with animated orb (tappable to restart STT)
  - Live transcription ghost bubble during speech
  - Clean prose layout for AI (no hard bubbles)
  - Mic permission detection + error banner
  - **macOS Glassmorphic Reasoning Terminal**: scrolling console `[● ● ●] VERONICA_REASONING_SHELL v2.4.1` with a blinking caret `█` cursor that displays live registers, telemetry limits, and vision checks to engage users during thinking processes
  - **Expo Go Compatibility Fix**: replaced custom C++ JSI bindings (from `react-native-keyboard-controller`) with standard native `KeyboardAvoidingView` layouts, completely resolving `TurboModule runtime is not ready` crashes when run inside standard Expo Go clients over local Wi-Fi
- [x] Controls: actuator toggles + feed cycles + Feed Now with success/failure + haptics
- [x] Dashboard Feed Now quick action: success/failure state, 3s auto-reset, haptics
- [x] Settings: editable tank ranges, live service status, persistence
- [x] History: sensor history with range selector
- [x] Mobile pinned stable version set — expo~54 + RN 0.81.5 + react 19.1.0
      (do not upgrade — breaks the web build with a white screen)

### Hardware & Bridge
- [x] Arduino UNO R3 — pH, DO, Temperature sensors + Fish Feeder + RTC
- [x] Serial bridge (`:3001`) — JSON parser, Arduino ↔ NestJS
- [x] Firmware documented (`firmware/arduino/`)
- [x] **Stale data detection** — `sensors.service.ts` flags readings >60s old as `status: 'stale'`
- [x] **Hardware watchdog** — 30s watcher emits `hardware:status` WS event on disconnect/reconnect
- [x] **Serial bridge reconnect** — auto-retries every 10s on close/error (no more silent failure)
- [x] **Mobile offline banner** — DashboardScreen shows "Arduino offline" when `hardware:status { online: false }`
- [x] **No fake data by default** — simulator default flipped to opt-in (`SIMULATE_SENSORS=true`); serial bridge no longer auto-falls back to mock on disconnect

### Dashboard
- [x] Next.js Dashboard (`apps/dashboard/`) — pages: dashboard, controls, settings, history, vassistant
- [x] Feeder panel: Feed Now with success/failure, schedule CRUD, hardware connection status
- [x] AIMonitorPanel — unified water quality + disease + behavior panel
- [x] Authentication (email/password + Google/Kakao OAuth)
- [x] VeronicaLiveVideo card — dynamic camera source selection

---

## 🔌 Ports (Service Map)

| Service | Port | Notes |
|---------|------|-------|
| Next.js Dashboard | 3000 | Web UI |
| NestJS Backend | 3001 | REST + Socket.IO |
| Serial Bridge | 3002 | Arduino USB bridge |
| FastAPI AI Predictor | 8000 | All AI model endpoints |
| Expo Mobile | 8081 | React Native app |
| Ollama (Veronica) | 11434 | Local LLM fallback |

---

## ⚠️ Remaining & Known constraints

- **Mobile package versions are pinned** — do not upgrade.
  expo~54 + RN 0.81.5 + react 19.1.0. Upgrading breaks web build with a white screen.
- Voice queries need 60s timeout in mobile client (Ollama cold start).
- Single Arduino handles all sensors + feeder. No secondary controller.
- DB migrations: replace `synchronize:true` in production Supabase setup.
