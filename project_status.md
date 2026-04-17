# Project Status: Fishlinic

_Last updated: 2026-04-17 (HEAD: `920ca1e`)_

## ✅ Complete

### Infrastructure & Backend
- [x] Monorepo (pnpm workspaces)
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend — modules: sensors, alerts, actuators, vision, voice, cron, gateway, fish, serial, management, database
- [x] TypeORM with better-sqlite3 (dev) / Postgres (prod) fallback
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### Services & Hardware
- [x] Serial bridge (`:3001`) — JSON parser, mock fallback
- [x] AI predictor (`:8001`) — FastAPI, loads trained models
- [x] Models at `resources/models/` — `rf_quality.pkl`, `yolo_disease.pt`, `yolo_count.pt`, `convlstm_vae.pth`
- [x] Voice assistant (Veronica) — Ollama `qwen2.5:3b`, full sensor context grounding
- [x] Sensor simulator — pushes pH/temp/DO/CO2 every 8s (disable with `SIMULATE_SENSORS=false`)

### Frontend
- [x] Dashboard (`:3002`) — landing, main dashboard, alerts, controls, fish-health, history, settings, auth
- [x] Mobile (`:8081`) — Dashboard, Alerts, Controls+Management, Fish AI, Settings
- [x] Mobile stable version set — expo~54 + RN 0.81.5 + react 19.1.0 (pinned)

### Tank Management (NEW — 2026-04-17)
- [x] Feed schedules (CRUD + time + day mask + portion seconds + enabled)
- [x] Light schedule (on/off time + brightness + color + enabled, supports overnight windows)
- [x] Tank config (cleaning interval, last cleaned timestamp, emergency thresholds, push prefs)
- [x] Dynamic scheduler (60s tick) — fires feeds, toggles LED, checks emergency, cleaning reminder
- [x] REST endpoints: `/management/feed-schedules`, `/management/light-schedule`, `/management/tank-config`
- [x] Mobile ControlsScreen — manual actuators + full management UI

### Documentation
- [x] API contracts (`docs/api-contracts.md`)
- [x] Serial protocol (`docs/serial-protocol.md`)
- [x] Team ownership (`docs/team-ownership.md`)
- [x] Team tasks for integration sprint (`TEAM_TASKS.md`)

---

## ⚠️ Partial / in progress

- [ ] **Serial bridge**: still mock mode — real Arduino wiring pending (Sarvar)
- [ ] **Dashboard**: camera/growth/alerts pages need wiring to new endpoints (Maral)
- [ ] **Mobile push notifications**: `pushToken` field in entity, no registration/send yet (Firdavs)
- [ ] **Multi-tank support**: hardcoded `sensorId: 1` / `tankId: 1` throughout (Sarvar)
- [ ] **Secondary Arduino**: firmware exists, bridge ignores it (Sarvar)

## ❌ Not started

- [ ] CRC/checksum on serial packets
- [ ] Health/ready probes on services
- [ ] GPU detection in AI predictor
- [ ] Dashboard CSV export for history
- [ ] Docker / CI / deployment pipeline
- [ ] Unit + E2E tests (jest scaffolded, nothing written)
- [ ] RBAC / user roles
- [ ] OTA firmware updates

---

## Known constraints

- `apps/mobile/package.json` versions are **pinned** — do not upgrade (breaks web build with white screen). See `_versionNote` in file.
- Max 300 lines per file (GEMINI Rule 3) — some dashboard pages violate this; refactor pending.
- Voice queries need 60s timeout in mobile client (Ollama cold start).

## Demo readiness

**What works right now** (no hardware needed):
- Mobile dashboard with simulated sensor stream
- Veronica AI voice + chat with real ML quality score
- Alerts (critical triggered by simulated readings outside thresholds)
- Fish count + YOLO disease detection on uploaded images
- Tank management CRUD (schedules, thresholds, cleaning reminder)
- Dynamic scheduler firing feed/light based on configured times

**What unlocks when Arduino plugs in**:
- Real sensor readings replace simulator (same code path)
- Physical feeder/pump/LED actuation (relay commands already routed via bridge)
- Push notification on real emergency conditions

See `TEAM_TASKS.md` for sprint assignments.
