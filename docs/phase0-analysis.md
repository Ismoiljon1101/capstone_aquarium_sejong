# Phase 0: Analysis Results

This document summarizes the current state of the repository prior to the monorepo reorganization.

## 1. File Inventory & Constraints

### Key Source Files (Mapped)
- **GUI Manager (Voice Assistant)**: `Video+Code/5-VirtualAssistant(Veronica)-tutorial/VirtualAssistant-code/virtual_assistant/gui_manager.py` (1360 lines)
- **Main Dashboard Page**: `Video+Code/6-Dashboard-tutorial/Dashboard-Code/app/dashboard/page.tsx` (624 lines)
- **Mock Server Entry**: `Video+Code/6-Dashboard-tutorial/Dashboard-Code/mock-server/index.ts` (509 lines)

### Flagged for Refactoring (> 300 Lines)
- [ ] `gui_manager.py` (1360 lines) -> Split into `BaseGui.py`, `AssetLoader.py`, `EventHandlers.py`.
- [ ] `dashboard/page.tsx` (624 lines) -> Split into Atomic Design components (Atoms, Molecules, Organisms).
- [ ] `mock-server/index.ts` (509 lines) -> Split into `serial.ts`, `parser.ts`, `emitter.ts`.

## 2. Environment Variables Mapped

Required for services:
- `DATABASE_URL`: Connection string for Postgres/Supabase.
- `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`: Authentication credentials.
- `AI_BASE_URL`: Pointer to AI services (FastAPI).
- `OLLAMA_URL`: Pointer to Ollama instance.
- `NEXT_PUBLIC_WS_URL`: WebSocket (Socket.IO) URL.
- `SERIAL_PATH`, `SERIAL_BAUD`: Hardware communication config.

## 3. Communication Contracts

### API Endpoints (Express/Mock)
- `GET /ports`: List available serial ports.
- `GET /history`: Fetch time-series sensor data.
- `GET /live`: Current telemetry snapshot.
- `GET /status`: Overall system health.
- `POST /feed`: Trigger manual feeding.
- `POST /schedule`: Manage feeding schedules.

### Socket.IO Events
- `serial:status` (In/Out): Status of hardware connections.
- `telemetry` (Out): Real-time sensor readings.
- `telemetry:update` (Out): Periodic telemetry refresh.
- `feeder:event` (Out): Logging and status of the feeder.

### MQTT Topics
- None currently active in the legacy code (implementation pending in Phase 3/4).

## 4. Hardware Bindings
- **Main Arduino**: pH, DO2, CO2 sensors.
- **Secondary Arduino**: Temperature sensor + Relays (Feeder, Pump, LED).
