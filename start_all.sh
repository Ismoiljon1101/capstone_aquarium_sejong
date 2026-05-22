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

echo "----------------------------------------"
echo "Cleaning caches and installing packages..."
rm -rf node_modules apps/mobile/node_modules apps/mobile/.expo
pnpm install
echo "Dependencies installed."
echo "----------------------------------------"

# Create logs directory
mkdir -p "$ROOT_DIR/logs"

echo "----------------------------------------"
echo "Environment Check:"
node -v | sed 's/^/Node: /'
pnpm -v | sed 's/^/pnpm: /'
python --version | sed 's/^/Python: /'
echo "----------------------------------------"

# 3. Start Backend
echo "Starting Backend (Port 3000)..."
(cd services/backend && pnpm dev) > "$ROOT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2
tail -n 5 "$ROOT_DIR/logs/backend.log" | sed 's/^/  [BACKEND] /'

# 4. Start AI Predictor
echo "Starting AI Predictor (Port 8000)..."
if [ -d "services/ai-predictor/venv" ]; then
    (cd services/ai-predictor && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000) > "$ROOT_DIR/logs/ai.log" 2>&1 &
else
    (cd services/ai-predictor && uvicorn main:app --host 0.0.0.0 --port 8000) > "$ROOT_DIR/logs/ai.log" 2>&1 &
fi
AI_PID=$!
sleep 2
tail -n 5 "$ROOT_DIR/logs/ai.log" | sed 's/^/  [AI] /'

# 5. Start Dashboard
echo "Starting Dashboard (Port 3005)..."
(cd apps/dashboard && pnpm dev -- -p 3005) > "$ROOT_DIR/logs/dashboard.log" 2>&1 &
DASH_PID=$!
sleep 2
tail -n 5 "$ROOT_DIR/logs/dashboard.log" | sed 's/^/  [DASHBOARD] /'

# 6. Start Serial Bridge
echo "Starting Serial Bridge (Port 3001)..."
(cd services/serial-bridge && pnpm dev) > "$ROOT_DIR/logs/bridge.log" 2>&1 &
BRIDGE_PID=$!
sleep 2
tail -n 5 "$ROOT_DIR/logs/bridge.log" | sed 's/^/  [BRIDGE] /'

echo "----------------------------------------"
echo "All background services started."
echo "Logs are actively writing to the ./logs directory."
echo "----------------------------------------"

# 7. Start Mobile App IN FOREGROUND so you can see the QR Code and use commands (r, i, a, w)
echo "Starting Mobile (Port 8081) in the foreground..."
cd apps/mobile && npx expo start -c
echo "All services exited!"
echo "To stop everything, run ./start_all.sh again (it kills old processes automatically)."
