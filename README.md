# Fishlinic — AI Smart Aquarium

> Autonomous AI-powered aquarium monitoring: live water chemistry,
> computer vision, voice assistant, real-time alerts.

**Status**: software stack working on simulated data. Hardware integration
sprint in progress — see `project_status.md` and `docs/team-ownership.md`.

---

## Team

| Name        | Role                          | Primary folders                                                             |
|-------------|-------------------------------|-----------------------------------------------------------------------------|
| Ismail      | Lead Architect / Backend / Mobile/ Frontend / UI / Dashboard/ AI agent| `services/backend/`, `apps/mobile/`, `shared/types/`, `docs/`,`apps/dashboard/`, atoms/molecules/organisms, mobile UI styling           |
| Maral       | Database Specialist           | `services/backend/src/modules/database/`, `migrations/`, Supabase           |
| Firdavs     | AI Engineer                   | `services/ai-predictor/`, ML models in `resources/models/`                  |
| Sarvar      | Hardware Engineer             | `firmware/main/`, `firmware/secondary/`, `services/serial-bridge/`          |

Full task list per person: **[`docs/team-ownership.md`](docs/team-ownership.md)**.

---

## Folder Structure

```
capstone_aquarium_sejong/
├── apps/
│   ├── dashboard/          Next.js web dashboard (:3000)
│   ├── mobile/             Expo React Native app (:8081)
│   └── assistant/          Veronica Python voice pipeline
├── services/
│   ├── backend/            NestJS API (:3001)
│   ├── serial-bridge/      Arduino ↔ backend bridge (:3002)
│   └── ai-predictor/       FastAPI AI service (:8000)
├── models/
│   ├── disease/            yolo_disease.pt, yolo11n.pt, latest.pt
│   ├── behavior/           best_model.pth, behavior_random_forest.pkl
│   ├── quality/            best_rf_water_quality.pkl
│   └── anomaly/            convlstm_vae_anomaly.pth
├── firmware/
│   └── arduino/            Arduino .ino files
├── data/                   Training videos and datasets
├── docs/                   Documentation and architecture
├── shared/types/           Shared TypeScript types
└── scripts/archive/        Old training scripts (reference only)
```

---
## Service Ports

| Service              | Port  | Notes                        |
|----------------------|-------|------------------------------|
| Next.js Dashboard    | 3000  | Web UI                       |
| NestJS Backend       | 3001  | REST + Socket.IO             |
| Serial Bridge        | 3002  | Arduino USB bridge           |
| FastAPI AI Predictor | 8000  | All AI model endpoints       |
| Expo Mobile          | 8081  | React Native app             |

---
## Getting Started

```bash
# 1. Clone + install
git clone https://github.com/Ismoiljon1101/capstone_aquarium_sejong.git
cd capstone_aquarium_sejong
pnpm install

# 2. NestJS Backend — port 3001
cd services/backend
cp .env.example .env
$env:PORT=3001; pnpm dev

# 3. FastAPI AI Predictor — port 8000
cd services/ai-predictor
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000

# 4. Next.js Dashboard — port 3000
cd apps/dashboard
cp .env.example .env.local
# Fill in NEXTAUTH_SECRET and other vars
npm run dev
```

---

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
## Sensor Thresholds

| Parameter    | Optimal      | Warning            | Critical        |
|--------------|--------------|--------------------|-----------------|
| pH           | 6.8 – 7.5    | 6.5–6.8 / 7.5–8.0  | < 6.5 or > 8.0  |
| Temperature  | 24 – 28 °C   | 22–24 / 28–30 °C   | < 22 or > 30 °C |
| Dissolved O₂ | 6 – 9 mg/L   | 4 – 6 mg/L         | < 4 mg/L        |

---

## AI Models

| Model         | File                          | Purpose                      |
|---------------|-------------------------------|------------------------------|
| YOLOv11       | `models/disease/yolo_disease.pt` | Fish disease detection    |
| YOLOv11       | `models/disease/yolo11n.pt`   | Fish detection/attitude      |
| R3D-18        | `models/behavior/best_model.pth` | Behavior classification   |
| Random Forest | `models/quality/best_rf_water_quality.pkl` | Water quality  |
| ConvLSTM-VAE  | `models/anomaly/convlstm_vae_anomaly.pth` | Anomaly detection |

---

## API Endpoints (FastAPI :8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/quality` | POST | Water quality prediction |
| `/predict/disease` | POST | Disease detection (image) |
| `/predict/disease/video` | POST | Disease detection (video) |
| `/predict/attitude` | POST | Fish attitude analysis |
| `/predict/behavior` | POST | Behavior classification |
| `/predict/movement` | POST | Movement tracking |
| `/predict/count` | POST | Fish counting |
| `/quality/history` | GET | Water quality history |
| `/quality/alerts` | GET | Water quality alerts |
| `/quality/stats` | GET | Water quality stats |
| `/disease/history` | GET | Disease detection history |
| `/disease/alerts` | GET | Disease alerts |
| `/disease/stats` | GET | Disease stats |
| `/attitude/history` | GET | Attitude history |
| `/attitude/alerts` | GET | Attitude alerts |
| `/health` | GET | Service health check |

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

## Environment Variables

| Service | Key Variables |
|---------|---------------|
| `services/backend` | `DATABASE_URL`, `AI_PREDICTOR_URL`, `PORT` |
| `services/serial-bridge` | `SERIAL_PORT`, `BACKEND_URL`, `MOCK_MODE` |
| `apps/dashboard` | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_AI_URL`, `BACKEND_URL` |

**Never commit `.env`** — only `.env.example`.

---


## Detailed setup guides

| Guide | What it covers |
|-------|---------------|
| **[`docs/ai-llm-setup.md`](docs/ai-llm-setup.md)** | Install Ollama, pull `qwen2.5:3b`, start AI Predictor, verify pipeline |
| **[`docs/operations.md`](docs/operations.md)** | Dynamic scheduler, sensor simulator, DB config |
| **[`docs/supabase-setup.md`](docs/supabase-setup.md)** | Production DB wiring |
| **[`docs/serial-protocol.md`](docs/serial-protocol.md)** | Arduino ↔ bridge packet format |
| **[`docs/api-contracts.md`](docs/api-contracts.md)** | All REST + Socket.IO contracts |
| **[`docs/team-ownership.md`](docs/team-ownership.md)** | Who owns what + current sprint tasks |

---


## Rules

- **Never upgrade `apps/mobile` versions** — expo~54 + RN 0.81.5 + react 19.1.0 is pinned.
- **Never commit `.env`** — only `.env.example`.
- **Shared TS types** live only in `shared/types/`.
- **Atomic Design** in dashboard: atoms → molecules → organisms.
- **All models** live in `models/` — never scatter them in `docs/` or `resources/`.
