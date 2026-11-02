/*
  ==============================================================================
  Predict X — ESP32 Production Telemetry Firmware
  Project: AIoT-Based Predictive Maintenance for Three-Phase AC Induction Motors
  Author: Predict X Engineering Team (Himesh & Team)
  
  Hardware Target: ESP32 DevKit V1 (30-pin / 38-pin dual-core Xtensa)
  Sensors & Circuit Mapping:
    1. AC Current: SCT-013-000 Non-Invasive CT (ADC GPIO 32 via 1.65V DC bias)
    2. AC Voltage: ZMPT101B Active Transformer / Voltage Sensor (ADC GPIO 35)
    3. Motor Temperature: DS18B20 Digital Sensor (GPIO 4 with 4.7k pullup)
    4. Motor Vibration: MPU6050 6-Axis Accelerometer (I2C: SDA=21, SCL=22)

  Cloud Telemetry:
    - 1Hz rolling True RMS digital signal processing (DSP)
    - Transmits HTTPS JSON directly to Render Cloud Backend
    - Built-in WiFiClientSecure with SSL encryption & automatic reconnection
  ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

// ==============================================================================
// 1. NETWORK & CLOUD BACKEND SETTINGS
// ==============================================================================
// Replace with your Wi-Fi credentials (hotspot or home/lab router):
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Live Render Cloud Backend Telemetry Ingestion Endpoint:
const char* BACKEND_SERVER = "https://predictx-backend-16j8.onrender.com/api/v1/readings";

// Motor Unit Identifier (must match dashboard filter):
const char* MOTOR_ID       = "MOTOR-001";

// RMS Sampling Interval (1000 ms = 1 Hz telemetry reporting):
const int SAMPLE_WINDOW_MS = 1000;

// ==============================================================================
// 2. HARDWARE PIN DEFINITIONS (MATCHING CIRCUIT SCHEMATIC)
// ==============================================================================
#define CURRENT_ADC_PIN   32   // Current CT Sensor Analog In (GPIO 32)
#define VOLTAGE_ADC_PIN   35   // AC Voltage Sensor Analog In (GPIO 35)
#define ONE_WIRE_BUS      4    // DS18B20 Temperature Digital Pin (GPIO 4)
#define I2C_SDA_PIN       21   // MPU6050 I2C Data Pin
#define I2C_SCL_PIN       22   // MPU6050 I2C Clock Pin
#define MPU6050_ADDR      0x68 // Default I2C address for MPU6050

// ==============================================================================
// 3. SENSOR CALIBRATION FACTORS
// ==============================================================================
// SCT-013-000 (100A:50mA). With 33 Ohm burden resistor -> 1.65V peak at 100A
const float CURRENT_CALIBRATION = 30.0;          // Amperes per Volt ADC scale
const float VOLTAGE_CALIBRATION = 230.0 / 0.707; // Calibration factor for 230V AC RMS

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// MPU6050 Accelerometer Register
const int MPU_REG_ACCEL_XOUT_H = 0x3B;

void initMPU6050() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake up MPU6050 sensor
  byte err = Wire.endTransmission(true);
  if (err == 0) {
    Serial.println("[MPU6050] Accelerometer online (I2C 0x68)");
  } else {
    Serial.printf("[MPU6050] Warning: Init failed with code %d. Check SDA/SCL wiring.\n", err);
  }
}

// Read raw acceleration on X-axis from MPU6050 (in g's)
float readRawAccelX() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU_REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6050_ADDR, 2, true);

  if (Wire.available() >= 2) {
    int16_t rawX = (Wire.read() << 8) | Wire.read();
    // Sensitivity scale factor for +/- 2g is 16384 LSB/g
    return (float)rawX / 16384.0;
  }
  return 0.0;
}

void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connected successfully!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println();
    Serial.println("[WiFi] Connection failed. Will retry in background loop.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1200);

  Serial.println("\n=======================================================");
  Serial.println("  PREDICT X — Three-Phase AC Motor IoT Telemetry Node   ");
  Serial.println("=======================================================");

  // Initialize sensors
  tempSensor.begin();
  initMPU6050();

  // Configure ESP32 12-bit ADC (0 - 4095) with 11dB attenuation (~3.3V full scale)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Connect to local Wi-Fi
  connectToWiFi();
}

void loop() {
  // Ensure Wi-Fi is active
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  unsigned long windowStart = millis();

  // True RMS accumulators
  double currentSumSq = 0.0;
  double voltageSumSq = 0.0;
  double vibrationSumSq = 0.0;
  unsigned long sampleCount = 0;

  // DC offset reference (for 3.3V ADC with mid-rail 1.65V bias = 2048 counts)
  const float V_MID = 2048.0;

  // 1-Second Rolling High-Frequency Sampling (~1 kHz sample rate)
  while (millis() - windowStart < SAMPLE_WINDOW_MS) {
    float rawCurrent = (float)analogRead(CURRENT_ADC_PIN) - V_MID;
    float rawVoltage = (float)analogRead(VOLTAGE_ADC_PIN) - V_MID;
    float rawVibX    = readRawAccelX();

    currentSumSq   += (rawCurrent * rawCurrent);
    voltageSumSq   += (rawVoltage * rawVoltage);
    vibrationSumSq += (rawVibX * rawVibX);
    sampleCount++;

    delayMicroseconds(500); // 1-2 kHz sampling rate
  }

  if (sampleCount == 0) sampleCount = 1;

  // 1. Digital True RMS Current (Amperes)
  float currentRmsAdc = sqrt(currentSumSq / sampleCount);
  float currentA = (currentRmsAdc / 4095.0 * 3.3) * CURRENT_CALIBRATION;

  // 2. Digital True RMS Voltage (Volts)
  float voltageRmsAdc = sqrt(voltageSumSq / sampleCount);
  float voltageV = (voltageRmsAdc / 4095.0 * 3.3) * (VOLTAGE_CALIBRATION / 3.3);

  // 3. Digital Vibration Acceleration RMS (g_rms)
  float vibrationG = sqrt(vibrationSumSq / sampleCount);

  // 4. Digital Motor Temperature from DS18B20 (°C)
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C || tempC < -50.0 || tempC > 150.0) {
    tempC = 25.0; // Graceful ambient baseline if sensor unclipped
  }

  // Filter low-level ADC noise clamps
  if (currentA < 0.05) currentA = 0.0;
  if (voltageV < 5.0)  voltageV = 0.0;

  // Print telemetry diagnostics to Serial Monitor
  Serial.printf("[Sensor Telemetry] I: %.2f A | V: %.1f V | Temp: %.1f C | Vib: %.3f g (Samples: %lu)\n",
                currentA, voltageV, tempC, vibrationG, sampleCount);

  // Transmit payload to Cloud Backend
  if (WiFi.status() == WL_CONNECTED) {
    String serverUrl = String(BACKEND_SERVER);
    bool isHttps = serverUrl.startsWith("https://");

    HTTPClient http;

    if (isHttps) {
      WiFiClientSecure secureClient;
      secureClient.setInsecure(); // Bypasses root CA cert check for cloud endpoints (Render/Heroku/AWS)
      http.begin(secureClient, serverUrl);
    } else {
      WiFiClient plainClient;
      http.begin(plainClient, serverUrl);
    }

    http.addHeader("Content-Type", "application/json");
    http.setTimeout(4000); // 4-second cloud timeout

    // JSON Payload adhering to Predict X Ingestion Specification
    String payload = "{";
    payload += "\"motorId\":\"" + String(MOTOR_ID) + "\",";
    payload += "\"source\":\"hardware_esp32\",";
    payload += "\"quality\":\"valid\",";
    payload += "\"current\":{\"value\":" + String(currentA, 3) + ",\"unit\":\"A\"},";
    payload += "\"voltage\":{\"value\":" + String(voltageV, 1) + ",\"unit\":\"V\"},";
    payload += "\"temperature\":{\"value\":" + String(tempC, 2) + ",\"unit\":\"degC\"},";
    payload += "\"vibration\":{\"value\":" + String(vibrationG, 4) + ",\"unit\":\"g_rms\",\"axis\":\"X\"}";
    payload += "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.printf("[Cloud Transmission] SUCCESS (HTTP %d) -> Sent to %s\n", httpResponseCode, BACKEND_SERVER);
    } else if (httpResponseCode > 0) {
      Serial.printf("[Cloud Transmission] Warning (HTTP %d) -> %s\n", httpResponseCode, http.getString().c_str());
    } else {
      Serial.printf("[Cloud Transmission] Failed: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("[WiFi] Lost connection, reconnecting...");
    WiFi.reconnect();
  }
}
