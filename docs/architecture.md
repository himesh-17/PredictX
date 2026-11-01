# MotorGuard AI: System Architecture

## 1. System Overview
MotorGuard AI is an industrial IoT predictive maintenance system designed for three-phase AC induction motors. It features a distributed, decoupled architecture separating real-time telemetry ingestion, deterministic engineering assessment, and machine learning inference.

```
+-----------------------------------------------------------------------------------+
|                              PHYSICAL MOTOR LAYER                                 |
|  - Three-Phase AC Induction Motor (0.75kW, 4-Pole)                               |
|  - Current Transformer (CT) | Voltage Divider | DS18B20 Temp | MPU6050 Vibration  |
|  - ESP32 Microcontroller (Edge Windowing & Modbus/HTTP Ingestion)                 |
+-----------------------------------------------------------------------------------+
                                      |
                           (HTTP / REST / Socket)
                                      v
+-----------------------------------------------------------------------------------+
|                              NODE.JS BACKEND                                      |
|  - Express REST API (/api/v1) & Socket.IO Telemetry Broker                        |
|  - Realistic Physics Sensor Simulator (Normal & Synthetic Fault Injection)       |
|  - Independent Standards Assessment Engine (Evaluates against limits.json)        |
|  - Deduplicating Alert Manager & In-Memory / MongoDB Persistence Repository       |
+-----------------------------------------------------------------------------------+
             |                                                  ^
   (HTTP Feature Proxy)                               (Real-Time WebSocket Feed)
             v                                                  |
+----------------------------------+        +---------------------------------------+
|        PYTHON FASTAPI            |        |           REACT SINGLE PAGE           |
|         AI SERVICE               |        |           DASHBOARD (Vite)            |
|  - Feature Compatibility Layer   |        |  - Status Overview & Persistent Badge |
|  - Isolation Forest Pipeline     |        |  - 4 Dynamic Sensor KPI Cards         |
|  - SKAB Integration Test Fixture |        |  - 4 Recharts Animated Time Streams   |
|  - Model Card & Limitation Specs |        |  - Standards Table & AI Anomaly Panel |
+----------------------------------+        +---------------------------------------+
```

## 2. Decoupling Engineering Assessment and AI Heuristics
- **Standards Engine:** Runs deterministically without AI heuristics. It assesses parameters against configured limits (such as IEC 60034-1 voltage tolerance or rated full-load current).
- **AI Anomaly Pipeline:** Employs an Isolation Forest trained on the SKAB benchmark. It acts as an auxiliary anomaly detector but is protected by a **Feature Compatibility Layer** that rejects incompatible physical motor telemetry schemas (`MODEL_INPUT_INCOMPATIBLE`) instead of fabricating surrogate sensor values.

## 3. Communication Protocols
- **Frontend <-> Backend:** HTTP REST for bounded history and configuration queries; WebSocket (Socket.IO) for sub-second live telemetry streaming.
- **Backend <-> AI Service:** Synchronous JSON HTTP client (`/predict` and `/test-fixture`).
