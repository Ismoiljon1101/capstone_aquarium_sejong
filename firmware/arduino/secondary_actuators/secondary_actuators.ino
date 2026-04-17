#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>

// -------- Temperature --------
#define ONE_WIRE_BUS 2
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// -------- RTC --------
RTC_DS3231 rtc;

// -------- Servo --------
Servo feeder;

// -------- Sensors --------
int phPin = A0;
int doPin = A1;

// -------- Timer --------
unsigned long previousMillis = 0;
const long interval = 25000; // 25 seconds

void setup() {
  Serial.begin(9600);

  sensors.begin();
  rtc.begin();

  feeder.attach(9);
  feeder.write(0); // initial position

  Serial.println("System Started");
}

void loop() {

  // 🌡️ TEMPERATURE
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  // 🧪 PH SENSOR
  int phValue = analogRead(phPin);
  float phVoltage = phValue * (5.0 / 1023.0);
  float ph = 3.5 * phVoltage;

  // 💧 DO SENSOR
  int doValue = analogRead(doPin);
  float oxygen = doValue * (5.0 / 1023.0);

  // ⏰ RTC TIME
  DateTime now = rtc.now();

  // 📤 PRINT DATA
  Serial.print("Temp: ");
  Serial.print(temp);
  Serial.print(" C | pH: ");
  Serial.print(ph);
  Serial.print(" | DO: ");
  Serial.print(oxygen);

  Serial.print(" | Time: ");
  Serial.print(now.hour());
  Serial.print(":");
  Serial.print(now.minute());
  Serial.print(":");
  Serial.println(now.second());

  // 🍽️ FEED EVERY 10 SECONDS (NON-BLOCKING)
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    feedFish();
  }

  delay(2000);
}

// -------- FEED FUNCTION --------
void feedFish() {
  Serial.println("Feeding Fish...");

  feeder.write(90);  // open
  delay(2000);

  feeder.write(0);   // close
}