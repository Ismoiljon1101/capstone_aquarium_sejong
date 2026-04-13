# Fishlinic API Contracts

This document defines the interface standards for communication between Backend, Dashboard, Mobile, and AI Predictor.

## REST Endpoints (Backend - `:3000`)

### Sensors
- `GET /sensors/latest` -> Returns the most recent reading from each sensor.
- `GET /sensors/:id/readings?range=24h` -> Returns history for a specific sensor.
- `POST /serial/reading` -> (Internal) Used by serial bridge to push data.

### Actuators
- `POST /actuators/feed` -> Triggers the automatic feeder.
- `POST /actuators/pump` -> `{ state: boolean }` -> Toggles the air pump.
- `POST /actuators/led` -> `{ state: boolean }` -> Toggles the tank lights.
- `POST /actuators/emergency-off` -> Shuts down all active actuators immediately.
- `POST /actuators/state` -> (Internal) Used by serial bridge to confirm relay state.

### Alerts
- `GET /alerts/active` -> Returns list of unacknowledged alerts.
- `PATCH /alerts/:id/acknowledge` -> Marks an alert as acknowledged.

### Fish
- `GET /fish/health` -> Returns the latest health score and behavior status.
- `GET /fish/count` -> Returns latest YOLO fish count.
- `GET /fish/growth` -> Returns weekly growth trend data.
- `GET /fish/health/history` -> Returns historical health reports.

### Vision
- `POST /vision/analyze` -> Triggers YOLO/LSTM analysis of the current tank stream.

### Voice
- `POST /voice/query` -> `{ text, snapshotId? }` -> `{ response }` -> LLM query with sensor context.

---

## Socket.IO Events (Server -> Client)

- `sensor:update` : Broadcasts new `SensorReading` every 5 seconds.
- `alert:new`     : Triggered when sensors hit critical thresholds.
- `fish:count`    : Updated whenever the count model runs.
- `health:report` : Emitted after daily AI health analysis completes (`FishHealthReport`).
- `actuator:state`: Confirms change of state for pump/feed/light.

---

## internal AI Contracts (Backend -> AI Predictor `:8000`)

- `POST /predict/disease`: `{ imagePath }` -> `{ disease, confidence, bbox }`
- `POST /predict/quality`: `{ pH, temp, do2, co2 }` -> `{ score, status }`
- `POST /predict/count`: `{ imagePath }` -> `{ count, confidence }`
