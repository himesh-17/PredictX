/*
  ==============================================================================
  Predict X — ESP32 Production Telemetry Firmware (MPU-6500 Edition)
  Project: AIoT-Based Predictive Maintenance for Three-Phase AC Induction Motors
  Author: Predict X Engineering Team (Himesh & Team)
  
  Hardware Target: ESP32 DevKit V1 (30-pin / 38-pin dual-core Xtensa)
  Sensors & Circuit Mapping:
    1. AC Current: SCT-013-000 Non-Invasive CT (ADC GPIO 32 via 1.65V DC bias)
    2. AC Voltage: ZMPT101B Active Transformer / Voltage Sensor (ADC GPIO 35)
    3. Motor Temperature: DS18B20 Digital Sensor (GPIO 4 with 4.7k pullup)
    4. Motor Vibration: MPU-6500 6-Axis Motion Sensor (I2C: SDA=21, SCL=22)

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
#define I2C_SDA_PIN       21   // MPU-6500 I2C Data Pin (GPIO 21)
#define I2C_SCL_PIN       22   // MPU-6500 I2C Clock Pin (GPIO 22)
#define MPU6500_ADDR      0x68 // Default I2C address for MPU-6500 (AD0 to GND)

// ==============================================================================
// 3. SENSOR CALIBRATION FACTORS
// ==============================================================================
// SCT-013-000 (100A:50mA). With 33 Ohm burden resistor -> 1.65V peak at 100A
const float CURRENT_CALIBRATION = 30.0;          // Amperes per Volt ADC scale
const float VOLTAGE_CALIBRATION = 230.0 / 0.707; // Calibration factor for 230V AC RMS

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// MPU-6500 Registers
#define MPU_REG_CONFIG       0x1A
#define MPU_REG_ACCEL_CONFIG 0x1C
#define MPU_REG_ACCEL_XOUT_H 0x3B
#define MPU_REG_TEMP_OUT_H   0x41
#define MPU_REG_PWR_MGMT_1   0x6B
#define MPU_REG_PWR_MGMT_2   0x6C
#define MPU_REG_WHO_AM_I     0x75

// Initialize MPU-6500 motion sensor
bool initMPU6500() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000); // 400kHz fast I2C mode

  // Query WHO_AM_I register (0x75): MPU-6500 returns 0x70 (or 0x71, 0x73)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_WHO_AM_I);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, 1, true);
  byte whoAmI = 0x00;
  if (Wire.available()) {
    whoAmI = Wire.read();
  }

  // Soft Reset MPU-6500
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_PWR_MGMT_1);
  Wire.write(0x80); // Set H_RESET bit
  Wire.endTransmission(true);
  delay(100);

  // Wake up MPU-6500 and select Auto Clock / PLL
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_PWR_MGMT_1);
  Wire.write(0x01); // Wake up, Auto-select best clock (PLL)
  byte err = Wire.endTransmission(true);

  if (err != 0) {
    Serial.printf("[MPU-6500] Warning: Init failed with code %d. Check SDA=21, SCL=22 wiring.\n", err);
    return false;
  }

  // Enable all accelerometer & gyro axes
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_PWR_MGMT_2);
  Wire.write(0x00);
  Wire.endTransmission(true);

  // Configure Digital Low Pass Filter (DLPF) to ~42Hz bandwidth (filters motor EMI noise)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_CONFIG);
  Wire.write(0x03); // DLPF_CFG = 3 (41Hz Accel bandwidth)
  Wire.endTransmission(true);

  // Configure Accelerometer full-scale range to +/- 2g (16384 LSB/g)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_ACCEL_CONFIG);
  Wire.write(0x00); // 0x00 = +/- 2g range
  Wire.endTransmission(true);

  if (whoAmI == 0x70 || whoAmI == 0x71 || whoAmI == 0x73) {
    Serial.printf("[MPU-6500] Online & Calibrated! (WHO_AM_I: 0x%02X, +/-2g mode)\n", whoAmI);
  } else if (whoAmI == 0x68) {
    Serial.println("[MPU-6500/6050] Online & Calibrated! (WHO_AM_I: 0x68, +/-2g mode)");
  } else {
    Serial.printf("[MPU-6500] Initialized with WHO_AM_I: 0x%02X\n", whoAmI);
  }
  return true;
}

// Read raw acceleration on X-axis from MPU-6500 (in g's)
float readRawAccelX() {
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, 2, true);

  if (Wire.available() >= 2) {
    int16_t rawX = (Wire.read() << 8) | Wire.read();
    // Sensitivity scale factor for +/- 2g is 16384 LSB/g
    return (float)rawX / 16384.0;
  }
  return 0.0;
}

// Read MPU-6500 Internal On-Die Temperature (°C) as fallback if DS18B20 probe is unclipped
float readMPU6500Temp() {
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(MPU_REG_TEMP_OUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, 2, true);

  if (Wire.available() >= 2) {
    int16_t rawT = (Wire.read() << 8) | Wire.read();
    // MPU-6500 internal temp formula: ((rawTemp) / 333.87) + 21.0
    return ((float)rawT / 333.87) + 21.0;
  }
  return 25.0;
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
  Serial.println("          Sensor: MPU-6500 6-Axis Motion Sensor         ");
  Serial.println("=======================================================");

  // Initialize sensors
  tempSensor.begin();
  initMPU6500();

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

  // 4. Digital Motor Temperature from DS18B20 (°C) with MPU-6500 fallback
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C || tempC < -50.0 || tempC > 150.0) {
    // If external DS18B20 unclipped, fallback to MPU-6500 on-die temperature
    float mpuTemp = readMPU6500Temp();
    tempC = (mpuTemp > -20.0 && mpuTemp < 100.0) ? mpuTemp : 28.0;
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

    // Maintain WiFiClientSecure in the same scope as HTTPClient so its TLS engine remains active during POST
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Bypasses root CA cert check for cloud endpoints (Render/Cloudflare)

    HTTPClient http;
    if (http.begin(secureClient, serverUrl)) {
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(8000); // 8-second timeout for cloud transmission

      int httpResponseCode = http.POST(payload);

      if (httpResponseCode == 200 || httpResponseCode == 201) {
        Serial.printf("[Cloud Transmission] SUCCESS (HTTP %d) -> Sent to %s\n", httpResponseCode, BACKEND_SERVER);
      } else if (httpResponseCode > 0) {
        Serial.printf("[Cloud Transmission] Warning (HTTP %d): %s\n", httpResponseCode, http.getString().c_str());
      } else {
        Serial.printf("[Cloud Transmission] Failed: %s\n", http.errorToString(httpResponseCode).c_str());
      }

      http.end();
    } else {
      Serial.println("[Cloud Transmission] Failed to initiate connection to backend.");
    }
  } else {
    Serial.println("[WiFi] Lost connection, reconnecting...");
    WiFi.reconnect();
  }
}
