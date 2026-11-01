from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.predict import ModelPredictionResponse
from app.services.model_service import model_service
from app.core.config import SERVICE_NAME, SERVICE_VERSION

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy" if model_service.is_loaded else "degraded",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "modelLoaded": model_service.is_loaded,
        "modelType": model_service.metadata.get("model_type", "IsolationForest"),
        "featuresExpected": model_service.EXPECTED_FEATURES,
    }


@router.post("/predict", response_model=ModelPredictionResponse)
def predict_anomaly(payload: Dict[str, Any]):
    result = model_service.evaluate_payload(payload)
    return result


@router.post("/test-fixture", response_model=ModelPredictionResponse)
def execute_test_fixture():
    """
    Submits a verified 6-feature SKAB fixture to demonstrate API integration.
    """
    return model_service.run_integration_test_fixture()


@router.get("/model-card")
def get_model_card():
    return {
        "modelName": "Isolation Forest Anomaly Detector",
        "version": "1.0.0",
        "task": "Unsupervised Anomaly Detection",
        "trainingDataset": "SKAB (Skoltech Anomaly Benchmark) anomaly-free.csv",
        "evaluationDataset": "SKAB 34 held-out experiment recordings (37,459 observations)",
        "reportedMetrics": {
            "precision": 0.3591,
            "recall": 0.9027,
            "f1Score": 0.5138,
            "falsePositiveRateTest": 0.8807,
            "falsePositiveRateValidation": 0.0218,
            "accuracy": 0.3962,
        },
        "knownLimitations": [
            "Trained on closed-loop water pump testbed, not specific induction motor internal faults.",
            "High test false positive rate (88.07%) caused by operational mode mismatch / domain shift between high-flow normal run and low-flow test runs.",
            "Cannot diagnose specific induction motor faults (e.g. stator winding short, broken rotor bar).",
            "Does not predict remaining useful life (RUL) or time-to-failure.",
            "Normal prediction is not proof of motor mechanical health.",
        ],
        "inputFeatureContract": model_service.EXPECTED_FEATURES,
    }
