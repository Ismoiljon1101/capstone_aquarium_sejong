# Fishlinic Serial Protocol

This document defines the serial communication between the Arduino hardware and the `serial-bridge` service.

## 1. Data Format (Hardware -> Bridge)

The Arduino sends a JSON string followed by a newline `\n`.

**Example:**
```json
{"pH":7.12,"do_mg_l":7.8,"temp_c":26.4}
```

### Field Mappings
| Key | Logic Unit | Description |
|---|---|---|
| `pH` | `pH` | Potential of Hydrogen |
| `do_mg_l` | `mg/L` | Dissolved Oxygen |
| `temp_c` | `°C` | Temperature in Celsius |

---

## 2. Command Format (Bridge -> Hardware)

Commands are sent as JSON strings to trigger actuators.

**Example (Feed):**
```json
{"actuatorId":1,"type":"FEEDER","relayChannel":1,"state":true}
```

---

## 3. Physical Parameters
- **Baud Rate**: 9600
- **Main Port**: `/dev/ttyUSB0` (Sensors)
- **Secondary Port**: `/dev/ttyUSB1` (Actuators/Relays)

---

## 4. Testing (Mock Mode)
If `MOCK_MODE=true` is set in the bridge `.env`, the bridge will ignore the serial ports and generate randomized sensor data based on the JSON contract.
