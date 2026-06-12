#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
RUN_ID="$(date +%Y%m%d_%H%M%S)"
BACKEND_LOG="$LOG_DIR/backend_${RUN_ID}.log"
PREDICTOR_LOG="$LOG_DIR/ai-predictor_${RUN_ID}.log"
BRIDGE_LOG="$LOG_DIR/serial-bridge_${RUN_ID}.log"
DASHBOARD_LOG="$LOG_DIR/dashboard_${RUN_ID}.log"
EXPO_LOG="$LOG_DIR/expo_${RUN_ID}.log"

echo "Starting Fishlinic services..."

mkdir -p "$LOG_DIR"

kill_port() {
  local port="$1"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      \$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;
      foreach (\$listener in \$listeners) {
        try { Stop-Process -Id \$listener.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
      }
    " >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti :"$port" || true)"
    if [ -n "$pids" ]; then
      echo "Stopping port $port: $pids"
      kill -9 $pids || true
    fi
  elif command -v fuser >/dev/null 2>&1; then
    echo "Stopping port $port with fuser"
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  fi
}

kill_match() {
  local pattern="$1"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { \$_.CommandLine -like '*$pattern*' } |
      ForEach-Object {
        try { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
      }
    " >/dev/null 2>&1 || true
  elif command -v pkill >/dev/null 2>&1; then
    pkill -f "$pattern" >/dev/null 2>&1 || true
  fi
}

echo "Stopping old Fishlinic processes..."
# Correct ports: dashboard=3000, backend=3001, serial-bridge=3002, ai-predictor=8000, expo=8081
for port in 3000 3001 3002 8000 8081; do
  kill_port "$port"
done

kill_match "services/backend.*nest start"
kill_match "services/ai-predictor.*uvicorn"
kill_match "services/serial-bridge.*tsx src/index.ts"
kill_match "apps/dashboard.*next dev"
kill_match "apps/mobile.*expo start"
kill_match "metro"

sleep 2

echo "Installing workspace dependencies..."
cd "$ROOT_DIR"
pnpm install

echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "Python: $(python --version 2>&1)"

# ── Backend (NestJS) on :3001 ──────────────────────────────────────────────────
echo "Starting backend on :3001"
(cd "$ROOT_DIR/services/backend" && HOST=0.0.0.0 PORT=3001 pnpm dev) > "$BACKEND_LOG" 2>&1 &

# ── AI Predictor (FastAPI) on :8000 ───────────────────────────────────────────
echo "Starting AI predictor on :8000"
(cd "$ROOT_DIR/services/ai-predictor" && python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload) > "$PREDICTOR_LOG" 2>&1 &

# ── Serial Bridge on :3002 ────────────────────────────────────────────────────
echo "Starting serial bridge on :3002"
(cd "$ROOT_DIR/services/serial-bridge" && pnpm dev) > "$BRIDGE_LOG" 2>&1 &

# ── Dashboard (Next.js) on :3000 ──────────────────────────────────────────────
echo "Starting dashboard on :3000"
(cd "$ROOT_DIR/apps/dashboard" && npm run dev) > "$DASHBOARD_LOG" 2>&1 &

sleep 5

echo ""
echo "═══════════════════════════════════════════"
echo "  Fishlinic Services Started"
echo "═══════════════════════════════════════════"
echo "  Dashboard:     http://localhost:3000"
echo "  Backend:       http://localhost:3001"
echo "  Serial Bridge: http://localhost:3002"
echo "  AI Predictor:  http://localhost:8000"
echo "  Mobile (Expo): http://localhost:8081"
echo "═══════════════════════════════════════════"
echo ""

echo "Recent backend log:"
tail -n 5 "$BACKEND_LOG" || true
echo ""
echo "Recent AI predictor log:"
tail -n 5 "$PREDICTOR_LOG" || true
echo ""
echo "Recent serial bridge log:"
tail -n 5 "$BRIDGE_LOG" || true
echo ""
echo "Recent dashboard log:"
tail -n 5 "$DASHBOARD_LOG" || true

echo ""
echo "Logs:"
echo "  $BACKEND_LOG"
echo "  $PREDICTOR_LOG"
echo "  $BRIDGE_LOG"
echo "  $DASHBOARD_LOG"
echo "  $EXPO_LOG"

# ── Mobile (Expo) on :8081 — runs in foreground ───────────────────────────────
echo ""
echo "Starting Expo on :8081"
cd "$ROOT_DIR/apps/mobile"
EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start -c 2>&1 | tee "$EXPO_LOG"