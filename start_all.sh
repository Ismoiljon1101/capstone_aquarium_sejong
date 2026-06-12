#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"

echo "Starting Fishlinic services..."

mkdir -p "$LOG_DIR"

kill_port() {
  _port="$1"
  if command -v lsof >/dev/null 2>&1; then
    _pids="$(lsof -nti :"$_port" 2>/dev/null || true)"
    if [ -n "$_pids" ]; then
      echo "Stopping port $_port: $_pids"
      kill -9 $_pids 2>/dev/null || true
    fi
  fi
}

for port in 3000 3001 8000 8081; do
  kill_port "$port"
done

# Kill assistant process since it doesn't bind to a port
assistant_pid=$(ps aux | grep "src/assistant.py" | grep -v grep | awk '{print $2}' || true)
if [ ! -z "$assistant_pid" ]; then
    echo "Killing assistant process (PID: $assistant_pid)..."
    kill -9 $assistant_pid
fi

echo "Installing workspace dependencies..."
cd "$ROOT_DIR"
pnpm install

echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "Python: $(python --version 2>&1)"

echo "Starting backend on :3000"
(cd "$ROOT_DIR/services/backend" && pnpm dev) > "$LOG_DIR/backend.log" 2>&1 &

echo "Starting AI predictor on :8000"
(cd "$ROOT_DIR/services/ai-predictor" && pnpm dev) > "$LOG_DIR/ai-predictor.log" 2>&1 &

echo "Starting serial bridge on :3001"
(cd "$ROOT_DIR/services/serial-bridge" && pnpm dev) > "$LOG_DIR/serial-bridge.log" 2>&1 &

sleep 4

echo "Recent backend log:"
tail -n 5 "$LOG_DIR/backend.log" || true
echo "Recent AI predictor log:"
tail -n 5 "$LOG_DIR/ai-predictor.log" || true
echo "Recent serial bridge log:"
tail -n 5 "$LOG_DIR/serial-bridge.log" || true

echo "Starting Expo on :8081"
cd "$ROOT_DIR/apps/mobile"
# Clear Metro cache to prevent path corruption issues on Windows/Mac
rm -rf .expo node_modules/.cache
npx expo start -c