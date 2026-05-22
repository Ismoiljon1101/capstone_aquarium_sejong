#!/bin/bash
echo "Starting Fishlinic Aquaculture System..."

echo "----------------------------------------"
echo "Stopping existing services..."

# Ports used by the project:
# 3000: Backend
# 3001: Serial Bridge
# 3005: Dashboard
# 8000: AI Predictor
# 8081: Mobile (Expo)
ports=(3000 3001 3005 8000 8081)

for port in "${ports[@]}"; do
    pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)..."
        kill -9 $pid
    fi
done

# Kill assistant process since it doesn't bind to a port
assistant_pid=$(ps aux | grep "src/assistant.py" | grep -v grep | awk '{print $2}')
if [ ! -z "$assistant_pid" ]; then
    echo "Killing assistant process (PID: $assistant_pid)..."
    kill -9 $assistant_pid
fi

echo "Existing services stopped."
echo "----------------------------------------"

ROOT_DIR=$(pwd)

# Create logs directory
mkdir -p "$ROOT_DIR/logs"

echo "----------------------------------------"
echo "Purging old node_modules and Expo cache..."
rm -rf node_modules apps/mobile/.expo apps/mobile/node_modules
echo "Installing packages..."
pnpm install
echo "----------------------------------------"

# 3. Start Backend
echo "Starting Backend (Port 3000)..."
(cd services/backend && pnpm dev) > "$ROOT_DIR/logs/backend.log" 2>&1 &

# 4. Start Serial Bridge
echo "Starting Serial Bridge (Port 3001)..."
(cd services/serial-bridge && pnpm dev) > "$ROOT_DIR/logs/serial-bridge.log" 2>&1 &

# 5. Start Dashboard
echo "Starting Dashboard (Port 3005)..."
(cd apps/dashboard && pnpm dev -- -p 3005) > "$ROOT_DIR/logs/dashboard.log" 2>&1 &

# 6. Start AI Predictor
echo "Starting AI Predictor (Port 8000)..."
(cd services/ai-predictor && pnpm dev) > "$ROOT_DIR/logs/ai-predictor.log" 2>&1 &

# 7. Start Mobile App (with -c to clear metro cache and fix white screen issues)
echo "Starting Mobile (Port 8081)..."
(cd apps/mobile && npx expo start -c) > "$ROOT_DIR/logs/mobile.log" 2>&1 &

# 8. Start Assistant
echo "Starting Assistant..."
(cd apps/assistant && pnpm dev) > "$ROOT_DIR/logs/assistant.log" 2>&1 &

echo "----------------------------------------"
echo "All services started!"
echo "Logs are available in the 'logs' directory (e.g., tail -f logs/backend.log)"
echo "To stop everything, run ./start_all.sh again (it kills old processes automatically)."
