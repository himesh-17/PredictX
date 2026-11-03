/*
  ==============================================================================
  Predict X — MPU-6500 Standalone Hardware Test Sketch for ESP32
  ==============================================================================
  No external libraries needed! Uses built-in Wire.h (I2C).
  
  Wiring Connection:
    MPU-6500 VCC   ---> ESP32 3V3 (or 5V if module has onboard 3.3V regulator)
    MPU-6500 GND   ---> ESP32 GND
    MPU-6500 SDA   ---> ESP32 GPIO 21
    MPU-6500 SCL   ---> ESP32 GPIO 22
    MPU-6500 AD0   ---> GND (Sets I2C address to 0x68. If AD0=3V3, address is 0x69)
  
  Baud Rate: 115200
  ==============================================================================
*/

#include <Wire.h>
#include <math.h>

#define I2C_SDA_PIN     21
#define I2C_SCL_PIN     22
#define MPU6500_ADDR    0x68 // Default I2C address (AD0 to GND)

// MPU-6500 Registers
#define REG_CONFIG       0x1A
#define REG_GYRO_CONFIG  0x1B
#define REG_ACCEL_CONFIG 0x1C
#define REG_ACCEL_XOUT_H 0x3B
#define REG_TEMP_OUT_H   0x41
#define REG_GYRO_XOUT_H  0x43
#define REG_PWR_MGMT_1   0x6B
#define REG_PWR_MGMT_2   0x6C
#define REG_WHO_AM_I     0x75

// Set to true to view live scrolling graphs in Tools -> Serial Plotter
// Set to false for clean formatted tabular text in Tools -> Serial Monitor
const bool PLOTTER_MODE = false;

bool sensorFound = false;

// Scan I2C bus to check if MPU-6500 is responding
bool scanI2C() {
  Serial.println("\n[I2C Scanner] Scanning bus on SDA=21, SCL=22...");
  byte count = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.printf("[I2C Scanner] Device found at address 0x%02X", address);
      if (address == 0x68) {
        Serial.println("  <-- MPU-6500 detected (AD0=GND)!");
        sensorFound = true;
      } else if (address == 0x69) {
        Serial.println("  <-- MPU-6500 detected (AD0=VCC)!");
        sensorFound = true;
      } else {
        Serial.println();
      }
      count++;
    }
  }
  if (count == 0) {
    Serial.println("[I2C Scanner] ERROR: No I2C devices found! Check wiring: SDA=21, SCL=22, VCC, GND.");
    return false;
  }
  return sensorFound;
}

// Initialize MPU-6500 motion sensor
bool initMPU6500() {
  // Read WHO_AM_I register (MPU-6500 returns 0x70, 0x71, or 0x73)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_WHO_AM_I);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, 1, true);

  byte whoAmI = 0x00;
  if (Wire.available()) {
    whoAmI = Wire.read();
    Serial.printf("[MPU-6500] WHO_AM_I register: 0x%02X", whoAmI);
    if (whoAmI == 0x70 || whoAmI == 0x71 || whoAmI == 0x73) {
      Serial.println(" (Verified MPU-6500 Silicon)");
    } else if (whoAmI == 0x68) {
      Serial.println(" (MPU-6050/6500 compatible)");
    } else {
      Serial.println(" (Unknown identity, proceeding...)");
    }
  }

  // Soft reset
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_PWR_MGMT_1);
  Wire.write(0x80); // H_RESET
  Wire.endTransmission(true);
  delay(100);

  // Wake up and select Auto-PLL clock
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_PWR_MGMT_1);
  Wire.write(0x01); // Clock source: PLL with gyro
  byte err = Wire.endTransmission(true);

  if (err != 0) {
    Serial.printf("[MPU-6500] ERROR: Wake-up failed with error code %d\n", err);
    return false;
  }

  // Enable all axes
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_PWR_MGMT_2);
  Wire.write(0x00);
  Wire.endTransmission(true);

  // Configure Digital Low-Pass Filter (~42Hz bandwidth)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_CONFIG);
  Wire.write(0x03);
  Wire.endTransmission(true);

  // Configure Accelerometer full-scale range to +/- 2g (16384 LSB/g)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_ACCEL_CONFIG);
  Wire.write(0x00); // +/- 2g
  Wire.endTransmission(true);

  // Configure Gyroscope range to +/- 250 deg/s (131 LSB/deg/s)
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_GYRO_CONFIG);
  Wire.write(0x00);
  Wire.endTransmission(true);

  Serial.println("[MPU-6500] Sensor configured in high-precision +/-2g vibration mode!");
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(1200);

  if (!PLOTTER_MODE) {
    Serial.println("\n=======================================================");
    Serial.println("  Predict X — ESP32 + MPU-6500 Hardware Verification  ");
    Serial.println("=======================================================");
  }

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000); // 400 kHz fast I2C mode

  if (scanI2C()) {
    if (initMPU6500()) {
      if (!PLOTTER_MODE) {
        Serial.println("\n>>> MPU-6500 ONLINE! Starting live motor vibration readouts... <<<\n");
        Serial.println("Accel_X(g) | Accel_Y(g) | Accel_Z(g) | Total_Vib(g) | Temp(°C) | Status");
        Serial.println("-------------------------------------------------------------------------");
      }
    }
  }
}

void loop() {
  if (!sensorFound) {
    scanI2C();
    if (sensorFound) initMPU6500();
    delay(2000);
    return;
  }

  // Request 14 bytes: 6 Accel + 2 Temp + 6 Gyro
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, 14, true);

  if (Wire.available() >= 14) {
    int16_t rawAccX = (Wire.read() << 8) | Wire.read();
    int16_t rawAccY = (Wire.read() << 8) | Wire.read();
    int16_t rawAccZ = (Wire.read() << 8) | Wire.read();
    int16_t rawTemp = (Wire.read() << 8) | Wire.read();
    int16_t rawGyrX = (Wire.read() << 8) | Wire.read();
    int16_t rawGyrY = (Wire.read() << 8) | Wire.read();
    int16_t rawGyrZ = (Wire.read() << 8) | Wire.read();

    // Accelerometer +/- 2g: 16384 LSB/g
    float ax = (float)rawAccX / 16384.0;
    float ay = (float)rawAccY / 16384.0;
    float az = (float)rawAccZ / 16384.0;

    // Total Acceleration Vector: sqrt(ax^2 + ay^2 + az^2)
    float totalG = sqrt(ax * ax + ay * ay + az * az);

    // MPU-6500 on-die temperature: ((rawTemp) / 333.87) + 21.0
    float tempC = ((float)rawTemp / 333.87) + 21.0;

    if (PLOTTER_MODE) {
      Serial.print("Accel_X:"); Serial.print(ax, 3); Serial.print(" ");
      Serial.print("Accel_Y:"); Serial.print(ay, 3); Serial.print(" ");
      Serial.print("Accel_Z:"); Serial.print(az, 3); Serial.print(" ");
      Serial.print("Total_Vib:"); Serial.println(totalG, 3);
    } else {
      String status = "NORMAL";
      if (fabs(totalG - 1.0) > 0.35) {
        status = "ALERT: HIGH VIBRATION!";
      } else if (fabs(totalG - 1.0) > 0.15) {
        status = "VIBRATING";
      }

      Serial.printf("  %6.3f   |   %6.3f   |   %6.3f   |    %5.3f    |   %4.1f   | %s\n",
                    ax, ay, az, totalG, tempC, status.c_str());
    }
  }

  delay(200); // 5 Hz
}
