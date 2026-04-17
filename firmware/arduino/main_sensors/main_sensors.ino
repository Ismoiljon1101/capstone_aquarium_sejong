// =============================================================================
// Main Arduino: pH Sensor (A0), DO Sensor (A1), CO2 Sensor (A2), RTC Module
// Temperature comes from Secondary Arduino
// =============================================================================

#include <Wire.h>
#include "RTClib.h"

// --- pH config ---
#define PH_ARRAY_LEN 40
#define PH_SAMPLING_INTERVAL_MS 20
#define PH_PRINT_INTERVAL_MS 1000
float PH_OFFSET = 0.00f;  // <-- adjust after calibration
const int PH_PIN = A0;

// --- DO sensor config ---
const int DO_PIN = A1;
const bool DO_ENABLE_LINEAR = true;
float DO_SLOPE = 0.0025f; 
float DO_INTERCEPT = 0.0f;

// --- CO2 sensor config ---
const int CO2_PIN = A2;

// --- ADC / Vref assumptions ---
const float VREF_MV = 5000.0f;
const float ADC_RES = 1024.0f;

// pH averaging
int   phArray[PH_ARRAY_LEN];
int   phIdx = 0;
unsigned long phSampleAt = 0;
unsigned long lastPrintAt = 0;

// RTC
RTC_DS1307 RTC;
bool rtcAvailable = false;

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
  
  if (RTC.begin()) {
    rtcAvailable = true;
    if (!RTC.isrunning()) {
      RTC.adjust(DateTime(__DATE__, __TIME__));
    }
  }

  int seed = analogRead(PH_PIN);
  for (int i = 0; i < PH_ARRAY_LEN; i++) phArray[i] = seed;
  phSampleAt = millis();
  lastPrintAt = millis();
  
  Serial.println("{\"status\":\"main_ready\",\"rtc\":" + String(rtcAvailable ? "true" : "false") + "}");
}

void loop() {
  unsigned long now = millis();

  // ph sampling
  if (now - phSampleAt >= PH_SAMPLING_INTERVAL_MS) {
    phArray[phIdx++] = analogRead(PH_PIN);
    if (phIdx == PH_ARRAY_LEN) phIdx = 0;
    phSampleAt = now;
  }

  // print once per second
  if (now - lastPrintAt >= PH_PRINT_INTERVAL_MS) {
    lastPrintAt = now;
    
    double phAdcAvg = avgArray_dropMinMax(phArray, PH_ARRAY_LEN);
    double phVolt   = phAdcAvg * (5.0 / ADC_RES);
    double pH       = 3.5 * phVolt + PH_OFFSET;

    uint16_t doRaw  = analogRead(DO_PIN);
    double   do_mV  = (doRaw * VREF_MV) / ADC_RES;
    double   do_mgL = DO_ENABLE_LINEAR ? (DO_SLOPE * do_mV + DO_INTERCEPT) : -1.0;

    // CO2 reading (Simple analog estimation - replace with specific formula if known)
    uint16_t co2Raw = analogRead(CO2_PIN);
    double co2Ppm = (double)co2Raw; // placeholder, adjust per sensor spec

    Serial.print("{\"pH\":");
    Serial.print(pH, 2);
    Serial.print(",\"do_mg_l\":");
    Serial.print(do_mgL, 2);
    Serial.print(",\"CO2\":");
    Serial.print(co2Ppm, 1);
    
    if (rtcAvailable) {
      DateTime rtcNow = RTC.now();
      Serial.print(",\"rtc\":\"");
      Serial.print(rtcNow.year()); Serial.print("-");
      if (rtcNow.month() < 10) Serial.print("0"); Serial.print(rtcNow.month()); Serial.print("-");
      if (rtcNow.day() < 10) Serial.print("0"); Serial.print(rtcNow.day()); Serial.print("T");
      if (rtcNow.hour() < 10) Serial.print("0"); Serial.print(rtcNow.hour()); Serial.print(":");
      if (rtcNow.minute() < 10) Serial.print("0"); Serial.print(rtcNow.minute()); Serial.print(":");
      if (rtcNow.second() < 10) Serial.print("0"); Serial.print(rtcNow.second()); Serial.print("\"");
    }
    Serial.println("}");
  }
}
