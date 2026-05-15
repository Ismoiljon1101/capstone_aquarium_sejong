#!/bin/bash
echo "Starting Fishlinic Aquaculture System..."

# 1. Kill existing processes to prevent port conflicts
./stop_all.sh

ROOT_DIR=$(pwd)

# Create logs directory
mkdir -p "$ROOT_DIR/logs"

echo "----------------------------------------"

# 2. Start Ollama
echo "Starting Ollama..."
ollama serve > "$ROOT_DIR/logs/ollama.log" 2>&1 &

# Wait a bit for ollama to initialize
sleep 2

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

# 7. Start Mobile App
echo "Starting Mobile (Port 8081)..."
(cd apps/mobile && npx expo start) > "$ROOT_DIR/logs/mobile.log" 2>&1 &

# 8. Start Assistant
echo "Starting Assistant..."
(cd apps/assistant && pnpm dev) > "$ROOT_DIR/logs/assistant.log" 2>&1 &


echo "----------------------------------------"
echo "All services started!"
echo "Logs are available in the 'logs' directory (e.g., tail -f logs/backend.log)"
echo "To stop everything, run: ./stop_all.sh"
