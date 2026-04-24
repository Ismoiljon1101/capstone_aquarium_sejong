# Fishlinic Serial Protocol

Defines communication between Arduino hardware and `services/serial-bridge/`.

---

## Physical setup

| Parameter | Value |
|-----------|-------|
| Baud rate | 9600 |
| Line ending | `\n` (newline) |
| Encoding | UTF-8 JSON |
| Main port | `COM3` / `/dev/ttyUSB0` — Main Arduino |
| Secondary port | `COM4` / `/dev/ttyUSB1` — Secondary Arduino |

---

## 1. Main Arduino → Bridge (sensor readings)

Emitted every **1 second** over USB serial.

```json
{"pH":7.12,"do_mg_l":7.81,"rtc":"2026-04-17T14:35:00"}
```

| Field | Type | Unit | Source |
|-------|------|------|--------|
| `pH` | float (2dp) | — | pH probe on A0 — averaged over 40 samples, min/max dropped |
| `do_mg_l` | float (2dp) | mg/L | DO probe on A1 — linear calibration |
| `rtc` | string (ISO 8601) | — | RTC DS1307 timestamp — omitted if module missing |

**Startup message** (once on boot):
```json
{"status":"main_ready","rtc":true}
```

---

## 2. Secondary Arduino → Bridge (temperature + feeder state)

Emitted every **1 second** over USB serial.

```json
{"temp_c":26.40,"feeding":false}
```

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| `temp_c` | float (2dp) / null | °C | DS18B20 on pin 2; null if sensor not found |
| `feeding` | boolean | — | true while servo is mid-cycle |

**Startup messages** (once on boot):
```json
{"status":"temp_sensor_ready"}
{"status":"secondary_ready"}
```

---

## 3. Bridge → Secondary Arduino (actuator commands)

Bridge sends JSON commands to trigger the feeder servo.

### Feed command
```json
{"cmd":"feed","duration":2}
```

| Field | Type | Description |
|-------|------|-------------|
| `cmd` | string | `"feed"` |
| `duration` | int 1–5 | Number of servo cycles (1 cycle = 2 seconds) |

**Responses:**
```json
{"ack":"feed_start","cycles":2}    // immediately after command received
{"ack":"feed_complete"}            // after all cycles done
{"error":"already_feeding"}        // ignored — already running
{"error":"invalid_duration","allowed":"1-5"}  // out of range
```

---

## 4. How the bridge processes readings

`services/serial-bridge/src/parser.ts` reads each `\n`-terminated line and:

1. Parses JSON — drops line if malformed
2. Merges main + secondary readings into a single `SensorReading` object:
   ```ts
   {
     sensorId: 1,
     tankId:   1,
     pH:       7.12,
     do_mg_l:  7.81,
     temp_c:   26.40,
     rtc:      "2026-04-17T14:35:00"
   }
   ```
3. POSTs to `http://localhost:3000/serial/reading` via `emitter.ts`
4. Backend stores in DB + emits `sensor:update` on Socket.IO

---

## 5. Mock mode (no hardware)

Set in `services/serial-bridge/.env`:
```env
MOCK_MODE=true
```

Bridge generates random readings within safe ranges every 2s:
- pH: 6.8–7.5
- DO: 6.0–9.0 mg/L
- temp: 24–28 °C

Same code path as real hardware — no change needed in backend or mobile.

---

## 6. Bridge `.env` reference

```env
SERIAL_PORT=COM3              # Main Arduino port
SERIAL_PORT_SECONDARY=COM4    # Secondary Arduino port
BAUD_RATE=9600
MOCK_MODE=false               # true = no Arduino needed
BACKEND_URL=http://localhost:3000
```

---

## 7. Testing without full hardware

**Test main Arduino output manually:**
Open Arduino IDE → Tools → Serial Monitor → 9600 baud.
You should see JSON lines every second.

**Test bridge is receiving:**
```bash
cd services/serial-bridge
pnpm dev
# Watch logs — should show parsed readings being POSTed to backend
```

**Test backend received it:**
```bash
curl http://localhost:3000/sensors/latest
# Should return array with pH, temp, DO readings
```

**Test Socket.IO event:**
Open browser console on `http://localhost:8081` (mobile web) and watch the Dashboard
tiles update — they reflect `sensor:update` socket events.

---

## 8. What's not yet implemented

| Feature | Notes |
|---------|-------|
| CO2 sensor | Not in firmware — field not sent yet |
| Air pump command | Bridge routes `POST /actuators/pump` but secondary has no relay code |
| LED command | Bridge routes `POST /actuators/led` but secondary has no relay code |
| CRC/checksum | No error detection on packets — malformed JSON silently dropped |
| Multi-tank | `sensorId: 1` / `tankId: 1` hardcoded in bridge and backend |

See `docs/team-ownership.md` § Sarvar for remaining tasks.
