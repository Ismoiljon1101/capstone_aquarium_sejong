# Fishlinic — Agent Working List

_Last updated: 2026-04-17_

> This is the live task list for the AI agent.
> Read `project_status.md` for full context.
> Read `docs/team-ownership.md` for per-engineer sprint details.

---

## Current phase: waiting for team pushes → merge → ship

### BLOCKER — waiting on teammates

| Person | Branch | Push status |
|---|---|---|
| Sarvar | `feat/sarvar-hardware` | Not pushed yet |
| Maral | `feat/maral-db-dashboard` | Not pushed yet |

**Do not merge until Ismail (user) confirms hardware checklist below.**

---

## Task list (in order)

### STEP 1 — When Sarvar pushes (Ismail confirms first)

Ismail must physically verify ALL of these before agent merges:

- [ ] Real pH/temp/DO/CO2 live on mobile Dashboard (`SIMULATE_SENSORS=false`)
- [ ] No serial parser errors in bridge logs
- [ ] Secondary Arduino sensors in `/sensors/latest`
- [ ] Feeder fires on scheduled time (relay clicks)
- [ ] Feeder fires on manual tap (Controls screen)
- [ ] LED toggles on light schedule window
- [ ] CRITICAL alert fires when sensor crosses emergency threshold
- [ ] Cleaning reminder alert fires after interval exceeded
- [ ] `curl localhost:3000/health` → 200
- [ ] `curl localhost:3001/health` → 200
- [ ] `POST /management/tank-config` with tankId=2 — no crash

**Only after Ismail says "confirmed" → merge `feat/sarvar-hardware` → `develop`.**

### STEP 2 — When Maral pushes

Agent verifies:
- [ ] `pnpm migration:run` applies schema on fresh SQLite/Postgres cleanly
- [ ] No `EntityMetadataNotFoundError` on backend startup
- [ ] Fresh DB has default tank config row (id=1) from seed
- [ ] Backend connects to Supabase with `DATABASE_URL` set
- [ ] Dashboard camera / growth / alerts pages render without errors

**Merge `feat/maral-db-dashboard` → `develop`.**

### STEP 3 — Conflict resolution

After both branches merged:
- [ ] Run `pnpm install` from root
- [ ] Run backend — no startup errors
- [ ] Run mobile — Dashboard loads, sensor stream active
- [ ] Fix any merge conflicts in `database.module.ts`, `app.module.ts`, entity files

### STEP 4 — Finish Firdavs remainder (agent does this)

Two items left — Ismail already did the rest:

**4a. GPU detection in `services/ai-predictor/src/main.py`**
- [ ] On startup log: `device: cuda` or `device: cpu`
- [ ] All model loaders pass device to torch

**4b. `/ready` endpoint in `services/ai-predictor/src/main.py`**
- [ ] Returns per-model load status:
  ```json
  {
    "rf_quality": true,
    "yolo_disease": true,
    "yolo_count": true,
    "convlstm_vae": false
  }
  ```
- [ ] Mobile Settings screen AI Predictor badge reads from this

### STEP 5 — User auth (not started)

- [ ] Backend: `POST /auth/register` — create user, hash password (bcrypt)
- [ ] Backend: `POST /auth/login` — return JWT token
- [ ] Backend: JWT guard on protected routes
- [ ] Mobile: `LoginScreen.tsx` — email + password form
- [ ] Mobile: store JWT in `AsyncStorage` / `expo-secure-store`
- [ ] Mobile: `AppNavigator` checks token → redirect to login if missing
- [ ] Mobile: attach token to all API calls (`Authorization: Bearer <token>`)

### STEP 6 — Cloudflare tunnel + domain

- [ ] Install cloudflared: `winget install Cloudflare.cloudflared`
- [ ] `cloudflared tunnel login`
- [ ] `cloudflared tunnel create fishlinic`
- [ ] Expose backend: `cloudflared tunnel --url http://localhost:3000`
- [ ] Point domain DNS CNAME → tunnel
- [ ] Update `services/backend/.env`: `PUBLIC_URL=https://yourdomain.com`
- [ ] Update `apps/mobile/.env`: `API_URL=https://yourdomain.com`, `WS_URL=wss://yourdomain.com`
- [ ] Update `apps/dashboard/.env.local`: `NEXT_PUBLIC_SOCKET_URL=wss://yourdomain.com`
- [ ] Test from phone on mobile data (not local WiFi)

### STEP 7 — Phone testing

- [ ] `npx expo start` → team scans QR on same WiFi
- [ ] OR `eas build --platform android` → APK to team
- [ ] Verify sensor stream live on real phones
- [ ] Verify Veronica responds on phone
- [ ] Verify CRITICAL alert appears on phone
- [ ] Verify feeder fires from phone Controls tap

### STEP 8 — Push notifications (before demo)

- [ ] `apps/mobile/src/hooks/usePushToken.ts` — register Expo push token
- [ ] Save token via `PATCH /management/tank-config`
- [ ] `services/backend/src/modules/alerts/push.service.ts` — send push on CRITICAL alert
- [ ] Test: trigger emergency threshold → phone buzzes

---

## Nice to have (if time)

- [ ] `requirements.txt` — pin all versions (`fastapi==x.x.x`, etc.)
- [ ] Remove `SimpleGame.tsx` from dashboard
- [ ] At least unit test sensor threshold logic
- [ ] `loading.tsx` + `error.tsx` on dashboard routes
- [ ] Dashboard camera / YOLO bounding boxes page (Hamidullah)

---

## Constraints — never break these

- `apps/mobile/package.json` versions **pinned** — expo~54 + RN 0.81.5 + react 19.1.0
- Never commit real `.env` — only `.env.example`
- Max 300 lines per file
- Branch per task, PR into `develop`
- Shared types only in `shared/types/`
