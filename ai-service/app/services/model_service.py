import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import joblib
import numpy as np

from app.core.config import MODEL_PATH, METADATA_PATH


class ModelService:
    EXPECTED_FEATURES = [
        "Accelerometer1RMS",
        "Accelerometer2RMS",
        "Current",
        "Temperature",
        "Thermocouple",
        "Voltage",
    ]

    def __init__(self):
        self.pipeline = None
        self.metadata = {}
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        try:
            if MODEL_PATH.exists():
                self.pipeline = joblib.load(MODEL_PATH)
                self.is_loaded = True
            else:
                self.is_loaded = False

            if METADATA_PATH.exists():
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            else:
                self.metadata = {
                    "model_type": "IsolationForest",
                    "features": self.EXPECTED_FEATURES,
                    "notice": "Metadata file not found.",
                }
        except Exception as e:
            self.is_loaded = False
            self.metadata = {"error": str(e)}

    def evaluate_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates feature compatibility against the SKAB model contract.
        If physical 4-channel telemetry is supplied, returns MODEL_INPUT_INCOMPATIBLE.
        If 6-channel compatible payload is supplied, runs real model inference.
        """
        if not self.is_loaded or self.pipeline is None:
            return {
                "status": "MODEL_UNAVAILABLE",
                "prediction": None,
                "anomalyScore": None,
                "threshold": None,
                "expectedFeatures": self.EXPECTED_FEATURES,
                "missingFeatures": [],
                "explanation": "Isolation Forest model artifact could not be loaded on server.",
                "modelInfo": self.metadata,
                "isIntegrationTest": False,
                "isSimulated": payload.get("source") == "simulation",
            }

        # Check if payload contains the 6 required features directly
        has_all_skab = all(feat in payload for feat in self.EXPECTED_FEATURES)

        if has_all_skab:
            # Compatible 6-channel payload! Run real inference
            return self._predict_6_channel(payload)

        # Check if physical 4-sensor schema (current, voltage, temperature, vibration)
        missing = []
        for feat in self.EXPECTED_FEATURES:
            if feat not in payload:
                missing.append(feat)

        explanation = (
            f"Physical sensor telemetry schema does not match the 6-feature SKAB model contract. "
            f"Missing features: {', '.join(missing)}. "
            f"The current hardware setup collects 4 sensor channels (Current, Voltage, Temperature, Vibration). "
            f"Do not fabricate surrogate values for Accelerometer2RMS or Thermocouple simply to force model execution."
        )

        return {
            "status": "MODEL_INPUT_INCOMPATIBLE",
            "prediction": None,
            "anomalyScore": None,
            "threshold": -0.5,
            "expectedFeatures": self.EXPECTED_FEATURES,
            "missingFeatures": missing,
            "explanation": explanation,
            "modelInfo": self.metadata,
            "isIntegrationTest": False,
            "isSimulated": payload.get("source") == "simulation",
        }

    def _predict_6_channel(
        self, payload: Dict[str, Any], is_integration_test: bool = False
    ) -> Dict[str, Any]:
        try:
            # Construct feature matrix in exact feature order
            feature_vals = [float(payload[feat]) for feat in self.EXPECTED_FEATURES]
            try:
                import pandas as pd
                X_mat = pd.DataFrame([feature_vals], columns=self.EXPECTED_FEATURES)
            except ImportError:
                X_mat = np.array([feature_vals], dtype=float)

            # Scikit-learn predict() returns 1 (inlier/normal) or -1 (outlier/anomaly)
            raw_pred = int(self.pipeline.predict(X_mat)[0])
            # Decision function: higher = inlier (normal), negative = anomaly
            score = float(self.pipeline.decision_function(X_mat)[0])

            # Convert: 0 = Normal, 1 = Anomaly
            binary_pred = 1 if raw_pred == -1 else 0
            status = "ANOMALY" if binary_pred == 1 else "NORMAL"

            explanation = (
                f"Isolation Forest classified sample as {status} (score: {score:.4f}, raw: {raw_pred})."
            )
            if is_integration_test:
                explanation += " (Verified integration test fixture execution)."

            return {
                "status": status,
                "prediction": binary_pred,
                "anomalyScore": round(score, 4),
                "threshold": -0.5,
                "expectedFeatures": self.EXPECTED_FEATURES,
                "missingFeatures": [],
                "explanation": explanation,
                "modelInfo": self.metadata,
                "isIntegrationTest": is_integration_test,
                "isSimulated": payload.get("source") == "simulation",
            }
        except Exception as e:
            return {
                "status": "MODEL_ERROR",
                "prediction": None,
                "anomalyScore": None,
                "threshold": -0.5,
                "expectedFeatures": self.EXPECTED_FEATURES,
                "missingFeatures": [],
                "explanation": f"Model inference calculation failed: {str(e)}",
                "modelInfo": self.metadata,
                "isIntegrationTest": is_integration_test,
                "isSimulated": payload.get("source") == "simulation",
            }

    def run_integration_test_fixture(self) -> Dict[str, Any]:
        """
        Runs a verified 6-feature fixture against the loaded model
        to demonstrate end-to-end API integration without fabricating motor data.
        """
        # Nominal healthy sample from SKAB anomaly-free.csv
        sample_fixture = {
            "Accelerometer1RMS": 0.20603,
            "Accelerometer2RMS": 0.27792,
            "Current": 1.81019,
            "Temperature": 90.1740,
            "Thermocouple": 26.7760,
            "Voltage": 228.208,
            "source": "skab_integration_fixture",
        }
        return self._predict_6_channel(sample_fixture, is_integration_test=True)


model_service = ModelService()
