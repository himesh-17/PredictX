# MotorGuard AI: REST API Contract

Base URL: `/api/v1`

## 1. System Health
### `GET /api/v1/health`
Checks backend state, database status, AI inference service availability, and simulation status.
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-27T01:00:00.000Z",
  "version": "1.0.0",
  "database": {
    "status": "connected | in_memory_fallback",
    "engine": "MongoDB | InMemoryRepository"
  },
  "aiService": {
    "status": "online | offline"
  },
  "simulation": {
    "isRunning": true,
    "activeDisturbance": "NONE"
  }
}
```

## 2. Telemetry Readings
### `POST /api/v1/readings`
Ingests a single reading (used by ESP32 hardware or external simulators).
**Payload:**
```json
{
  "motorId": "MOTOR-001",
  "source": "hardware_esp32",
  "quality": "valid",
  "current": { "value": 3.25, "unit": "A" },
  "voltage": { "value": 230.1, "unit": "V" },
  "temperature": { "value": 45.2, "unit": "degC" },
  "vibration": { "value": 0.125, "unit": "g_rms", "axis": "X" }
}
```

### `GET /api/v1/readings/latest?motorId=MOTOR-001`
Returns the most recent reading.

### `GET /api/v1/readings/history?motorId=MOTOR-001&limit=60`
Returns bounded historical telemetry readings.

## 3. Standards Assessment
### `GET /api/v1/standards/config`
Returns active limit configuration.

### `GET /api/v1/standards/assessment/latest?motorId=MOTOR-001`
Returns deterministic assessment for the latest sensor reading.

## 4. Alerts
### `GET /api/v1/alerts`
Returns recent alerts.

### `PATCH /api/v1/alerts/:id/acknowledge`
Acknowledges an alert in the backend repository.

## 5. Simulation Control
### `POST /api/v1/simulation/start`
Starts the backend sensor generator.

### `POST /api/v1/simulation/stop`
Stops the backend sensor generator.

### `POST /api/v1/simulation/disturbance`
Injects synthetic disturbance (`CURRENT_SURGE`, `OVERHEATING`, `HIGH_VIBRATION`, `VOLTAGE_SAG`).

## 6. AI Inference
### `POST /api/v1/ai/predict`
Evaluates telemetry against the model contract. Returns `MODEL_INPUT_INCOMPATIBLE` if schema does not match 6-feature contract.

### `POST /api/v1/ai/test-fixture`
Executes a verified 6-feature SKAB fixture against the trained Isolation Forest to demonstrate integration.
