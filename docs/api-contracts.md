# Fishlinic API Contracts

This document defines the REST and Socket.IO interfaces for the Fishlinic ecosystem.

## 1. Backend REST Endpoints (`services/backend`)

### 1.1 Sensors
| Endpoint | Method | Description | Payload/Response |
|---|---|---|---|
| `/sensors` | GET | List all sensors | `Sensor[]` |
| `/sensors/:id/readings` | GET | History | `?range=24h/1w/1m` |
| `/sensors/latest` | GET | Latest readings | `SensorReading[]` |

### 1.2 Actuators
| Endpoint | Method | Description | Payload/Response |
|---|---|---|---|
| `/actuators/feed` | POST | Trigger feeder | `{ state: boolean }` |
| `/actuators/pump` | POST | Toggle air pump | `{ state: boolean }` |
| `/actuators/led` | POST | Toggle LED strip | `{ state: boolean }` |
| `/actuators/state` | GET | Current relay states | `object` |

### 1.3 Vision
| Endpoint | Method | Description | Payload/Response |
|---|---|---|---|
| `/vision/analyze` | POST | Trigger full analysis | `{ triggeredBy: string }` |
| `/vision/latest-report`| GET | Last AI result | `HealthReport` |

### 1.4 Voice
| Endpoint | Method | Description | Payload/Response |
|---|---|---|---|
| `/voice/query` | POST | Process query | `{ text: string, snapshotId?: number }` |
| `/voice/sessions` | GET | Session history | `VoiceSession[]` |

---

## 2. Socket.IO Events (Server -> Client)

| Event Name | Payload | Description |
|---|---|---|
| `sensor:update` | `SensorReading` | Real-time telemetry update |
| `alert:new` | `Alert` | New alert notification |
| `fish:count` | `FishCount` | Result of vision analysis |
| `actuator:state` | `{ type, state }` | Confirmation of relay change |
| `health:report` | `FishHealthReport` | Full AI health analysis result |

---

## 3. AI Predictor Endpoints (`services/ai-predictor`)
*Internal consumption by Backend*

| Endpoint | Method | Description | Payload |
|---|---|---|---|
| `/predict/disease` | POST | YOLOv8 diagnosis | `{ imagePath }` |
| `/predict/behavior` | POST | Anomaly detection | `{ imagePath }` |
| `/predict/count` | POST | Fish counting | `{ imagePath }` |
| `/predict/quality` | POST | Quality scoring | `{ pH, temp_c, do_mg_l }` |
