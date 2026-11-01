# Hardware Integration Guide: ESP32 to MotorGuard AI

## 1. Physical Sensor Architecture
When connecting the laboratory AC induction motor:
- **Phase Current:** Non-invasive Current Transformer (e.g. SCT-013-000, 100A/50mA) or Hall-effect sensor (ACS712) with burden resistor and ADC bias network.
- **Line Voltage:** ZMPT101B active precision voltage transformer module.
- **Surface / Winding Temperature:** DS18B20 1-Wire digital temperature sensor mounted to motor frame.
- **Vibration:** MPU6050 6-DOF IMU or ADXL345 3-axis accelerometer rigidly bolted to motor bearing housing.

## 2. Edge Preprocessing on ESP32
Raw accelerometer and current signals must **not** be streamed directly to the cloud at kHz rates. The ESP32 firmware should execute on-device windowing:
1. Sample vibration at 1000 Hz over a 1-second buffer ($N = 1000$ points).
2. Compute Root Mean Square (RMS) acceleration:
   $$A_{\text{RMS}} = \sqrt{\frac{1}{N}\sum_{i=1}^N (a_i - \bar{a})^2}$$
3. Compute True RMS AC current over integer cycles (50 Hz = 20 ms cycle).
4. Package the 1 Hz features into a JSON payload and transmit via HTTP POST or MQTT.

## 3. Telemetry Payload Format for ESP32
```json
POST /api/v1/readings
Content-Type: application/json

{
  "motorId": "MOTOR-001",
  "source": "hardware_esp32",
  "quality": "valid",
  "current": { "value": 3.24, "unit": "A" },
  "voltage": { "value": 230.2, "unit": "V" },
  "temperature": { "value": 44.5, "unit": "degC" },
  "vibration": { "value": 0.118, "unit": "g_rms", "axis": "X" }
}
```

## 4. Hardware Safety Guidelines
- High voltage (400V/230V AC) is lethal. All voltage and current sensor connections must be fully isolated.
- Current transformers must never be disconnected while under load (open-circuit high voltage risk).
- Accelerometers must be firmly mounted (stud or industrial magnetic mount) to avoid mechanical resonance distortion.
