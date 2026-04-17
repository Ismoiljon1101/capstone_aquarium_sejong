# FISHLINIC — AGENT TASK LIST
> Full repo reorganization + file scaffolding
> Based on: technical spec, feature inventory, team structure, architecture decisions
> Team: Ismail (BE lead), Maral (DB), Hamidullo (Dashboard), Firdavs (AI), Sarvar (Hardware)

---

## ⚠️ RULES BEFORE YOU START
- Max 300 lines per file (GEMINI Rule 3)
- Never delete existing working code — move it, don't remove it
- Preserve git history when moving files (use `git mv`, not copy-paste)
- Every service gets its own `.env.example` — never commit real `.env`
- All cross-service types go in `/shared/types/` only — no duplication
- NestJS follows strict Module → Controller → Service pattern per feature
- Next.js components follow Atomic Design: atoms → molecules → organisms

---

## PHASE 0 — ANALYSIS (do this before touching anything)

- [x] Run `find . -name "*.ts" -o -name "*.py" -o -name "*.ino" | head -100` — map what exists
- [x] Run `wc -l` on these files and flag any over 300 lines:
  - `gui_manager.py`
  - `dashboard/page.tsx` (or equivalent main page)
  - `mock-server/index.ts`
- [x] List all current environment variables across all `.env` files
- [x] List all current API endpoints (Express routes, FastAPI routes)
- [x] List all current Socket.IO event names
- [x] List all current MQTT topics (if any)
- [x] Document findings in `docs/phase0-analysis.md` before proceeding

---

## PHASE 1 — CREATE MONOREPO SKELETON

### 1.1 Root Structure
- [x] Create root `package.json` with pnpm workspaces config:
  ```json
  {
    "name": "fishlinic",
    "private": true,
    "workspaces": ["apps/*", "services/*", "shared"]
  }
  ```
- [x] Create `pnpm-workspace.yaml`
- [x] Create root `.gitignore` covering node_modules, __pycache__, .env, *.pkl, *.pt, *.pth, dist, .next
- [x] Create root `README.md` with project overview and team roles
- [x] Create top-level folders:
  - `apps/`
  - `services/`
  - `firmware/`
  - `shared/`
  - `docs/`
  - `resources/`

---

## PHASE 2 — SHARED TYPES PACKAGE

- [x] Create `shared/package.json` with name `@fishlinic/types`
- [x] Create `shared/types/sensor.types.ts`:
  ```ts
  export type SensorType = 'pH' | 'TEMP' | 'DO2' | 'CO2'
  export interface SensorReading {
    sensorId: number
    type: SensorType
    value: number
    unit: string
    timestamp: string
    status: 'ok' | 'warn' | 'critical'
  }
  ```
- [x] Create `shared/types/fish.types.ts`:
  ```ts
  export interface FishCount { count: number; timestamp: string; snapshotId: number }
  export interface FishGrowth { date: string; avgSizeEstimate: number; count: number }
  export interface FishHealthReport {
    reportId: number
    phStatus: 'ok'|'warn'|'critical'
    tempStatus: 'ok'|'warn'|'critical'
    doStatus: 'ok'|'warn'|'critical'
    visualStatus: 'ok'|'warn'|'critical'
    behaviorStatus: 'ok'|'warn'|'critical'
    createdAt: string
  }
  ```
- [x] Create `shared/types/actuator.types.ts`:
  ```ts
  export type ActuatorType = 'FEEDER' | 'AIR_PUMP' | 'LED_STRIP' | 'STATUS_LED'
  export interface ActuatorCommand {
    actuatorId: number
    type: ActuatorType
    relayChannel: number
    state: boolean
    source: 'APP' | 'CRON' | 'AI' | 'EMERGENCY'
  }
  ```
- [x] Create `shared/types/alert.types.ts`:
  ```ts
  export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  export interface Alert {
    alertId: number
    sensorId: number
    tankId: number
    type: string
    severity: AlertSeverity
    message: string
    acknowledged: boolean
    createdAt: string
  }
  ```
- [x] Create `shared/types/api.types.ts` — all REST request/response shapes
- [x] Create `shared/types/socket.types.ts` — all Socket.IO event payloads
- [x] Create `shared/types/index.ts` — re-exports everything

---

## PHASE 3 — NestJS BACKEND (`services/backend/`)

> Ismail owns this entire service

### 3.1 Bootstrap
- [x] Move or create NestJS project in `services/backend/`
- [x] Install dependencies: `@nestjs/mqtt`, `@nestjs/schedule`, `@nestjs/websockets`, `socket.io`, `typeorm`, `pg`, `axios`
- [x] Create `services/backend/.env.example`:
  ```
  DATABASE_URL=postgresql://user:pass@host/fishlinic
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  SERIAL_BRIDGE_URL=http://localhost:3001
  AI_PREDICTOR_URL=http://localhost:8000
  OLLAMA_URL=http://localhost:11434
  PORT=3000
  ```
- [x] Create `services/backend/src/app.module.ts` — registers ALL modules below

### 3.2 Serial Module (talks to Sarvar's serial-bridge)
- [x] Create `src/serial/serial.module.ts`
- [x] Create `src/serial/serial.controller.ts`:
  - POST `/serial/reading` — receives parsed sensor data from serial-bridge
- [x] Create `src/serial/serial.service.ts`:
  - `forwardToSensors(reading: SensorReading)` — passes data to sensors service
  - `forwardToGateway(reading)` — emits to Socket.IO
  - `mockReading()` — generates fake data when hardware disconnected (dev mode)

### 3.3 Sensors Module
- [x] Create `src/sensors/sensors.module.ts`
- [x] Create `src/sensors/sensors.controller.ts`:
  - GET `/sensors` — list all sensors
  - GET `/sensors/:id/readings` — history with `?range=24h|1w|1m`
  - GET `/sensors/latest` — latest reading per sensor type
- [x] Create `src/sensors/sensors.service.ts`:
  - `saveReading(reading)` — persist to DB
  - `getLatest()` — fetch most recent per type
  - `getHistory(sensorId, range)` — time-series query
  - `checkThresholds(reading)` — evaluate ok/warn/critical, trigger alert if bad
  - Thresholds: pH 6.8–7.5, Temp 24–28°C, DO2 6–9 mg/L

### 3.4 Actuators Module
- [x] Create `src/actuators/actuators.module.ts`
- [x] Create `src/actuators/actuators.controller.ts`:
  - POST `/actuators/feed` — trigger feeder
  - POST `/actuators/pump` — toggle air pump
  - POST `/actuators/led` — toggle LED strip
  - GET `/actuators/state` — current state of all relays
- [x] Create `src/actuators/actuators.service.ts`:
  - `triggerActuator(command: ActuatorCommand)` — sends command to serial-bridge
  - `getState()` — returns current relay states
  - `emergencyOff()` — kills all actuators immediately

### 3.5 Alerts Module
- [x] Create `src/alerts/alerts.module.ts`
- [x] Create `src/alerts/alerts.controller.ts`:
  - GET `/alerts` — list recent alerts
  - GET `/alerts/active` — unacknowledged only
  - PATCH `/alerts/:id/acknowledge`
- [x] Create `src/alerts/alerts.service.ts`:
  - `createAlert(data)` — persist + push via Socket.IO
  - `triggerEmergency(reason)` — calls `actuators.emergencyOff()` + creates EMERGENCY alert
  - `acknowledgeAlert(id)`

### 3.6 Vision Module (talks to Firdavs's FastAPI)
- [x] Create `src/vision/vision.module.ts`
- [x] Create `src/vision/vision.controller.ts`:
  - POST `/vision/analyze` — trigger full vision analysis on demand
  - GET `/vision/latest-report` — last AI vision result
- [x] Create `src/vision/vision.service.ts`:
  - `requestSnapshot()` — calls serial-bridge camera endpoint
  - `detectDisease(imagePath)` — POST to FastAPI `/predict/disease`
  - `detectBehavior(imagePath)` — POST to FastAPI `/predict/behavior`
  - `countFish(imagePath)` — POST to FastAPI `/predict/count`
  - `getWaterQualityScore(readings)` — POST to FastAPI `/predict/quality`
  - `runFullAnalysis()` — chains all 4, builds health report, saves to DB

### 3.7 Voice Module (talks to Firdavs's Ollama/Veronica)
- [x] Create `src/voice/voice.module.ts`
- [x] Create `src/voice/voice.controller.ts`:
  - POST `/voice/query` — receives transcribed text + triggers AI response
  - GET `/voice/sessions` — voice session history
- [x] Create `src/voice/voice.service.ts`:
  - `handleQuery(text, snapshotId)` — bundles text + snapshot + latest sensor readings → POST to Ollama
  - `buildPrompt(text, readings, snapshot)` — constructs context-aware prompt
  - `saveSession(session)` — persist voice session to DB

### 3.8 Fish Module
- [x] Create `src/fish/fish.module.ts`
- [x] Create `src/fish/fish.controller.ts`:
  - GET `/fish/count` — latest fish count
  - GET `/fish/growth` — growth history
  - GET `/fish/health` — latest health report
  - GET `/fish/health/history`
- [x] Create `src/fish/fish.service.ts`:
  - `saveCount(count: FishCount)`
  - `saveGrowthRecord(growth: FishGrowth)`
  - `saveHealthReport(report: FishHealthReport)`
  - `compareGrowth(today, yesterday)` — growth delta calculation

### 3.9 Cron Module (24/7 scheduler)
- [x] Create `src/cron/cron.module.ts`
- [x] Create `src/cron/cron.service.ts` with these jobs:
  ```
  @Cron('*/1 * * * *')    → checkSensorThresholds() — read latest, fire alert if bad
  @Cron('*/5 * * * *')    → runVisionAnalysis() — snapshot → YOLO count + behavior
  @Cron('0 */8 * * *')    → triggerAutoFeed() — fire feeder relay
  @Cron('0 6 * * *')      → dailyHealthReport() — full analysis + save report
  @Cron('0 7 * * *')      → fishGrowthMonitor() — compare snapshots day over day
  @Cron('0 0 * * 0')      → weeklyExport() — generate JSONL export
  @Cron('*/30 * * * *')   → checkEmergencyConditions() — extreme threshold check
  ```

### 3.10 Gateway Module (Socket.IO)
- [x] Create `src/gateway/gateway.module.ts`
- [x] Create `src/gateway/gateway.gateway.ts`:
  - Event `sensor:update` — emits on every new reading from serial
  - Event `alert:new` — emits when alert is created
  - Event `fish:count` — emits after each vision analysis
  - Event `actuator:state` — emits after any relay change
  - Event `health:report` — emits after health report generated
  - Handle client event `command:feed` — triggers actuator
  - Handle client event `command:pump` — triggers actuator
  - Handle client event `command:led` — triggers actuator

### 3.11 Database Module (Maral owns this)
- [x] Create `src/database/database.module.ts` — TypeORM config, reads DATABASE_URL from .env
- [x] Create `src/database/entities/sensor-reading.entity.ts`:
  - Fields: readingId (PK), sensorId (FK), value, unit, timestamp, status
- [x] Create `src/database/entities/camera-snapshot.entity.ts`:
  - Fields: snapshotId (PK), imagePath, timestamp, triggeredBy
- [x] Create `src/database/entities/fish-count.entity.ts`:
  - Fields: countId (PK), snapshotId (FK), count, confidence, timestamp
- [x] Create `src/database/entities/fish-growth.entity.ts`:
  - Fields: growthId (PK), date, avgSizeEstimate, count, deltaFromPrev
- [x] Create `src/database/entities/health-report.entity.ts`:
  - Fields: reportId (PK), sessionId (FK), tankId (FK), phStatus, tempStatus, doStatus, visualStatus, behaviorStatus, overallScore, createdAt
- [x] Create `src/database/entities/alert.entity.ts`:
  - Fields: alertId (PK), sensorId (FK), tankId (FK), type, severity, message, acknowledged, createdAt
- [x] Create `src/database/entities/user-command.entity.ts`:
  - Fields: commandId (PK), actuatorId (FK), commandType, source, payload (JSON), createdAt, executedAt
- [x] Create `src/database/entities/voice-session.entity.ts`:
  - Fields: sessionId (PK), snapshotId (FK), wakeWordAt, transcribedText, aiResponse, audioOutputPath, durationMs, createdAt
- [ ] Create `src/database/migrations/` — initial migration from all entities
- [x] Create `src/database/repositories/` — one repository class per entity

---

## PHASE 4 — SERIAL BRIDGE (`services/serial-bridge/`)

> Sarvar's domain — Node.js process that sits between Arduino and NestJS

- [ ] Move existing mock-server into `services/serial-bridge/`
- [ ] Split `index.ts` if over 300 lines into:
  - `src/serial.ts` — USB serial port connection, reads raw Arduino strings
  - `src/parser.ts` — parses raw strings into `SensorReading` objects
  - `src/emitter.ts` — POSTs parsed readings to NestJS `/serial/reading`
  - `src/mock.ts` — mock data generator when hardware not connected
  - `src/index.ts` — entry point, wires everything together
- [ ] Create `.env.example`:
  ```
  SERIAL_PORT=/dev/ttyUSB0
  BAUD_RATE=9600
  BACKEND_URL=http://localhost:3000
  MOCK_MODE=false
  ```
- [ ] Serial data format contract with Sarvar — Arduino sends:
  ```
  pH:7.12,TEMP:26.4,DO2:7.8,CO2:0.04\n
  ```
- [ ] Auto-detect mock mode if serial port not found
- [ ] Create `services/serial-bridge/package.json`

---

## PHASE 5 — AI PREDICTOR (`services/ai-predictor/`)

> Firdavs owns this — FastAPI Python service

- [ ] Create `services/ai-predictor/main.py` — FastAPI app entry point
- [ ] Create `services/ai-predictor/routes/predict_disease.py`:
  - POST `/predict/disease` — receives image path, returns `{ disease: string, confidence: float, bbox: [] }`
  - Uses YOLOv8/v11 model
- [ ] Create `services/ai-predictor/routes/predict_behavior.py`:
  - POST `/predict/behavior` — receives image sequence path, returns `{ anomaly: bool, score: float, description: string }`
  - Uses ConvLSTM-VAE model
- [ ] Create `services/ai-predictor/routes/predict_quality.py`:
  - POST `/predict/quality` — receives `{ pH, temp, DO2, CO2 }`, returns `{ score: float, status: string }`
  - Uses Random Forest model
- [ ] Create `services/ai-predictor/routes/count_fish.py`:
  - POST `/predict/count` — receives image path, returns `{ count: int, confidence: float }`
  - Uses YOLO model
- [ ] Create `services/ai-predictor/models/` — place `.pt`, `.pth`, `.pkl` files here
- [ ] Create `services/ai-predictor/requirements.txt`:
  ```
  fastapi
  uvicorn
  ultralytics
  torch
  scikit-learn
  opencv-python
  pillow
  ```
- [ ] Create `.env.example`:
  ```
  MODEL_PATH=./models
  PORT=8000
  ```

---

## PHASE 6 — VERONICA VOICE ASSISTANT (`apps/assistant/`)

> Firdavs owns this

- [ ] Create `apps/assistant/pipeline.py` — chains all 4 stages:
  1. openWakeWord listener → detects "System Status" / "Veronica"
  2. Whisper.cpp → transcribes speech to text
  3. POST to NestJS `/voice/query` with transcribed text
  4. Receive AI response text from NestJS
  5. Kokoro-82M → synthesize response to audio → play
- [ ] Split `gui_manager.py` if over 300 lines into:
  - `BaseGui.py` — window/layout setup
  - `AssetLoader.py` — loads icons, images, fonts
  - `EventHandlers.py` — button clicks, keyboard, socket events
- [ ] Create `apps/assistant/wake_word/detector.py`
- [ ] Create `apps/assistant/stt/transcriber.py` — Whisper.cpp wrapper
- [ ] Create `apps/assistant/tts/synthesizer.py` — Kokoro-82M wrapper
- [ ] Create `apps/assistant/requirements.txt`
- [ ] Create `.env.example`:
  ```
  BACKEND_URL=http://localhost:3000
  OLLAMA_URL=http://localhost:11434
  WAKE_WORD=veronica
  ```

---

## PHASE 7 — NEXT.JS DASHBOARD (`apps/dashboard/`)

> Hamidullo owns this → Ismail took over

- [x] Move existing dashboard into `apps/dashboard/`
- [x] Install: `socket.io-client`, `@fishlinic/types` (from shared)
- [x] Create Atomic Design folder structure:
  ```
  src/components/
  ├── atoms/          (Button, Badge, Gauge, StatusDot, SensorValue)
  ├── molecules/      (SensorCard, AlertBanner, ActuatorButton, FishCountBadge)
  └── organisms/      (LiveDashboard, ControlPanel, AlertFeed, HistoryChart, FishHealthPanel)
  ```
- [x] Split `page.tsx` if over 300 lines into organisms
- [x] Create `src/hooks/useSocket.ts`:
  - Connects to NestJS Socket.IO
  - Listens: `sensor:update`, `alert:new`, `fish:count`, `actuator:state`, `health:report`
  - Returns typed state for each event
- [x] Create `src/hooks/useApi.ts`:
  - `feedFish()` → POST `/actuators/feed`
  - `togglePump(state)` → POST `/actuators/pump`
  - `toggleLed(state)` → POST `/actuators/led`
  - `getHistory(sensorId, range)` → GET `/sensors/:id/readings`
  - `getAlerts()` → GET `/alerts/active`
  - `acknowledgeAlert(id)` → PATCH `/alerts/:id/acknowledge`
  - `getFishHealth()` → GET `/fish/health`
- [x] Create `src/api/endpoints.ts` — single source of truth for all API URLs
- [x] Create screens:
  - `app/dashboard/page.tsx` — live monitoring (pH, temp, DO2, CO2 gauges + fish count)
  - `app/dashboard/fish-health/page.tsx` — YOLO disease results, behavior anomaly, health score
  - `app/dashboard/controls/page.tsx` — feed, pump, LED manual controls
  - `app/dashboard/history/page.tsx` — 24h/1w/1m charts + CSV/JSON export
  - `app/dashboard/alerts/page.tsx` — alert feed + acknowledge
- [x] Keep existing: NextAuth (Google, Kakao, Email), Fish Game, JSONL export
- [x] Create `.env.example`:
  ```
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=http://localhost:3001
  BACKEND_URL=http://localhost:3000
  NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  KAKAO_CLIENT_ID=
  KAKAO_CLIENT_SECRET=
  ```

---

## PHASE 8 — FIRMWARE (`firmware/`)

> Sarvar owns this

- [x] Move all `.ino` files to `firmware/arduino/`
- [x] Consolidate into a single UNO file (since there's only 1 Arduino):
  - `firmware/arduino/fishlinic_uno.ino` — pH, DO2, CO2, Temp, Servo
- [x] Serial output format must match what `serial-bridge/parser.ts` expects:
  ```
  pH:7.12,do_mg_l:7.8,CO2:400.0,temp_c:26.50
  ```
- [x] Create `firmware/README.md` — wiring diagram descriptions, pin mappings:
  ```
  pH Sensor      → A0
  DO2 Sensor     → A1
  CO2 Sensor     → A2
  Temp Sensor    → Pin 2
  Feeder Motor   → Pin 9
  RTC Module     → I2C (SDA/SCL)
  ```
- [ ] Create `firmware/platformio.ini` if using PlatformIO

---

## PHASE 9 — RESOURCES (`resources/`)

- [ ] Create `resources/models/` — move all `.pt`, `.pth`, `.pkl` files here
- [ ] Create `resources/media/` — UI assets, fish images
- [ ] Add to `.gitignore`: `resources/models/*.pt`, `resources/models/*.pth`, `resources/models/*.pkl`
- [ ] Create `resources/models/README.md` — where to download each model, which version

---

## PHASE 10 — DOCS (`docs/`)

> Ismail writes all of these — team reads them before writing code

- [x] Create `docs/api-contracts.md`:
  ```
  ## REST Endpoints
  POST /serial/reading     → body: SensorReading
  GET  /sensors/latest     → returns: SensorReading[]
  GET  /sensors/:id/readings?range=24h → returns: SensorReading[]
  POST /actuators/feed     → returns: { success: bool }
  POST /actuators/pump     → body: { state: bool }
  POST /actuators/led      → body: { state: bool }
  GET  /alerts/active      → returns: Alert[]
  PATCH /alerts/:id/acknowledge
  POST /vision/analyze     → returns: FishHealthReport
  GET  /fish/health        → returns: FishHealthReport
  GET  /fish/count         → returns: FishCount
  POST /voice/query        → body: { text, snapshotId }

  ## Socket.IO Events (server → client)
  sensor:update    → SensorReading
  alert:new        → Alert
  fish:count       → FishCount
  actuator:state   → { type, state }
  health:report    → FishHealthReport

  ## Socket.IO Events (client → server)
  command:feed     → triggers feeder
  command:pump     → body: { state: bool }
  command:led      → body: { state: bool }

  ## FastAPI Endpoints (internal, NestJS → AI)
  POST /predict/disease    → body: { imagePath } → { disease, confidence, bbox }
  POST /predict/behavior   → body: { imagePath } → { anomaly, score, description }
  POST /predict/quality    → body: { pH, temp, DO2, CO2 } → { score, status }
  POST /predict/count      → body: { imagePath } → { count, confidence }
  ```

- [x] Create `docs/serial-protocol.md`:
  - Arduino output format
  - Baud rate
  - How to test without hardware (mock mode)
  - Pin mappings reference

- [x] Create `docs/cron-schedule.md`:
  - All 7 cron jobs, their schedule, what they do, what services they call

- [x] Create `docs/team-ownership.md`:
  ```
  Ismail   → services/backend (all modules), docs
  Maral    → services/backend/src/database (entities + migrations)
  Hamidullo → apps/dashboard
  Firdavs  → services/ai-predictor, apps/assistant
  Sarvar   → firmware, services/serial-bridge
  ```

- [x] Create `docs/supabase-setup.md`:
  - How to get the connection string
  - How to set up `.env` with Supabase URL
  - How to run migrations

- [ ] Move `ER-diagram.html` and `architecture.html` to `docs/`

---

## PHASE 11 — FINAL CHECKS

- [ ] Verify all services start independently with just `.env` configured
- [ ] Verify no file exceeds 300 lines
- [ ] Verify `shared/types` are imported correctly in both backend and dashboard
- [ ] Verify mock mode works in serial-bridge (no hardware needed for dev)
- [ ] Verify Socket.IO events match between `gateway.gateway.ts` and `useSocket.ts`
- [ ] Verify all FastAPI routes match what `vision.service.ts` calls
- [ ] Verify all REST endpoints match what `useApi.ts` calls
- [ ] Run `pnpm install` from root — all workspaces resolve
- [ ] Create `docs/phase0-analysis.md` is complete with all findings

---

## SUMMARY — FILE COUNT TARGET

| Service | Files to create |
|---|---|
| shared/types | 6 files |
| services/backend | ~35 files (7 modules × 3 + DB entities + migrations) |
| services/serial-bridge | 5 files |
| services/ai-predictor | 6 files |
| apps/assistant | 6 files |
| apps/dashboard | ~20 files (screens + hooks + components) |
| firmware | 3 files |
| docs | 6 files |
| root config | 4 files |

**Total: ~91 files**
