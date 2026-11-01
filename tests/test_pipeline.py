"""
Automated Unit and Integration Tests for SKAB Anomaly Detection Pipeline
Tests verify schema integrity, prediction mapping, metrics, and reproducibility.
"""

import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

# Ensure ml directory is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "ml"))

from data_loader import SELECTED_FEATURES, load_normal_data, load_test_recording
from baseline_model import StatisticalDistanceBaseline
from evaluate_anomaly_model import calculate_metrics


def test_selected_features_exist_and_numeric():
    """Verify that all selected features exist and are numeric in normal data."""
    normal_csv = BASE_DIR / "data" / "raw" / "SKAB" / "anomaly-free" / "anomaly-free.csv"
    assert normal_csv.exists(), f"File missing: {normal_csv}"

    df = pd.read_csv(normal_csv, sep=";")
    for feat in SELECTED_FEATURES:
        assert feat in df.columns, f"Feature '{feat}' missing in {normal_csv}"
        assert pd.api.types.is_numeric_dtype(df[feat]), f"Feature '{feat}' is not numeric"


def test_no_missing_values_in_selected_features():
    """Verify zero missing values in selected features."""
    normal_csv = BASE_DIR / "data" / "raw" / "SKAB" / "anomaly-free" / "anomaly-free.csv"
    df = pd.read_csv(normal_csv, sep=";")
    null_counts = df[SELECTED_FEATURES].isnull().sum()
    assert null_counts.sum() == 0, f"Found missing values: {null_counts}"


def test_prediction_output_mapping():
    """
    Verify conversion logic from scikit-learn IsolationForest output:
    1 (inlier)  -> 0 (Normal)
    -1 (outlier)-> 1 (Anomaly)
    """
    raw_sklearn_outputs = np.array([1, 1, -1, 1, -1, -1])
    mapped_predictions = (raw_sklearn_outputs == -1).astype(int)
    expected = np.array([0, 0, 1, 0, 1, 1])

    np.testing.assert_array_equal(mapped_predictions, expected)


def test_metrics_calculation_and_edge_cases():
    """Verify confusion matrix and rate metrics, including zero false positives."""
    # Perfect detector
    y_true = np.array([0, 0, 0, 1, 1])
    y_pred = np.array([0, 0, 0, 1, 1])
    m = calculate_metrics(y_true, y_pred)

    assert m["Precision"] == 1.0
    assert m["Recall"] == 1.0
    assert m["F1-score"] == 1.0
    assert m["False Positive Rate"] == 0.0

    # All negative predictions (FN=2, FP=0, TP=0)
    y_pred_all_zero = np.array([0, 0, 0, 0, 0])
    m_zero = calculate_metrics(y_true, y_pred_all_zero)
    assert m_zero["Recall"] == 0.0
    assert m_zero["False Positive Rate"] == 0.0
    assert m_zero["Precision"] == 0.0  # Handled zero division gracefully


def test_model_reloading_and_reproducibility():
    """Verify saved Isolation Forest pipeline loads and produces deterministic predictions."""
    model_path = BASE_DIR / "ml" / "saved_models" / "isolation_forest_pipeline.joblib"
    assert model_path.exists(), f"Saved model pipeline missing at {model_path}"

    pipeline = joblib.load(model_path)
    sample_data = pd.DataFrame(
        [
            {
                "Accelerometer1RMS": 0.206,
                "Accelerometer2RMS": 0.278,
                "Current": 1.810,
                "Temperature": 90.174,
                "Thermocouple": 26.776,
                "Voltage": 228.208,
            }
        ]
    )

    pred1 = pipeline.predict(sample_data)
    pred2 = pipeline.predict(sample_data)
    np.testing.assert_array_equal(pred1, pred2)
    assert pred1[0] in [1, -1]


def test_baseline_detector_fit_and_predict():
    """Verify baseline Mahalanobis detector fits and predicts binary 0 or 1."""
    baseline = StatisticalDistanceBaseline(alpha=0.05)
    dummy_train = pd.DataFrame(np.random.normal(loc=10.0, scale=1.0, size=(100, 6)), columns=SELECTED_FEATURES)
    baseline.fit(dummy_train)

    preds = baseline.predict(dummy_train)
    assert len(preds) == 100
    assert set(preds).issubset({0, 1})
    assert baseline.threshold_ > 0.0
