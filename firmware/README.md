# Fishlinic Firmware

## Overview

Two Arduinos + one ESP32-CAM work together to measure water chemistry and control actuators.

## Pin Mappings

### Main Arduino — Water Chemistry (`firmware/main.ino`)

| Sensor | Pin | Notes |
|--------|-----|-------|
| pH Sensor | A0 | Analog — calibrate with pH 4 + pH 7 buffers |
| Dissolved Oxygen (DO2) | A1 | Analog — Atlas Scientific probe |
| CO2 Sensor | A2 | Analog |

### Secondary Arduino — Actuators (`firmware/secondary.ino`)

| Component | Pin | Notes |
|-----------|-----|-------|
| Temperature Sensor | A3 | DS18B20 one-wire |
| Feeder Motor | Relay CH1 | 5V relay module |
| Air Pump | Relay CH2 | 5V relay module |
| LED Strip 12V | Relay CH3 | 12V — use appropriate relay |
| Status LEDs | GPIO direct | On-board indicator LEDs |

### ESP32-CAM

| Function | Notes |
|----------|-------|
| Camera stream | `/camera/snapshot` via Serial Bridge |
| WiFi | Connect to same LAN as Serial Bridge service |

## Serial Output Format

Main Arduino sends JSON over USB serial at **9600 baud**:

```json
{"pH":7.12,"temp_c":26.4,"do_mg_l":7.8}
```

The Serial Bridge (`services/serial-bridge/`) reads this stream and POSTs to NestJS.

## Relay Channel Mapping

```
CH1 → Feeder Motor  (POST /actuators/feed)
CH2 → Air Pump      (POST /actuators/pump)
CH3 → LED Strip     (POST /actuators/led)
```

## Calibration

- pH: Use pH 4.0 and pH 7.0 buffer solutions. Adjust `pH_offset` constant in `main.ino`.
- DO2: Follow Atlas Scientific calibration procedure.

## Dependencies

- Arduino IDE 2.x
- Libraries: `ArduinoJson`, `DallasTemperature`, `OneWire`
