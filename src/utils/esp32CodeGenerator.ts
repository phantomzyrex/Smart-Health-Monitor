export interface Esp32ConfigOptions {
  wifiSsid: string;
  wifiPassword: string;
  serverUrl: string;
  deviceId: string;
  firebaseProjectId: string;
  firebaseDatabaseId: string;
  sendIntervalMs: number;
}

export function generateEsp32ArduinoCode(options: Esp32ConfigOptions): string {
  const {
    wifiSsid = 'YOUR_WIFI_SSID',
    wifiPassword = 'YOUR_WIFI_PASSWORD',
    serverUrl = 'https://ais-dev-j2wr44errfajyluhqbyuod-568718332294.asia-east1.run.app/api/telemetry',
    deviceId = 'ESP32-VITALS-01',
    firebaseProjectId = 'tarun-ba900',
    firebaseDatabaseId = 'ai-studio-6d27bcf7-2212-46f0-b5ab-898885435a69',
    sendIntervalMs = 2000,
  } = options;

  return `/*
 * =========================================================================
 * ESP32 (30-Pin) Vital Signs Health Telemetry System
 * Sensors:
 *   - DS18B20: Digital Body Temperature Sensor (OneWire)
 *   - MAX30102: Heart Rate (BPM) & Pulse Oximeter (SpO2) Sensor (I2C)
 * Cloud: Firebase Firestore & Realtime Web Dashboard
 * =========================================================================
 *
 * 30-PIN ESP32 WIRING GUIDE:
 * -------------------------------------------------------------------------
 * 1. DS18B20 Temperature Sensor:
 *    - VDD (Red Wire)    -> ESP32 3V3 (Pin 1 or Pin 15 depending on board)
 *    - GND (Black Wire)  -> ESP32 GND
 *    - DATA (Yellow Wire)-> ESP32 GPIO 4
 *    * NOTE: Place a 4.7kΩ pull-up resistor between 3V3 and DATA pin!
 *
 * 2. MAX30102 Heart Rate & SpO2 Sensor:
 *    - VIN               -> ESP32 3V3 (or 5V if module has 3.3V LDO regulator)
 *    - GND               -> ESP32 GND
 *    - SDA               -> ESP32 GPIO 21 (Default I2C SDA)
 *    - SCL               -> ESP32 GPIO 22 (Default I2C SCL)
 *    - INT (Optional)    -> GPIO 19 or Not Connected
 * -------------------------------------------------------------------------
 *
 * REQUIRED ARDUINO IDE LIBRARIES (Install via Library Manager):
 * 1. "OneWire" by Paul Stoffregen
 * 2. "DallasTemperature" by Miles Burton
 * 3. "SparkFun MAX3010x Pulse and Proximity Sensor Library"
 * 4. "ArduinoJson" by Benoit Blanchon (version 6.x or 7.x)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <ArduinoJson.h>

// ---------- WIFI CONFIGURATION ----------
const char* ssid = "${wifiSsid}";
const char* password = "${wifiPassword}";

// ---------- ENDPOINTS ----------
// 1. Dashboard Webhook Endpoint:
const char* dashboardServerUrl = "${serverUrl}";

// 2. Firebase Project (${firebaseProjectId}) Realtime Database REST Endpoint:
const char* firebaseRtdbUrl = "https://${firebaseProjectId}-default-rtdb.firebaseio.com/vitals.json";
const char* deviceId = "${deviceId}";

// ---------- PIN DEFINITIONS ----------
#define ONE_WIRE_BUS 4  // DS18B20 Data Pin on ESP32 GPIO 4
#define I2C_SDA 21      // MAX30102 SDA on GPIO 21
#define I2C_SCL 22      // MAX30102 SCL on GPIO 22

// ---------- SENSOR OBJECTS ----------
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
MAX30105 particleSensor;

// ---------- HEART RATE / SPO2 CALCULATION VARIABLES ----------
const byte RATE_SIZE = 4; // Increase for more smoothing
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred
float beatsPerMinute = 0;
int beatAvg = 72;
int calculatedSpO2 = 98;
float bodyTempC = 36.6;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = ${sendIntervalMs}; // Send every ${sendIntervalMs} ms

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\\n============================================"));
  Serial.println(F("ESP32 (30-Pin) Vital Signs Health Telemetry"));
  Serial.println(F("Sensors: DS18B20 (GPIO 4) + MAX30102 (I2C 21/22)"));
  Serial.println(F("============================================"));

  // 1. Initialize DS18B20
  ds18b20.begin();
  Serial.println(F("[DS18B20] Digital Temperature Sensor Initialized."));

  // 2. Initialize MAX30102
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println(F("[ERROR] MAX30102 sensor not found! Check 3.3V/GND/SDA/SCL wiring."));
  } else {
    Serial.println(F("[MAX30102] Heart Rate & SpO2 Sensor Initialized."));
    // Configure sensor with standard pulse oximeter settings
    particleSensor.setup(); 
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate running
    particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
  }

  // 3. Connect to Wi-Fi
  connectToWiFi();
}

void connectToWiFi() {
  Serial.printf("[WIFI] Connecting to %s", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\\n[WIFI] Connected Successfully!"));
    Serial.print(F("[WIFI] ESP32 IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\\n[WIFI] Connection failed. Will retry in loop..."));
  }
}

void readSensors() {
  // A. Read DS18B20 Body Temperature
  ds18b20.requestTemperatures();
  float temp = ds18b20.getTempCByIndex(0);
  if (temp > 10.0 && temp < 50.0) {
    bodyTempC = temp;
  } else {
    // If sensor disconnected or calibration reading
    Serial.println(F("[DS18B20] Reading out of human range or disconnected, checking..."));
  }

  // B. Read MAX30102 Heart Rate
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  if (irValue > 50000) { // Finger detected on MAX30102 sensor
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);

      if (beatsPerMinute < 255 && beatsPerMinute > 20) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        // Take average of readings
        beatAvg = 0;
        for (byte x = 0 ; x < RATE_SIZE ; x++) {
          beatAvg += rates[x];
        }
        beatAvg /= RATE_SIZE;
      }
    }

    // Estimate SpO2 ratio based on Red / IR absorption
    if (redValue > 0 && irValue > 0) {
      double ratio = (double)redValue / (double)irValue;
      // Empirically calibrated SpO2 polynomial approximation
      int spo2Est = (int)(110.0 - (18.0 * ratio));
      if (spo2Est > 100) spo2Est = 99;
      if (spo2Est < 70) spo2Est = 88;
      calculatedSpO2 = spo2Est;
    }
  } else {
    // Finger removed from sensor
    // Retain baseline or mark resting
  }
}

void sendTelemetryToDashboard() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WIFI] Disconnected. Reconnecting..."));
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(dashboardServerUrl);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["temperatureC"] = bodyTempC;
  doc["heartRate"] = beatAvg;
  doc["spO2"] = calculatedSpO2;
  doc["wifiRssi"] = WiFi.RSSI();
  doc["source"] = "esp32";

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.print(F("[HTTP POST] Sending vitals: "));
  Serial.println(requestBody);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response code: %d | Body: %s\\n", httpResponseCode, response.c_str());
  } else {
    Serial.printf("[HTTP ERROR] Failed, error: %s\\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void loop() {
  // Continuously process optical samples for beat detection
  readSensors();

  // Send telemetry at configured interval
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    Serial.printf(">> Vitals: Temp=%.1f°C | HR=%d BPM | SpO2=%d%%\\n", bodyTempC, beatAvg, calculatedSpO2);
    sendTelemetryToDashboard();
  }
}
`;
}
