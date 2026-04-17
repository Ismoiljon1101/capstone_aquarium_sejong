# Fishlinic Firmware Guide

This directory contains the unified Arduino firmware for the Fishlinic Smart Aquaculture system.

## Hardware Configuration

### Unified Controller: `arduino/fishlinic_uno.ino`
Responsible for water quality monitoring, actuator control, and RTC time tracking.

| Component | Pin | Type | Details |
|---|---|---|---|
| pH Sensor | A0 | Analog | DFRobot Analog pH Meter |
| DO Sensor | A1 | Analog | DFRobot Analog DO Meter |
| CO2 Sensor | A2 | Analog | Analog CO2 Sensor |
| Temp Sensor | 2 | OneWire | DS18B20 Waterproof |
| Feeder Servo | 9 | PWM | MG996R or similar |
| RTC Module | I2C (SDA/SCL) | Digital | DS1307 RTC |

**Output Format (JSON):**
`{"pH": 7.12, "do_mg_l": 7.8, "CO2": 400.0, "temp_c": 26.50, "feeding": false, "timestamp": "2026-04-16T18:50:00Z"}`

**Features:**
- Periodic mixed sensor reporting.
- Command-based feeding sequences (`{"cmd":"feed","duration":2}`).
- Multi-cycle feeding handler (non-blocking).

---

## Communication Protocol

- **Baud Rate:** 9600
- **Format:** Minimal JSON followed by `\n` or `\r\n`.
- **Bridge Integration:** This controller connects to the `serial-bridge` service which forwards readings to the NestJS backend.

## Calibration Notes
- **pH**: Adjust `PH_OFFSET` in the code using a 7.00 buffer solution.
- **DO**: Adjust `DO_SLOPE` and `DO_INTERCEPT` based on 0% (sodium sulfite) and 100% (saturated空气) calibration points.
