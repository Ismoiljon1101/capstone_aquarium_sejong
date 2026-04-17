# Fishlinic Firmware

Two Arduinos communicate over USB serial to the `services/serial-bridge/` Node.js service.
Each sends JSON lines at **9600 baud**.

---

## Architecture

```
Main Arduino (UNO)              Secondary Arduino (UNO)
──────────────────              ───────────────────────
pH sensor   → A0                DS18B20 temp → Pin 2 (OneWire)
DO sensor   → A1                Servo feeder → Pin 9
RTC DS1307  → I2C (SDA/SCL)

Outputs every 1s:               Outputs every 1s:
{"pH":7.12,"do_mg_l":7.8}      {"temp_c":26.4,"feeding":false}

                                Accepts commands from bridge:
                                {"cmd":"feed","duration":2}
```

Both connect to the PC via USB. Serial bridge opens two ports:
- `SERIAL_PORT` → Main Arduino (pH + DO)
- `SERIAL_PORT_SECONDARY` → Secondary Arduino (temp + feeder)

---

## Main Arduino — `firmware/main/main.ino`

### Pin mapping

| Pin | Hardware | Notes |
|-----|----------|-------|
| A0 | pH probe (analog) | DFRobot-style: `pH = 3.5 × V + PH_OFFSET` |
| A1 | DO probe (analog) | Linear: `do = DO_SLOPE × mV + DO_INTERCEPT` |
| SDA/SCL | RTC DS1307 (I2C) | Timestamps each reading |

### JSON output (every 1 second via Serial)

```json
{"pH":7.12,"do_mg_l":7.81,"rtc":"2026-04-17T14:35:00"}
```

`rtc` field omitted if RTC module absent or not running.

### Calibration

**pH:**
1. Fill beaker with pH 7.00 buffer solution
2. Put probe in, wait 1 min for stable reading
3. Note the `pH` value — offset = `7.00 - reading`
4. Set `float PH_OFFSET = <value>;` in `main.ino`, reflash

**DO (dissolved oxygen):**
1. Expose probe to air-saturated water at known temp (~8.3 mg/L at 25°C)
2. Measure raw mV at that point
3. Calculate: `DO_SLOPE = 8.3 / mV_at_saturation`
4. Set `DO_SLOPE` and `DO_INTERCEPT` in `main.ino`, reflash

### Libraries required

```
RTClib (Adafruit)    — DS1307 RTC
Wire                 — built-in (I2C)
```

Install via Arduino IDE → Tools → Manage Libraries.

---

## Secondary Arduino — `firmware/secondary/secondary.ino`

### Pin mapping

| Pin | Hardware | Notes |
|-----|----------|-------|
| 2 | DS18B20 temp sensor (OneWire) | 4.7kΩ pull-up between data pin + 5V |
| 9 | Servo motor (feeder) | Standard PWM servo signal |

### JSON output (every 1 second via Serial)

```json
{"temp_c":26.40,"feeding":false}
```

If sensor not found:
```json
{"temp_c":null,"feeding":false,"error":"no_sensor"}
```

### Command input (bridge → secondary)

Bridge sends JSON over secondary serial port:

```json
{"cmd":"feed","duration":2}
```

| Field | Type | Description |
|-------|------|-------------|
| `cmd` | string | Always `"feed"` |
| `duration` | int 1–5 | Number of full servo cycles (1 cycle = 2 seconds) |

Servo sequence per cycle:
1. 0° → 180° (open gate) — 1 second
2. 180° → 0° (close gate) — 1 second

Responses:
```json
{"ack":"feed_start","cycles":2}   // on start
{"ack":"feed_complete"}           // when done
{"error":"already_feeding"}       // if command arrives mid-feed
```

### Libraries required

```
DS18B20      — temperature sensor driver
OneWire      — 1-wire bus protocol
Servo        — built-in
```

---

## Flashing instructions

1. Install [Arduino IDE 2.x](https://www.arduino.cc/en/software)
2. Install libraries: **Tools → Manage Libraries**
   - `RTClib` by Adafruit (for main Arduino)
   - `DS18B20` (for secondary)
   - `OneWire` (for secondary)
3. Open `firmware/main/main.ino`
4. **Tools → Board → Arduino UNO**
5. **Tools → Port → COM? (Arduino UNO)** — the right port
6. Click **Upload** (→ arrow button)
7. Repeat steps 3–6 with `firmware/secondary/secondary.ino` on second Arduino

> **Windows**: ports are `COM3`, `COM4`, etc. — check Device Manager.
> **Linux/Mac**: `/dev/ttyUSB0`, `/dev/ttyACM0`, etc.
>
> **Tip — identify which port is which**: unplug one Arduino, note which COM
> disappears in Device Manager — that's its port.

---

## Serial bridge `.env` after flashing

```env
SERIAL_PORT=COM3              # Main Arduino (pH + DO + RTC)
SERIAL_PORT_SECONDARY=COM4    # Secondary Arduino (temp + feeder)
BAUD_RATE=9600
MOCK_MODE=false
BACKEND_URL=http://localhost:3000
```

And in `services/backend/.env`:
```env
SIMULATE_SENSORS=false
```

---

## What's NOT yet in firmware (future work)

| Feature | Status | Notes |
|---------|--------|-------|
| CO2 sensor | ❌ Not implemented | Planned: A2 on main Arduino |
| Air pump relay | ❌ Not implemented | Bridge already routes `pump` command — secondary needs relay code |
| LED strip relay | ❌ Not implemented | Bridge already routes `led` command — secondary needs relay code |
| CRC/checksum on packets | ❌ Not implemented | Sarvar's task |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| pH reads garbage / -1 | Calibrate PH_OFFSET; soak probe in pH 7.00 buffer 1 min first |
| DO reads 0.00 | Check `DO_ENABLE_LINEAR = true`; set correct SLOPE + INTERCEPT |
| Temp reads null | Check DS18B20 wiring; 4.7kΩ pull-up required on data pin |
| Feeder doesn't move | Servo needs dedicated 5V/1A supply — don't power from Arduino 5V pin |
| Bridge can't find port | Check Device Manager; try unplugging/replugging Arduino |
| Wrong Arduino responds | Unplug one, note which port disappears — that's its port number |
| pH drifts after calibration | Probe needs 30-min soak in pH 7 buffer before calibrating |
