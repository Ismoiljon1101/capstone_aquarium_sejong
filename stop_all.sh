#!/bin/bash
echo "Stopping all services..."

# Ports used by the project:
# 3000: Backend
# 3001: Serial Bridge
# 3005: Dashboard
# 8000: AI Predictor
# 8081: Mobile (Expo)
# 11434: Ollama
ports=(3000 3001 3005 8000 8081 11434)

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

echo "All services stopped."
