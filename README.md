# Fishlinic — AI Smart Aquarium

> Autonomous AI-powered aquarium monitoring: live water chemistry,
> computer vision, voice assistant, real-time alerts.

**Status**: software stack working on simulated data. Hardware integration
sprint in progress — see `project_status.md` and `docs/team-ownership.md`.

---

## Team

| Name        | Role                          | Primary folders                                                             |
|-------------|-------------------------------|-----------------------------------------------------------------------------|
| Ismail      | Lead Architect / Backend / Mobile | `services/backend/`, `apps/mobile/`, `shared/types/`, `docs/`           |
| Maral       | Database Specialist           | `services/backend/src/modules/database/`, `migrations/`, Supabase           |
| Hamidullah  | Frontend / UI / Dashboard     | `apps/dashboard/`, atoms/molecules/organisms, mobile UI styling             |
| Firdavs     | AI Engineer                   | `services/ai-predictor/`, ML models in `resources/models/`                  |
| Sarvar      | Hardware Engineer             | `firmware/main/`, `firmware/secondary/`, `services/serial-bridge/`          |

Full task list per person: **[`docs/team-ownership.md`](docs/team-ownership.md)**.

---

## Folder structure

```
fishlinic/
├── apps/
│   ├── dashboard/          Next.js web dashboard (Hamidullah)
│   ├── mobile/             Expo SDK 54 + RN 0.81.5 app (Ismail)
│   └── assistant/          Veronica Python voice pipeline (Firdavs)
├── services/
│   ├── backend/            NestJS API (Ismail)
│   │   └── src/modules/    sensors, alerts, actuators, vision, voice,
│   │                       fish, cron, gateway, serial, management, database
│   ├── serial-bridge/      Node.js Arduino USB ↔ backend (Sarvar)
│   └── ai-predictor/       FastAPI: YOLO + RF + ConvLSTM-VAE (Firdavs)
├── firmware/
│   ├── main/               Arduino: pH, DO2, CO2 (Sarvar)
│   └── secondary/          Arduino: Temp + relay actuators (Sarvar)
├── shared/types/           Shared TypeScript types (everyone imports)
├── resources/models/       AI model files (.pt .pth .pkl)
└── docs/                   API contracts, serial protocol, ops, setup
```

---

## Service ports

| Service         | Port  | Notes                                  |
|-----------------|-------|----------------------------------------|
| Backend (NestJS)| 3000  | REST + Socket.IO gateway               |
| Serial bridge   | 3001  | Arduino USB; mock mode fallback        |
| Dashboard       | 3002  | Next.js                                |
| AI predictor    | 8001  | FastAPI                                |
| Mobile (Expo)   | 8081  | Web + device via Metro                 |
| Ollama          | 11434 | Veronica LLM (`qwen2.5:3b`)            |

---

## Getting started

```bash
# 1. Clone + install (from repo root)
git clone <repo>
cd capstone_aquarium_sejong
pnpm install

# 2. Backend (NestJS) — port 3000
cd services/backend
cp .env.example .env            # fill DATABASE_URL (SQLite works out of the box)
pnpm dev

# 3. Serial bridge — port 3001 (mock mode if no Arduino)
cd services/serial-bridge
cp .env.example .env
pnpm dev

# 4. AI predictor — port 8001
cd services/ai-predictor
pip install -r requirements.txt
uvicorn src.main:app --port 8001 --reload

# 5. Dashboard — port 3002
cd apps/dashboard
cp .env.example .env.local
pnpm dev

# 6. Mobile — port 8081
cd apps/mobile
npx expo start                  # press 'w' for web, or scan QR
```

### Running from the root (optional)

```bash
pnpm --filter @fishlinic/backend dev        # backend
pnpm --filter @fishlinic/serial-bridge dev  # bridge
pnpm --filter fishlinic-mobile dev          # mobile
pnpm --filter fishlinic-dashboard dev       # dashboard
```

---

## Data flow

```
Arduino (USB Serial JSON)
    │
    ▼
Serial Bridge :3001 ──POST /serial/reading──▶ NestJS Backend :3000
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                  AI Predictor :8001       Socket.IO gateway           Ollama :11434
                  (YOLO / RF / VAE)        (sensor:update, etc.)       (Veronica LLM)
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                  Dashboard :3002       Mobile App :8081
```

---

## Sensor thresholds

| Parameter    | Optimal      | Warning                  | Critical        |
|--------------|--------------|--------------------------|-----------------|
| pH           | 6.8 – 7.5    | 6.5–6.8 or 7.5–8.0       | < 6.5 or > 8.0  |
| Temperature  | 24 – 28 °C   | 22–24 or 28–30 °C        | < 22 or > 30 °C |
| Dissolved O₂ | 6 – 9 mg/L   | 4 – 6 mg/L               | < 4 mg/L        |

Thresholds are editable via `/management/tank-config` (mobile Controls + dashboard Settings).

---

## AI models

| Model          | File                  | Purpose                          | Runs on |
|----------------|-----------------------|----------------------------------|---------|
| YOLOv8/v11     | `yolo_disease.pt`     | Fish disease detection           | GPU/CPU |
| YOLOv8/v11     | `yolo_count.pt`       | Fish counting                    | GPU/CPU |
| ConvLSTM-VAE   | `convlstm_vae.pth`    | Behavior / anomaly detection     | GPU/CPU |
| Random Forest  | `rf_quality.pkl`      | Water quality score              | CPU     |
| Qwen2.5:3b     | via Ollama            | Veronica LLM brain               | GPU/CPU |

All under `resources/models/`. Predictor auto-detects device.

---

## Dynamic scheduler

The backend runs a single **60-second tick** (`services/backend/src/modules/cron/`)
that does all time-based work — no separate cron jobs.

Each tick:
1. Evaluates every enabled feed schedule → fires feeder relay if time matches.
2. Evaluates the light schedule window → toggles LED relay if state should change.
3. Reads latest sensors → creates CRITICAL alert if past emergency thresholds.
4. Checks cleaning interval → creates reminder alert if overdue.

Details: **[`docs/operations.md`](docs/operations.md)**.

---

## Socket events

| Event             | Direction      | Payload                         |
|-------------------|----------------|---------------------------------|
| `sensor:update`   | server → client| `SensorReading`                 |
| `alert:new`       | server → client| `Alert`                         |
| `fish:count`      | server → client| `FishCount`                     |
| `actuator:state`  | server → client| `{ type, state }`               |
| `health:report`   | server → client| `FishHealthReport`              |
| `command:feed`    | client → server| trigger feeder                  |
| `command:pump`    | client → server| `{ state: boolean }`            |
| `command:led`     | client → server| `{ state: boolean }`            |

Full contracts: **[`docs/api-contracts.md`](docs/api-contracts.md)**.

---

## Environment variables

Each service has its own `.env.example`. Copy it to `.env` and fill in.
**Never commit a real `.env`.**

| Service                  | Key variables                                                    |
|--------------------------|------------------------------------------------------------------|
| `services/backend`       | `DATABASE_URL`, `AI_PREDICTOR_URL`, `OLLAMA_URL`, `OLLAMA_MODEL`, `SIMULATE_SENSORS` |
| `services/serial-bridge` | `SERIAL_PORT`, `BAUD_RATE`, `BACKEND_URL`, `MOCK_MODE`           |
| `services/ai-predictor`  | `MODEL_PATH`, `PORT`                                             |
| `apps/dashboard`         | `NEXT_PUBLIC_SOCKET_URL`, `BACKEND_URL`, `NEXTAUTH_SECRET`       |
| `apps/mobile`            | `API_URL`, `WS_URL`                                              |
| `apps/assistant`         | `BACKEND_URL`, `OLLAMA_URL`, `OLLAMA_MODEL`, `WAKE_WORD`         |

---

## Rules

- **Never upgrade `apps/mobile/package.json` versions.** expo~54 + RN 0.81.5 +
  react 19.1.0 is pinned. Upgrading breaks the web build. See `_versionNote`.
- **Never commit `.env`** — only `.env.example`.
- **Shared TS types** live only in `shared/types/`. No duplication.
- **Max 300 lines per file** (GEMINI Rule 3) — split if over.
- **Atomic Design** in `apps/mobile/` and `apps/dashboard/`:
  atoms → molecules → organisms → screens.
- **Branch per task**, PR into `develop`. No direct pushes.
- **Ports are fixed** (see table above) — don't change without updating all clients.

---

## Who to ask

| Question                          | Ask        |
|-----------------------------------|------------|
| Backend API / architecture        | Ismail     |
| Database schema / migration       | Maral      |
| Dashboard UI / mobile styling     | Hamidullah |
| AI model / voice pipeline         | Firdavs    |
| Arduino / serial data / wiring    | Sarvar     |
