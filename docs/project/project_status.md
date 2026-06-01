# Project Status: Fishlinic

_Last updated: 2026-05-01 · HEAD: `4399eb3` · Branch: `develop`_
_Demo date: **June 30, 2026**_

## Mission

Build an **integrated smart aquarium** — physical tank + Arduino sensors +
NestJS backend + AI voice assistant + mobile app + web dashboard, with an
autonomous AI agent that monitors and manages water quality end-to-end.

**Today**: hardware is live with real sensor data, AI voice assistant is
fully functional, mobile app is production-quality. Next milestone =
autonomous AI agent (WOW feature) + push notifications + Supabase production.

See `docs/team-ownership.md` for sprint assignments per engineer.

---

## ✅ Complete

### Infrastructure & Backend
- [x] Monorepo (pnpm workspaces): `apps/`, `services/`, `firmware/`, `shared/`, `resources/`, `docs/`
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend (`:3000`) — modules: sensors, alerts, actuators, vision, voice, cron, gateway, fish, serial, management, database
- [x] TypeORM with better-sqlite3 (dev) / Postgres (prod) fallback
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### AI & Voice (Ismail)
- [x] AI predictor (`:8001`) — FastAPI, loads trained models
- [x] Models present at `resources/models/`:
      `rf_quality.pkl`, `yolo_disease.pt`, `yolo_count.pt`, `convlstm_vae.pth`
- [x] Voice assistant (Veronica) — Ollama `gemma4:e2b`, real sensor context injected per query
- [x] Backend `vision.service.ts` calls predictor for quality / count / disease
- [x] `aiOffline` flag — Ollama errors no longer swallowed silently; mobile shows fallback
- [x] STT pipeline fixed: blink loop cap, callRef race condition, Chrome onerror/onend ordering
- [ ] GPU detection, graceful missing-model fallback, per-model readiness
- [ ] ConvLSTM-VAE anomaly route + Veronica context injection

### Hardware (Sarvar — complete)
- [x] Single unified Arduino: pH (A0), DO (A1), CO2 (A2), Temp DS18B20 (pin 2), Feeder Servo (pin 9), RTC DS1307
- [x] Serial bridge (`:3001`) — JSON parser, two-way Arduino ↔ NestJS protocol
- [x] Real sensor data live — `SIMULATE_SENSORS=false`
- [x] Feeder multi-cycle non-blocking servo loop fixed
- [x] Firmware documented (`firmware/README.md`, `docs/serial-protocol.md`)

### Mobile (Ismail — complete)
- [x] 4-tab nav: Dashboard, Alerts, Controls, Fish AI
- [x] Dashboard: health score hero, 2×2 live sensor grid, quick actions, alert feed, fish intelligence
- [x] Fish AI — full ChatGPT/Claude-style redesign:
  - Full-screen voice overlay with animated orb (tappable to restart STT)
  - Live transcription ghost bubble during speech
  - Clean prose layout for AI (no hard bubbles)
  - Mic permission detection + error banner
- [x] Controls: actuator toggles + feed cycles + Feed Now with success/failure + haptics
- [x] Dashboard Feed Now quick action: success/failure state, 3s auto-reset, haptics
- [x] Settings: editable tank ranges, live service status, persistence
- [x] History: sensor history with range selector
- [x] Mobile pinned stable version set — expo~54 + RN 0.81.5 + react 19.1.0
      (do not upgrade — breaks the web build with a white screen)

### Dashboard (`:3002`) — low priority
- [x] Next.js skeleton — all main pages exist
- [x] Feeder panel: Feed Now with success/failure, schedule CRUD, hardware connection status
- [ ] Camera / growth / alerts pages still need wiring to new endpoints

### Tank Management
- [x] Feed schedules (CRUD + time + day mask + portion seconds + enabled)
- [x] Light schedule (on/off + brightness + color + overnight windows)
- [x] Tank config (cleaning interval, last-cleaned ts, emergency thresholds, push prefs)
- [x] Dynamic scheduler (60s tick) — fires feeds, toggles LED, checks emergency, cleaning reminder
- [x] REST: `/management/feed-schedules`, `/management/light-schedule`, `/management/tank-config`
- [x] Mobile ControlsScreen — manual actuators + full management UI

### Documentation
- [x] API contracts (`docs/api-contracts.md`)
- [x] Serial protocol (`docs/serial-protocol.md`)
- [x] Team ownership + sprint tasks (`docs/team-ownership.md`)
- [x] Supabase setup guide (`docs/supabase-setup.md`)

---

## 🔴 WOW Feature — Autonomous AI Agent (Ismail · 5–10 days · starting now)

**"Veronica takes action"** — watches the tank 24/7, detects issues, proposes interventions, executes on confirm.

### What it does
- Detects dangerous trends before they become emergencies
- Proposes action with reasoning: *"pH dropping for 40 min — now 6.8. Increasing aeration 20 min will stabilise it. Confirm?"*
- User taps Confirm → agent executes via existing backend APIs
- Multi-step tasks: *"Optimise tank for overnight"* → agent plans → user confirms → executes each step
- Root cause chains: *"DO dropped because temp spiked 2°C → pump duty too low. Confirm increase?"*
- Morning health brief: autonomous overnight summary at 07:00

### Implementation plan
| Day | Task |
|-----|------|
| 1–2 | Tool schema for Ollama: `readSensors`, `readHistory`, `controlActuator`, `triggerFeed`, `addSchedule` |
| 3–4 | Agent loop in `voice.service.ts`: LLM picks tool → calls backend → reasons → repeats or responds |
| 5–6 | Confirm-before-act UI in Fish AI screen: proposed action card with Confirm / Cancel |
| 7–8 | Proactive monitor: backend watcher on sensor stream → triggers agent on trend → push to mobile |
| 9–10 | Morning health brief (cron 07:00) + multi-step execution + polish |

### Architecture
```
Sensor stream → trend detector → agent (Ollama tool calls) → proposed action card
                                                                      ↓
                                              Confirm / Cancel in mobile Fish AI screen
                                                                      ↓
                                              POST /actuators/control (existing API)
```

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

## Ports (service map)

| Service          | Port  |
|------------------|-------|
| Backend          | 3000  |
| Serial bridge    | 3001  |
| Dashboard        | 3002  |
| Mobile (Expo)    | 8081  |
| AI predictor     | 8001  |
| Ollama (Veronica)| 11434 |

## Sprint order (toward June 30 demo)

1. **Ismail** — autonomous AI agent (WOW, 5–10 days) → push notifications (2–3 days)
2. **Maral** — DB migrations + Supabase + dashboard wiring (parallel)
3. Merge all → `develop` → demo on real tank.

See `docs/team-ownership.md` for the full punch list per engineer.
