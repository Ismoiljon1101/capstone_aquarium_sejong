# Project Status: Fishlinic

_Last updated: 2026-04-17 · HEAD: `fc957fc` · Branch: `develop`_

## Mission

Integrated smart aquarium — physical tank + Arduino sensors + bridge server
+ NestJS backend + AI models + mobile app + web dashboard, all wired end-to-end.

---

## 🏆 Hardware tested today — IT WORKS

Real tank tested on 2026-04-17:
- ✅ Real sensor readings (pH, temp, DO, CO2) live on mobile Dashboard
- ✅ Feeder relay fired on schedule and on manual command
- ✅ AI quality score updating from real readings
- ✅ Alerts triggered by real threshold breaches

The simulator can now be replaced permanently (`SIMULATE_SENSORS=false`).

---

## Sprint state (who is where)

| Person | Status | Waiting on |
|---|---|---|
| Sarvar | Almost done — hardware wired | Push to develop |
| Maral | Almost done — DB migrations + Supabase | Push to develop |
| Firdavs | 2 items left (GPU detection + `/ready` endpoint) | Ismail finishing them |
| Ismail | Finishing Firdavs remainder + merge lead | Sarvar + Maral push |
| Hamidullah | Dashboard wiring | Maral's DB + endpoints |

**After Sarvar + Maral push → Ismail merges → resolve conflicts → final items below.**

---

## What's left after merge

### 1. User Auth / Login
- [ ] Mobile login screen (email + password → JWT)
- [ ] Backend auth module (`POST /auth/login`, `POST /auth/register`)
- [ ] Protected routes on mobile (redirect to login if no token)
- [ ] Dashboard auth already has NextAuth — wire to same backend users

### 2. Hosting (Cloudflare Tunnel + domain)
- [ ] Run `cloudflared tunnel` on laptop → expose backend `:3000` publicly
- [ ] Point domain DNS → Cloudflare tunnel
- [ ] Update mobile `API_URL` + `WS_URL` to public domain (not localhost)
- [ ] Update dashboard `NEXT_PUBLIC_SOCKET_URL` + `BACKEND_URL`
- [ ] Test from phones on mobile data (no local WiFi)

### 3. Phone testing
- [ ] Build Expo app for iOS (`eas build --platform ios`) or TestFlight
- [ ] Build Expo app for Android (`eas build --platform android`)
- [ ] OR run `npx expo start` + teammates scan QR on same network
- [ ] Verify live sensor stream on real phones
- [ ] Verify Veronica responds end-to-end on phone

### 4. Firdavs remainder (Ismail finishing)
- [ ] GPU detection — `torch.cuda.is_available()` log on predictor start
- [ ] `/ready` endpoint — return which models loaded per-model

### 5. Push notifications (nice to have before demo)
- [ ] Expo push token registration on app start
- [ ] Backend sends push on CRITICAL alert

### 6. Tests (nice to have)
- [ ] Zero tests exist — at minimum unit test sensor threshold logic

---

## ✅ Complete

### Core infrastructure
- [x] Monorepo (pnpm workspaces)
- [x] Shared types (`@fishlinic/types`)
- [x] NestJS backend (`:3000`) — 11 modules
- [x] TypeORM SQLite (dev) / Postgres (prod)
- [x] WebSocket gateway — `sensor:update`, `alert:new`, `fish:count`, `health:report`, `actuator:state`

### Hardware & sensors
- [x] Serial bridge (`:3001`) — parser, mock fallback, actuator routing
- [x] Arduino sensors reading pH / temp / DO / CO2
- [x] Feeder relay firing on command + schedule
- [x] Sensor simulator (disable with `SIMULATE_SENSORS=false`)

### AI
- [x] AI predictor (`:8001`) — FastAPI
- [x] Real `rf_quality.pkl` — `model.predict()` (not heuristic)
- [x] YOLO disease detection + fish counting
- [x] ConvLSTM-VAE model loaded
- [x] Veronica — Ollama `qwen2.5:3b`, full sensor context grounding
- [x] `/voice/query` backend proxy

### Mobile
- [x] Dashboard, Alerts, Controls+Management, Fish AI, Settings screens
- [x] Live sensor stream via Socket.IO
- [x] Veronica chat + voice (web Speech API)
- [x] Tank management CRUD (feeds, light, thresholds, cleaning)
- [x] Dynamic scheduler (60s tick)

### Dashboard
- [x] Skeleton pages — landing, dashboard, alerts, controls, fish-health, history, settings
- [x] NextAuth (Google + Credentials)

### Documentation
- [x] `docs/ai-llm-setup.md` — full Ollama + predictor setup guide
- [x] `docs/team-ownership.md` — sprint tasks per engineer
- [x] `docs/api-contracts.md`, `serial-protocol.md`, `operations.md`, `supabase-setup.md`

---

## Known constraints

- **`apps/mobile/package.json` pinned** — expo~54 + RN 0.81.5 + react 19.1.0.
  Do not upgrade. Breaks web build with white screen.
- Voice queries need 60s timeout (Ollama cold start).
- `synchronize: true` on TypeORM — Maral replacing with migrations.

## Ports

| Service | Port |
|---|---|
| Backend | 3000 |
| Serial bridge | 3001 |
| Dashboard | 3002 |
| AI predictor | 8001 |
| Mobile (Expo) | 8081 |
| Ollama | 11434 |

## After merge — order of operations

1. Sarvar + Maral push → Ismail merges into `develop`, resolves conflicts
2. Ismail finishes GPU detection + `/ready` on predictor
3. Set up Cloudflare tunnel → update URLs in `.env` files
4. `eas build` or Expo QR → phone testing with team
5. Add user auth (login screen + backend auth module)
6. Push notifications (CRITICAL alerts → phone buzz)
7. Demo on real tank 🎉
