#include <Servo.h>
#include <OneWire.h>
#include <DallasTemperature.h>

/*
 * FISHLINIC FIRMWARE v3.1 (Non-Blocking + Active-LOW LED Fix)
 * -----------------------------------------------------------
 * A0: pH Sensor
 * A1: Dissolved Oxygen (DO)
 * D2: Temperature (OneWire DS18B20)
 * D6: Smart LED (Relay/PWM)
 * D7: Air Pump (Relay)
 * D9: Feeder (Servo)
 */

#define PIN_PH      A0
#define PIN_DO      A1
#define PIN_TEMP    2
#define PIN_LED     6
#define PIN_PUMP    7
#define PIN_SERVO   9
#define SAMPLE_COUNT 10

Servo feederServo;
OneWire oneWire(PIN_TEMP);
DallasTemperature sensors(&oneWire);

float curPH = 7.0, curTemp = 25.0, curDO = 8.0;
String inputBuffer = "";
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  
  // INITIAL STATES
  digitalWrite(PIN_PUMP, LOW);  // Pump OFF at boot
  digitalWrite(PIN_LED, HIGH); // FIXED: HIGH turns Active-LOW relay OFF
  
  feederServo.attach(PIN_SERVO);
  feederServo.write(0);
  sensors.begin();
}

void loop() {
  // 1. FAST SERIAL READ (Non-blocking)
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      handleSerialCommand(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }

  // 2. TIMED SENSOR SEND (Every 1 second)
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= 1000) {
    lastSendTime = currentMillis;
    updateSensors();

    Serial.print("{\"pH\":");
    Serial.print(curPH, 2);
    Serial.print(",\"temp_c\":");
    Serial.print(curTemp, 1);
    Serial.print(",\"do_mg_l\":");
    Serial.print(curDO, 2);
    Serial.println("}");
  }
}

void updateSensors() {
  sensors.requestTemperatures();
  float t = sensors.getTempCByIndex(0);
  if (t > -50 && t < 100) curTemp = t;

  long phSum = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) phSum += analogRead(PIN_PH);
  curPH = (phSum / SAMPLE_COUNT) * (5.0 / 1023.0) * 3.5;

  long doSum = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) doSum += analogRead(PIN_DO);
  curDO = (doSum / SAMPLE_COUNT) * (5.0 / 1023.0) * 3.0;
}

void handleSerialCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  // FEEDER
  if (cmd.indexOf("\"cmd\":\"feed\"") > -1) {
    feederServo.write(100);
    delay(1500);
    feederServo.write(0);
  }
  // PUMP (Active-HIGH)
  else if (cmd == "PUMP_ON") {
    digitalWrite(PIN_PUMP, HIGH);
  }
  else if (cmd == "PUMP_OFF") {
    digitalWrite(PIN_PUMP, LOW);
  }
  // LED (Active-LOW)
  else if (cmd.indexOf("\"type\":\"LED_STRIP\"") > -1) {
    if (cmd.indexOf("\"state\":true") > -1) {
      digitalWrite(PIN_LED, LOW);   // LOW turns Active-LOW relay ON
    } else {
      digitalWrite(PIN_LED, HIGH);  // HIGH turns Active-LOW relay OFF
    }
  }
}
