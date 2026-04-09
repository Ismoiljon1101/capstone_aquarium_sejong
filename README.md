# 🐟 Fishlinic — AI Smart Aquarium System

> Autonomous, fully offline AI-powered aquarium fish health monitoring system.
> Combines live water chemistry telemetry, computer vision, and a voice assistant.

---

## 👥 Team

| Name | Role | Owns |
|---|---|---|
| **Ismail** | Backend Lead & Architect | `services/backend/` |
| **Maral** | Database Engineer | `services/backend/src/modules/database/` |
| **Hamidullo** | Frontend Engineer | `apps/dashboard/` · `apps/mobile/` |
| **Firdavs** | AI & Voice Engineer | `services/ai-predictor/` · `apps/assistant/` |
| **Sarvar** | Hardware & IoT Engineer | `firmware/` · `services/serial-bridge/` |

---

## 📁 Folder Structure

```
fishlinic/
│
├── apps/
│   ├── dashboard/          ← Next.js 15 web dashboard (Hamidullo)
│   ├── mobile/             ← React Native mobile app (Hamidullo)
│   └── assistant/          ← Veronica voice assistant Python app (Firdavs)
│
├── services/
│   ├── backend/            ← NestJS backend API (Ismail)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── serial/         ← Receives Arduino data
│   │       │   ├── sensors/        ← pH, Temp, DO2 logic
│   │       │   ├── actuators/      ← Feeder, pump, LED control
│   │       │   ├── alerts/         ← Threshold alerts & emergency
│   │       │   ├── vision/         ← Calls AI predictor
│   │       │   ├── voice/          ← Calls Ollama LLM
│   │       │   ├── fish/           ← Fish count, growth, health
│   │       │   ├── cron/           ← 24/7 scheduled jobs
│   │       │   ├── gateway/        ← Socket.IO real-time events
│   │       │   └── database/       ← TypeORM entities (Maral)
│   │       └── app.module.ts
│   │
│   ├── serial-bridge/      ← Node.js: Arduino USB → NestJS (Sarvar)
│   └── ai-predictor/       ← FastAPI: YOLO + RF + ConvLSTM (Firdavs)
│
├── firmware/
│   ├── main/               ← Arduino: pH, DO2, CO2 sensors (Sarvar)
│   └── secondary/          ← Arduino: Temp + relay actuators (Sarvar)
│
├── shared/
│   └── types/              ← Shared TypeScript types (everyone imports from here)
│
├── resources/
│   └── models/             ← AI model files: yolo_disease.pt, rf_quality.pkl, convlstm_vae.pt
│
└── docs/
    ├── api-contracts.md    ← All API endpoints & Socket.IO events
    ├── team-handoff.md     ← Setup instructions per person
    ├── ER-diagram.html     ← Database entity relationships
    └── architecture.html   ← Full system architecture diagram
```

---

## 🚀 Startup Order

Run services in this exact order:

```bash
# 1. Backend (Ismail)
cd services/backend
pnpm install
cp .env.example .env        # fill in DATABASE_URL from Maral
pnpm start:dev              # runs on port 3000

# 2. Serial Bridge (Sarvar)
cd services/serial-bridge
pnpm install
cp .env.example .env
MOCK_MODE=true pnpm start   # runs on port 3001 — no Arduino needed in dev

# 3. AI Predictor (Firdavs)
cd services/ai-predictor
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --port 8000 --reload

# 4. Web Dashboard (Hamidullo)
cd apps/dashboard
pnpm install
cp .env.example .env.local
pnpm dev                    # runs on port 3002

# 5. Voice Assistant (Firdavs)
cd apps/assistant
pip install -r requirements.txt
cp .env.example .env
python src/pipeline.py

# 6. Mobile App (Hamidullo) — optional
cd apps/mobile
pnpm install
cp .env.example .env
npx expo start
```

---

## 🔌 How Services Talk to Each Other

```
Arduino (USB Serial JSON)
    ↓
Serial Bridge :3001  ──POST /serial/reading──▶  NestJS Backend :3000
                                                        │
                                        ┌───────────────┼───────────────┐
                                        ↓               ↓               ↓
                                 FastAPI AI :8000   Socket.IO      Ollama :11434
                                 (YOLO/RF/VAE)      (live push)    (Gemma/Qwen)
                                                        │
                                              ┌─────────┴─────────┐
                                              ↓                   ↓
                                       Dashboard :3002      Mobile App
                                       (Next.js)            (Expo)
                                              ↑
                                       Voice Assistant
                                       (Veronica Python)
```

---

## 🌊 Sensor Thresholds

| Parameter | Optimal | Warning | Critical |
|---|---|---|---|
| pH | 6.8 – 7.5 | 6.5 – 6.8 or 7.5 – 8.0 | < 6.5 or > 8.0 |
| Temperature | 24 – 28 °C | 22 – 24 or 28 – 30 °C | < 22 or > 30 °C |
| Dissolved O₂ | 6 – 9 mg/L | 4 – 6 mg/L | < 4 mg/L |

---

## 🤖 AI Models

| Model | File | Purpose | Runs on |
|---|---|---|---|
| YOLOv8/v11 | `yolo_disease.pt` | Fish disease detection + counting | GPU |
| ConvLSTM-VAE | `convlstm_vae.pt` | Behavior anomaly detection | GPU |
| Random Forest | `rf_quality.pkl` | Water quality score | CPU |
| Qwen2.5 / Gemma 4 | via Ollama | Veronica LLM brain | GPU |
| Whisper | via faster-whisper | Speech to text | CPU |
| Kokoro-82M | via kokoro-onnx | Text to speech | CPU |
| openWakeWord | via openwakeword | Wake word detection | CPU |

---

## ⏰ Cron Jobs (24/7 Automated Tasks)

| Schedule | Job | What it does |
|---|---|---|
| Every 1 min | Threshold check | Reads latest sensors, fires alert if bad |
| Every 5 min | Vision analysis | Camera snapshot → YOLO + behavior check |
| Every 8 hrs | Auto feed | Triggers feeder relay |
| Every 6am | Daily health report | Full AI analysis + saves report |
| Every 7am | Fish growth monitor | Compares today vs yesterday snapshots |
| Every 30 min | Emergency check | Extreme threshold → emergency shutoff |
| Every Sunday | Weekly export | Generates JSONL telemetry archive |

---

## 🔑 Environment Variables

Each service has a `.env.example` — copy it to `.env` and fill in the values.
**Never commit a real `.env` file. Ever.**

| Service | Key Variables |
|---|---|
| `services/backend` | `DATABASE_URL`, `AI_PREDICTOR_URL`, `OLLAMA_URL`, `OLLAMA_MODEL` |
| `services/serial-bridge` | `SERIAL_PORT`, `BAUD_RATE`, `BACKEND_URL`, `MOCK_MODE` |
| `services/ai-predictor` | `MODEL_PATH`, `PORT` |
| `apps/dashboard` | `NEXT_PUBLIC_SOCKET_URL`, `BACKEND_URL`, `NEXTAUTH_SECRET` |
| `apps/assistant` | `BACKEND_URL`, `OLLAMA_URL`, `OLLAMA_MODEL`, `WAKE_WORD` |
| `apps/mobile` | `API_URL`, `WS_URL` |

---

## 📋 Rules — Read Before Writing Any Code

- **Never commit `.env`** — only `.env.example` goes to git
- **All shared TypeScript types** live in `shared/types/` — never duplicate them in your own folder
- **Max 300 lines per file** — split into smaller files if you go over
- **Never touch another person's folder** without telling them first
- **All API questions** → read `docs/api-contracts.md` before asking
- **All setup questions** → read `docs/team-handoff.md` before asking
- **Architecture decisions** → Ismail makes the final call

---

## 📞 Who to Ask

| Question | Ask |
|---|---|
| Backend API not working | Ismail |
| Database schema / migration | Maral |
| Dashboard UI / mobile | Hamidullo |
| AI model / voice pipeline | Firdavs |
| Arduino / serial data | Sarvar |
| Architecture / repo structure | Ismail |
