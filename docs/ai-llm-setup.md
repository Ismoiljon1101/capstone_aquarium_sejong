# AI & LLM Setup Guide

_Owner: Firdavs — read this before touching `services/ai-predictor/`_

All ML model files are already in the repo under `resources/models/`.
You do NOT need to train anything. You only need to install the runtime
software and pull the LLM.

---

## What you are setting up

| Component | What it does | Port | Tech |
|-----------|-------------|------|------|
| AI Predictor | YOLO disease + count, Random Forest quality score | 8001 | FastAPI + Python |
| Ollama | Runs Veronica LLM locally | 11434 | Ollama binary |
| `gemma3:4b` | Veronica's brain — answers fish health questions | via Ollama | LLM model |

---

## Step 1 — Install Python (if not installed)

Requires **Python 3.10+**.

```bash
python --version   # must be 3.10 or higher
```

If missing: download from [python.org/downloads](https://www.python.org/downloads/).
On Windows, tick **"Add Python to PATH"** during install.

---

## Step 2 — Install AI Predictor dependencies

From the repo root:

```bash
cd services/ai-predictor
pip install -r requirements.txt
```

This installs: `fastapi`, `uvicorn`, `torch`, `ultralytics` (YOLO),
`scikit-learn`, `joblib`, `pandas`, `numpy`, `python-multipart`.

> **GPU users (NVIDIA)**: install the CUDA version of PyTorch for faster inference:
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
> ```
> CPU works fine too — just slower on YOLO. RF quality model always runs on CPU.

---

## Step 3 — Verify ML models are present

```bash
ls resources/models/
```

You must see all of these:

```
rf_quality.pkl          ← Random Forest water quality scorer
yolo_disease.pt         ← YOLO disease detection
yolo_count.pt           ← YOLO fish counting
convlstm_vae.pth        ← ConvLSTM-VAE anomaly detection (behavior)
```

They are already committed to the repo — no download needed.
If any are missing, ask Firdavs.

---

## Step 4 — Start the AI Predictor

From the repo root:

```bash
cd services/ai-predictor
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload
```

Verify it started:

```
open http://localhost:8001/health
# should return: {"status": "ok"}
```

Check model load output in the terminal — you should see:

```
Quality model loaded from .../resources/models/rf_quality.pkl
```

If a model fails to load, it logs a warning but keeps running — other
routes still work (graceful degradation). Fix the missing model separately.

---

## Step 5 — Install Ollama

Ollama runs the `gemma3:4b` LLM that powers Veronica.

### Windows
Download and run the installer:
[https://ollama.com/download](https://ollama.com/download)

After install, `ollama` will be in your PATH.

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify:
```bash
ollama --version
```

---

## Step 6 — Pull the LLM model

**This is a one-time download (~1.9 GB). Do it once, it stays on disk.**

```bash
ollama pull gemma3:4b
```

Wait for it to finish. Check it saved:
```bash
ollama list
# should show: gemma3:4b   357c53fb659c   1.9 GB
```

> The repo also uses `qwen2.5-coder:7b` (4.7 GB) for extended sessions.
> You only **need** `gemma3:4b` for Veronica to work.

---

## Step 7 — Run Ollama

Ollama must be running in the background for Veronica to respond.

```bash
ollama serve
```

Keep this terminal open (or run it as a background service).
It listens on `http://localhost:11434`.

Test it:
```bash
curl http://localhost:11434/api/tags
# should list your pulled models
```

---

## Step 8 — Configure backend .env

In `services/backend/.env` make sure these are set:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
PREDICTOR_URL=http://localhost:8001
```

These are already in `.env.example` — copy it if you haven't:
```bash
cp services/backend/.env.example services/backend/.env
```

---

## Full startup order (for Firdavs's stack)

Run in this order — each in its own terminal:

```bash
# Terminal 1 — Ollama (LLM runtime)
ollama serve

# Terminal 2 — AI Predictor (YOLO + RF + VAE)
cd services/ai-predictor
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3 — Backend (needs predictor + Ollama to be up first)
cd services/backend
pnpm dev
```

---

## Verify the full AI pipeline works

### 1. Quality prediction (Random Forest)
```bash
curl -X POST http://localhost:8001/predict/quality \
  -H "Content-Type: application/json" \
  -d '{"pH": 7.2, "temp_c": 26.0, "do_mg_l": 7.5}'
# expected: {"score": <float>, "status": "ok"|"warn"|"critical"}
```

### 2. Veronica (LLM via backend)
```bash
curl -X POST http://localhost:3000/voice/query \
  -H "Content-Type: application/json" \
  -d '{"text": "How is the tank doing?"}'
# expected: {"response": "..."}  (may take 5–10s on first call — Ollama cold start)
```

### 3. Disease detection (YOLO)
```bash
curl -X POST http://localhost:8001/predict/disease \
  -H "Content-Type: application/json" \
  -d '{"imagePath": "resources/media/test_fish.jpg"}'
```

### 4. Health check
```bash
curl http://localhost:8001/health
curl http://localhost:3000/health
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ollama: command not found` | Restart terminal after install, or add to PATH |
| `connection refused :11434` | Run `ollama serve` first |
| `model not found: gemma3:4b` | Run `ollama pull gemma3:4b` |
| `Quality model not loaded` | Check `resources/models/rf_quality.pkl` exists |
| YOLO slow on CPU | Normal — first inference loads model. Subsequent calls faster. |
| Veronica no response | Check Ollama is running + `OLLAMA_MODEL=gemma3:4b` in `.env` |
| `torch` install fails | Use `pip install torch --index-url https://download.pytorch.org/whl/cpu` |

---

## Model file locations

```
resources/
└── models/
    ├── rf_quality.pkl          Water quality Random Forest (CPU)
    ├── yolo_disease.pt         Disease detection YOLO (GPU preferred)
    ├── yolo_count.pt           Fish count YOLO (GPU preferred)
    ├── convlstm_vae.pth        Behavior anomaly ConvLSTM-VAE
    └── convlstm_vae_trained.pth  (trained variant — used by Firdavs's route)
```

The predictor auto-resolves paths from the repo root via
`MODEL_PATH` env var (defaults to `resources/models/` relative to root).
No manual path config needed if running from repo root.

---

## Environment variables (AI-related)

| Variable | Default | Service |
|----------|---------|---------|
| `OLLAMA_URL` | `http://localhost:11434` | backend |
| `OLLAMA_MODEL` | `gemma3:4b` | backend |
| `PREDICTOR_URL` | `http://localhost:8001` | backend |
| `MODEL_PATH` | `resources/models` | ai-predictor |
