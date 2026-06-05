#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"

echo "Starting Fishlinic services..."

mkdir -p "$LOG_DIR"

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti :"$port" || true)"
    if [ -n "$pids" ]; then
      echo "Stopping port $port: $pids"
      kill -9 $pids || true
    fi
  fi
}

for port in 3000 3001 3005 8000 8081; do
  kill_port "$port"
done

# Kill assistant process since it doesn't bind to a port
assistant_pid=$(ps aux | grep "src/assistant.py" | grep -v grep | awk '{print $2}')
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

echo "Starting dashboard on :3005"
(cd "$ROOT_DIR/apps/dashboard" && pnpm dev -- -p 3005) > "$LOG_DIR/dashboard.log" 2>&1 &

sleep 4

echo "Recent backend log:"
tail -n 5 "$LOG_DIR/backend.log" || true
echo "Recent AI predictor log:"
tail -n 5 "$LOG_DIR/ai-predictor.log" || true
echo "Recent serial bridge log:"
tail -n 5 "$LOG_DIR/serial-bridge.log" || true
echo "Recent dashboard log:"
tail -n 5 "$LOG_DIR/dashboard.log" || true

echo "Starting Expo on :8081"
cd "$ROOT_DIR/apps/mobile"
npx expo start -c