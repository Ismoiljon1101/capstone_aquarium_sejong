# Project Status: Fishlinic

_Last updated: 2026-04-17 · HEAD: `d57a4dc` · Branch: `develop`_

## Mission

Build an **integrated smart aquarium** — physical tank + Arduino sensors +
bridge server + NestJS backend + AI models + mobile app + web dashboard,
all wired together end-to-end.

**Today**: software stack works entirely on **simulated data**. Real tank
not connected. Replacing the simulator with real hardware and shipping a
DB + push pipeline is the remaining milestone.

See `docs/team-ownership.md` for sprint assignments per engineer.

---

## ✅ Complete

### Infrastructure & Backend
- [x] Monorepo (pnpm workspaces): `apps/`, `services/`, `firmware/`, `shared/`, `resources/`, `docs/`
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend (`:3000`) — modules: sensors, alerts, actuators, vision, voice, cron, gateway, fish, serial, management, database
- [x] TypeORM with better-sqlite3 (dev) / Postgres (prod) fallback
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### AI (Firdavs — mostly done)
- [x] AI predictor (`:8001`) — FastAPI, loads trained models
- [x] Models present at `resources/models/`:
      `rf_quality.pkl`, `yolo_disease.pt`, `yolo_count.pt`, `convlstm_vae.pth`
- [x] Voice assistant (Veronica) — Ollama `gemma3:4b`, sensor-context grounded
- [x] Backend `vision.service.ts` calls predictor for quality / count / disease
- [ ] GPU detection, graceful missing-model fallback, per-model readiness (remaining — see team-ownership.md)
- [ ] ConvLSTM-VAE anomaly route + Veronica context injection (remaining)

### Serial Bridge & Sensors (fake-data only today)
- [x] Serial bridge (`:3001`) — JSON parser, mock fallback, actuator command routing
- [x] Sensor simulator pushes pH/temp/DO/CO2 every 8s when `SIMULATE_SENSORS != false`
- [x] **Real Arduino wired end-to-end** — live telemetry replacing simulator
- [ ] Secondary Arduino firmware exists but bridge ignores it
- [ ] No CRC / checksum on serial packets
- [ ] `sensorId: 1` / `tankId: 1` hardcoded throughout — no multi-tank

### Frontend
- [x] Mobile (`:8081`) — Dashboard, Alerts, Controls+Management, Fish AI, Settings
- [x] Mobile pinned stable version set — expo~54 + RN 0.81.5 + react 19.1.0
      (do not upgrade — breaks the web build with a white screen)
- [x] Dashboard (`:3002`) skeleton — landing, dashboard, alerts, controls, fish-health, history, settings, auth
- [ ] Dashboard camera / growth / alerts pages still need wiring to new endpoints

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

## ⚠️ Partial / in progress

| Area | Owner | Gap |
|---|---|---|
| Serial bridge → real Arduino | Sarvar | COMPLETE |
| Dashboard wiring | Maral / Hamidullah | camera / growth / alerts endpoints not hooked |
| DB migrations | Maral | `synchronize: true` still on; no migration files |
| Supabase production | Maral | `DATABASE_URL` + SSL config not set |
| Mobile push notifications | Ismail | `pushToken` field exists on entity; no registration / sender |
| Multi-tank support | Sarvar | `sensorId: 1` / `tankId: 1` hardcoded |
| Secondary Arduino | Sarvar | firmware exists, bridge ignores it |
| AI predictor GPU / readiness | Firdavs | no device logging, no `/ready` per model |
| Disease bbox in UI | Firdavs + Maral | `/vision/detect-disease` not exposed to dashboard |
| ConvLSTM-VAE anomaly feed to Veronica | Firdavs | no `/predict/anomaly` route yet |

## ❌ Not started

- [ ] CRC / checksum on serial packets
- [ ] Health / ready probes on all services
- [ ] Push notifications (Expo → backend → phone)
- [ ] Dashboard CSV / PDF export
- [ ] Docker / CI / deployment pipeline
- [ ] Unit + E2E tests (jest scaffolded, nothing written)
- [ ] RBAC / user roles
- [ ] OTA firmware updates

---

## Known constraints

- **`apps/mobile/package.json` versions are pinned** — do not upgrade.
  expo~54 + RN 0.81.5 + react 19.1.0 is the tested stable set.
  See `_versionNote` in the file. Upgrading breaks web with a white screen.
- Max 300 lines per file (GEMINI Rule 3) — some dashboard pages violate this; refactor pending.
- Voice queries need 60s timeout in mobile client (Ollama cold start).

## Demo readiness

**What works right now (no hardware needed)**:
- Mobile dashboard with simulated sensor stream
- Veronica AI voice + chat with real ML quality score
- Alerts (CRITICAL triggered by simulated readings outside thresholds)
- Fish count + YOLO disease detection on uploaded images
- Tank management CRUD (schedules, thresholds, cleaning reminder)
- Dynamic scheduler firing feed / light based on configured times

**What unlocks when Arduino plugs in**:
- Real sensor readings replace simulator (same code path — `SIMULATE_SENSORS=false`)
- Physical feeder / pump / LED actuation (relay commands already routed via bridge)
- Push notifications on real emergency conditions (once Ismail's work lands)

## Ports (service map)

| Service          | Port  |
|------------------|-------|
| Backend          | 3000  |
| Serial bridge    | 3001  |
| Dashboard        | 3002  |
| Mobile (Expo)    | 8081  |
| AI predictor     | 8001  |
| Ollama (Veronica)| 11434 |

## Integration order (current sprint)

1. **Sarvar** — real Arduino wiring + multi-tank unlocks live data for everyone.
2. **Maral + Firdavs** — parallel DB hardening + AI robustness, both consume backend APIs.
3. **Ismail + Hamidullah** — push notifications + UI polish land last.
4. Merge everything → `develop` → demo on real tank.

See `docs/team-ownership.md` for the full punch list per engineer.
