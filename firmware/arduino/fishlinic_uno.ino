#include <Wire.h>
#include "RTClib.h"
#include <DS18B20.h>
#include <OneWire.h>
#include <Servo.h>

// --- Sensors & Actuators Config ---
// pH
#define PH_ARRAY_LEN 40
#define PH_SAMPLING_INTERVAL_MS 20
#define PH_PRINT_INTERVAL_MS 1000
float PH_OFFSET = 0.00f;
const int PH_PIN = A0;

// DO
const int DO_PIN = A1;
const bool DO_ENABLE_LINEAR = true;
float DO_SLOPE = 0.0025f; 
float DO_INTERCEPT = 0.0f;

// CO2
const int CO2_PIN = A2;

// ADC / Vref
const float VREF_MV = 5000.0f;
const float ADC_RES = 1024.0f;

// Temp (DS18B20)
const int ONE_WIRE_PIN = 2;
OneWire ds(ONE_WIRE_PIN);
DS18B20 ds1(ONE_WIRE_PIN);
uint8_t tempSelected = 0;

// Servo (Feeder)
const int SERVO_PIN = 9;
Servo myservo;
const int SERVO_MIN_ANGLE = 0;
const int SERVO_MAX_ANGLE = 180;

// RTC
RTC_DS1307 RTC;
bool rtcAvailable = false;

// --- State Variables ---
int phArray[PH_ARRAY_LEN];
int phIdx = 0;
unsigned long phSampleAt = 0;
unsigned long lastPrintAt = 0;

// Feed State
bool feeding = false;
int feedCyclesRemaining = 0;
unsigned long cycleStartTime = 0;
bool servoAtMax = false;
const unsigned long HALF_CYCLE_MS = 1000;

String inputBuffer = "";

// Helper for pH
double avgArray_dropMinMax(int* arr, int n) {
  if (n <= 0) return 0.0;
  if (n < 5) {
    long sum = 0; 
    for (int i = 0; i < n; i++) sum += arr[i];
    return (double)sum / n;
  }
  int minV = arr[0], maxV = arr[1];
  if (minV > maxV) { int t = minV; minV = maxV; maxV = t; }
  long sum = 0;
  for (int i = 2; i < n; i++) {
    int v = arr[i];
    if (v < minV) { sum += minV; minV = v; }
    else if (v > maxV) { sum += maxV; maxV = v; }
    else { sum += v; }
  }
  return (double)sum / (n - 2);
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  
  // Setup RTC
  if (RTC.begin()) {
    rtcAvailable = true;
    if (!RTC.isrunning()) RTC.adjust(DateTime(__DATE__, __TIME__));
  }

  // Setup Temp
  ds.reset_search();
  byte addr[8];
  if (ds.search(addr)) {
    tempSelected = ds1.select(addr);
  }

  // Setup pH buffer
  int seed = analogRead(PH_PIN);
  for (int i = 0; i < PH_ARRAY_LEN; i++) phArray[i] = seed;
  phSampleAt = millis();
  lastPrintAt = millis();

  // Setup Servo
  myservo.attach(SERVO_PIN);
  myservo.write(SERVO_MIN_ANGLE);
  
  Serial.println("{\"status\":\"unified_ready\"}");
}

void processCommand(String cmd) {
  cmd.trim();
  if (feeding) {
    Serial.println("{\"error\":\"already_feeding\"}");
    return;
  }

  if (cmd.startsWith("{") && cmd.indexOf("\"cmd\"") > 0 && cmd.indexOf("\"feed\"") > 0) {
    int durationIdx = cmd.indexOf("\"duration\"");
    int cycles = 1;
    if (durationIdx > 0) {
      int colonIdx = cmd.indexOf(":", durationIdx);
      int endIdx   = cmd.indexOf("}", colonIdx);
      if (colonIdx > 0 && endIdx > colonIdx) {
        String durationStr = cmd.substring(colonIdx + 1, endIdx);
        durationStr.trim();
        cycles = durationStr.toInt();
      }
    }

    if (cycles >= 1 && cycles <= 5) {
      feeding = true;
      feedCyclesRemaining = cycles;
      cycleStartTime = millis();
      servoAtMax = false;
      myservo.write(SERVO_MAX_ANGLE);
      servoAtMax = true;
      Serial.print("{\"ack\":\"feed_start\",\"cycles\":");
      Serial.print(cycles);
      Serial.println("}");
    } else {
      Serial.println("{\"error\":\"invalid_duration\"}");
    }
  }
}

void handleFeeding() {
  if (!feeding) return;
  unsigned long now = millis();
  unsigned long elapsed = now - cycleStartTime;

  if (servoAtMax) {
    if (elapsed >= HALF_CYCLE_MS) {
      myservo.write(SERVO_MIN_ANGLE);
      servoAtMax = false;
      cycleStartTime = now;
    }
  } else {
    if (elapsed >= HALF_CYCLE_MS) {
      feedCyclesRemaining--;
      if (feedCyclesRemaining > 0) {
        myservo.write(SERVO_MAX_ANGLE);
        servoAtMax = true;
        cycleStartTime = now;
      } else {
        feeding = false;
        myservo.write(SERVO_MIN_ANGLE);
        Serial.println("{\"ack\":\"feed_complete\"}");
      }
    }
  }
}

void loop() {
  unsigned long now = millis();

  // Process incoming commands over Serial
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
      if (inputBuffer.length() > 200) inputBuffer = "";
    }
  }

  // Handle feed logic independently
  handleFeeding();

  // ph sampling (rapid collection)
  if (now - phSampleAt >= PH_SAMPLING_INTERVAL_MS) {
    phArray[phIdx++] = analogRead(PH_PIN);
    if (phIdx == PH_ARRAY_LEN) phIdx = 0;
    phSampleAt = now;
  }

  // print unified JSON payload once per second
  if (now - lastPrintAt >= PH_PRINT_INTERVAL_MS) {
    lastPrintAt = now;
    
    // Calculate pH
    double phAdcAvg = avgArray_dropMinMax(phArray, PH_ARRAY_LEN);
    double phVolt   = phAdcAvg * (5.0 / ADC_RES);
    double pH       = 3.5 * phVolt + PH_OFFSET;

    // Calculate DO
    uint16_t doRaw  = analogRead(DO_PIN);
    double   do_mV  = (doRaw * VREF_MV) / ADC_RES;
    double   do_mgL = DO_ENABLE_LINEAR ? (DO_SLOPE * do_mV + DO_INTERCEPT) : -1.0;

    // Calculate CO2
    uint16_t co2Raw = analogRead(CO2_PIN);
    double co2Ppm = (double)co2Raw; // Placeholder

    // Calculate Temp
    String tempStr = "null";
    if (tempSelected) {
      float temp = ds1.getTempC();
      if (!isnan(temp) && temp >= -50 && temp <= 100) {
        tempStr = String(temp, 2);
      }
    }

    Serial.print("{\"pH\":");
    Serial.print(pH, 2);
    Serial.print(",\"do_mg_l\":");
    Serial.print(do_mgL, 2);
    Serial.print(",\"CO2\":");
    Serial.print(co2Ppm, 1);
    Serial.print(",\"temp_c\":");
    Serial.print(tempStr);
    Serial.print(",\"feeding\":");
    Serial.print(feeding ? "true" : "false");
    
    if (rtcAvailable) {
      DateTime rtcNow = RTC.now();
      Serial.print(",\"timestamp\":\"");
      Serial.print(rtcNow.year()); Serial.print("-");
      if (rtcNow.month() < 10) Serial.print("0"); Serial.print(rtcNow.month()); Serial.print("-");
      if (rtcNow.day() < 10) Serial.print("0"); Serial.print(rtcNow.day()); Serial.print("T");
      if (rtcNow.hour() < 10) Serial.print("0"); Serial.print(rtcNow.hour()); Serial.print(":");
      if (rtcNow.minute() < 10) Serial.print("0"); Serial.print(rtcNow.minute()); Serial.print(":");
      if (rtcNow.second() < 10) Serial.print("0"); Serial.print(rtcNow.second()); Serial.print("Z\"");
    }
    Serial.println("}");
  }
}
