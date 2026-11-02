/*
  MotorGuard AI — ESP32 Telemetry Firmware
  Project: AI-Based Predictive Maintenance for an AC Induction Motor
  Author: IoT Engineering Team
  Hardware: ESP32 DevKit V1 (Xtensa dual-core) + Sensors:
    1. AC Current: SCT-013-000 Non-Invasive CT Sensor (GPIO 34 ADC1_CH6)
    2. AC Voltage: ZMPT101B Active Voltage Transformer (GPIO 35 ADC1_CH7)
    3. Motor Temperature: DS18B20 1-Wire Digital Sensor (GPIO 4)
    4. Vibration: MPU6050 6-Axis Accelerometer/Gyro (I2C: SDA=GPIO 21, SCL=GPIO 22)

  Transmits: 1Hz Preprocessed True RMS Telemetry JSON to MotorGuard Backend
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

// ---------------- CONFIGURATION SETTINGS ----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Live Render Production Endpoint (or local IP for offline testing):
const char* BACKEND_SERVER = "https://predictx-backend-16j8.onrender.com/api/v1/readings";

const char* MOTOR_ID      = "MOTOR-001";
const int SAMPLE_WINDOW_MS = 1000; // 1-second rolling true RMS calculation window

// ---------------- SENSOR PIN DEFINITIONS (MATCHING CIRCUIT DIAGRAM) ----------------
#define CURRENT_ADC_PIN   32 // Analog Pin for Current CT sensor module (GPIO 32)
#define ONE_WIRE_BUS      4  // Digital Pin for DS18B20 Temp sensor (GPIO 4 with 4.7k pullup)
#define MPU6050_ADDR      0x68 // I2C Address for MPU6050 (SDA=GPIO 21, SCL=GPIO 22)
#define VOLTAGE_ADC_PIN   35 // Optional Analog Pin for Voltage Transformer (GPIO 35)

// ---------------- CALIBRATION CONSTANTS ----------------
// SCT-013-000: 100A / 50mA. With 33 Ohm burden resistor -> 1.65V peak at 100A peak
const float CURRENT_CALIBRATION = 30.0; // Calibration coefficient for A/V
const float VOLTAGE_CALIBRATION = 230.0 / 0.707; // Calibration factor to convert V_RMS from ADC

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// MPU6050 registers
const int MPU_REG_ACCEL_XOUT_H = 0x3B;

void initMPU6050() {
  Wire.begin(21, 22); // SDA=21, SCL=22
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake up MPU6050
  Wire.endTransmission(true);
}

// Read raw acceleration from MPU6050 (in g's)
float readRawAccelX() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU_REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6050_ADDR, 2, true);
  
  if (Wire.available() >= 2) {
    int16_t rawX = (Wire.read() << 8) | Wire.read();
    // Default range is +/- 2g: sensitivity is 16384 LSB/g
    return (float)rawX / 16384.0;
  }
  return 0.0;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== MotorGuard AI: ESP32 Telemetry Node Starting ===");

  // Initialize Sensors
  tempSensor.begin();
  initMPU6050();

  // Configure ADC (ESP32 ADC is 12-bit: 0 - 4095)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full-scale voltage approx 3.3V

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Running telemetry loop (will retry connection)...");
  }
}

void loop() {
  unsigned long windowStart = millis();

  // Accumulators for True RMS calculation
  double currentSumSq = 0;
  double voltageSumSq = 0;
  double vibrationSumSq = 0;
  unsigned long sampleCount = 0;

  // Midpoint reference voltage (ADC mid ~ 2048 for AC signals biased at 1.65V)
  const float V_MID = 2048.0;

  // 1-second sampling window (~1000 samples)
  while (millis() - windowStart < SAMPLE_WINDOW_MS) {
    float rawCurrent = (float)analogRead(CURRENT_ADC_PIN) - V_MID;
    float rawVoltage = (float)analogRead(VOLTAGE_ADC_PIN) - V_MID;
    float rawVibX    = readRawAccelX();

    currentSumSq += (rawCurrent * rawCurrent);
    voltageSumSq += (rawVoltage * rawVoltage);
    vibrationSumSq += (rawVibX * rawVibX);
    sampleCount++;

    delayMicroseconds(500); // ~1 kHz sample rate
  }

  // 1. Compute True RMS Current (A)
  float currentRmsAdc = sqrt(currentSumSq / sampleCount);
  float currentA = (currentRmsAdc / 4095.0 * 3.3) * CURRENT_CALIBRATION;

  // 2. Compute True RMS Voltage (V)
  float voltageRmsAdc = sqrt(voltageSumSq / sampleCount);
  float voltageV = (voltageRmsAdc / 4095.0 * 3.3) * (VOLTAGE_CALIBRATION / 3.3);

  // 3. Compute Acceleration RMS (g_rms)
  float vibrationG = sqrt(vibrationSumSq / sampleCount);

  // 4. Read Temperature from DS18B20 (°C)
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C) {
    tempC = 25.0; // Fallback ambient reading if disconnected
  }

  // Sanity Clamps for Sensor Noise
  if (currentA < 0.05) currentA = 0.0;
  if (voltageV < 5.0) voltageV = 0.0;

  Serial.printf("\n[Telemetry] Current: %.2f A | Voltage: %.1f V | Temp: %.1f C | Vib: %.3f g\n",
                currentA, voltageV, tempC, vibrationG);

  // Construct Ingestion Payload for Backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(BACKEND_SERVER);
    http.addHeader("Content-Type", "application/json");

    String payload = "{";
    payload += "\"motorId\":\"" + String(MOTOR_ID) + "\",";
    payload += "\"source\":\"hardware_esp32\",";
    payload += "\"quality\":\"valid\",";
    payload += "\"current\":{\"value\":" + String(currentA, 3) + ",\"unit\":\"A\"},";
    payload += "\"voltage\":{\"value\":" + String(voltageV, 1) + ",\"unit\":\"V\"},";
    payload += "\"temperature\":{\"value\":" + String(tempC, 2) + ",\"unit\":\"degC\"},";
    payload += "\"vibration\":{\"value\":" + String(vibrationG, 4) + ",\"unit\":\"g_rms\",\"axis\":\"X\"}";
    payload += "}";

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.printf("[HTTP] POST Result: %d (Success)\n", httpCode);
    } else {
      Serial.printf("[HTTP] Error sending telemetry: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[WiFi] Not connected, attempting reconnection...");
    WiFi.reconnect();
  }
}
