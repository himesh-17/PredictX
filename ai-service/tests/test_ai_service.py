import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add app to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app

client = TestClient(app)


def test_ai_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["modelLoaded"] is True
    assert len(data["featuresExpected"]) == 6


def test_ai_model_card_endpoint():
    response = client.get("/api/v1/model-card")
    assert response.status_code == 200
    data = response.json()
    assert "reportedMetrics" in data
    assert data["reportedMetrics"]["recall"] == 0.9027
    assert len(data["knownLimitations"]) >= 3


def test_ai_predict_incompatible_input():
    # Submit 4-channel physical sensor payload
    payload = {
        "motorId": "MOTOR-001",
        "current": {"value": 3.1, "unit": "A"},
        "voltage": {"value": 230, "unit": "V"},
        "temperature": {"value": 42.0, "unit": "degC"},
        "vibration": {"value": 0.12, "unit": "g_rms"},
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MODEL_INPUT_INCOMPATIBLE"
    assert "Accelerometer2RMS" in data["missingFeatures"]
    assert "Thermocouple" in data["missingFeatures"]
    assert data["prediction"] is None


def test_ai_predict_integration_test_fixture():
    response = client.post("/api/v1/test-fixture")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["NORMAL", "ANOMALY"]
    assert data["prediction"] in [0, 1]
    assert data["anomalyScore"] is not None
    assert data["isIntegrationTest"] is True
