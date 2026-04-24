# Dev Machine Requirements

Everything needed to run the full Fishlinic stack locally.

---

## Hardware

| Component | Minimum | Notes |
|-----------|---------|-------|
| RAM | 8 GB | 16 GB recommended — Ollama LLM takes ~2 GB |
| Disk | 15 GB free | Models (~3 GB) + node_modules (~3 GB) + Ollama model (~2 GB) |
| CPU | Any modern x64 | All ML models fall back to CPU |
| GPU | Optional | NVIDIA CUDA speeds up YOLO inference — not required |
| USB ports | 2 free | One per Arduino if running real hardware |
| OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Tested on Windows 11 |

---

## Software — required for everyone

### Node.js
- **Version**: 20+ (tested on v24.13.0)
- Install: [nodejs.org](https://nodejs.org) — LTS recommended
- Verify: `node --version`

### pnpm
- **Version**: 9+ (tested on 10.29.2)
- Install: `npm install -g pnpm`
- Verify: `pnpm --version`

### Python
- **Version**: 3.10+ (tested on 3.14.3)
- Install: [python.org/downloads](https://www.python.org/downloads/)
- Windows: tick **"Add Python to PATH"** during install
- Verify: `python --version`

### Ollama
- **Version**: 0.20+ (tested on 0.20.7)
- Install: [ollama.com/download](https://ollama.com/download)
- After install: `ollama pull qwen2.5:3b` (1.9 GB one-time download)
- Verify: `ollama list`

### Git
- Any recent version
- Verify: `git --version`

---

## Software — hardware only (Sarvar)

### Arduino IDE
- **Version**: 2.x
- Install: [arduino.cc/en/software](https://www.arduino.cc/en/software)
- Required libraries (install via Tools → Manage Libraries):
  - `RTClib` by Adafruit
  - `DS18B20`
  - `OneWire`
  - `Servo` (built-in)

---

## Python packages (AI predictor)

All pinned. Install once:

```bash
cd services/ai-predictor
pip install -r requirements.txt
```

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.135.3 | API framework |
| uvicorn | 0.44.0 | ASGI server |
| pydantic | 2.12.5 | Data validation |
| ultralytics | 8.4.36 | YOLO inference |
| torch | 2.11.0 | PyTorch (YOLO + VAE) |
| scikit-learn | 1.8.0 | Random Forest quality model |
| pandas | 3.0.2 | Data handling |
| numpy | 2.4.4 | Numerical ops |
| joblib | 1.5.3 | Model loading |
| opencv-python | 4.13.0.92 | Image processing |
| pillow | 12.2.0 | Image I/O |
| python-multipart | 0.0.24 | File uploads |

> **GPU users (NVIDIA CUDA):** replace `torch` with the CUDA build:
> ```bash
> pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cu121
> ```

---

## Node packages

Managed by pnpm workspaces. Install everything from repo root:

```bash
pnpm install
```

Key versions (do not change):

| Package | Version | Why pinned |
|---------|---------|-----------|
| expo | ~54.0.0 | Upgrading breaks web build |
| react-native | 0.81.5 | Tested stable with expo~54 |
| react | 19.1.0 | Must match react-native version |
| react-dom | 19.1.0 | Must match react version |
| next | 16.0.10 | Dashboard — pinned for Tailwind v3 compat |

**Never `npm install` or `yarn` in any workspace — always use `pnpm` from repo root.**

---

## Ports — all must be free

| Port | Service |
|------|---------|
| 3000 | NestJS backend |
| 3001 | Serial bridge |
| 3002 | Next.js dashboard |
| 8001 | AI predictor (FastAPI) |
| 8081 | Expo mobile (web) |
| 11434 | Ollama |

If any port is in use:

```powershell
# Windows — find and kill by port
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
Stop-Process -Id <PID> -Force
```

```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## First-time setup (full sequence)

```bash
# 1. Clone
git clone https://github.com/Ismoiljon1101/capstone_aquarium_sejong.git
cd capstone_aquarium_sejong
git checkout develop

# 2. Node deps
pnpm install

# 3. Python deps
cd services/ai-predictor
pip install -r requirements.txt
cd ../..

# 4. Ollama model (one-time, 1.9 GB)
ollama pull qwen2.5:3b

# 5. Backend env
cp services/backend/.env.example services/backend/.env
# Edit .env if needed (defaults work for local dev)

# 6. Verify models exist
ls resources/models/
# Must see: rf_quality.pkl  yolo_disease.pt  yolo_count.pt  convlstm_vae.pth

# 7. Start everything (5 terminals)
ollama serve                                                          # terminal 1
cd services/ai-predictor && uvicorn src.main:app --port 8001 --reload # terminal 2
cd services/backend && pnpm dev                                        # terminal 3
cd services/serial-bridge && pnpm dev                                  # terminal 4
cd apps/mobile && npx expo start --web                                 # terminal 5
```

Open `http://localhost:8081` — mobile app should load.

---

## Common setup errors

| Error | Fix |
|-------|-----|
| `pnpm: command not found` | `npm install -g pnpm` |
| `ollama: command not found` | Restart terminal after install |
| `Cannot find module 'expo'` | Run `pnpm install` from repo root, not from `apps/mobile` |
| White screen on Expo web | Versions in `apps/mobile/package.json` were changed — revert them |
| `rf_quality.pkl not found` | Run from repo root, not from `services/ai-predictor` |
| `EADDRINUSE :3000` | Another process on that port — kill it (see Ports section above) |
| `connection refused :11434` | `ollama serve` not running |
| Expo runs from wrong directory | Known issue with Claude preview tool — see `.claude/launch.json` |
