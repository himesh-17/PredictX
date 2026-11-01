"""
Isolation Forest Training and Validation Pipeline for SKAB Anomaly Detection
Motor Predictive Maintenance Project - Stage 2 & 3
"""

import json
from datetime import datetime
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from data_loader import SELECTED_FEATURES, load_normal_data
from baseline_model import StatisticalDistanceBaseline


def build_and_train_isolation_forest(
    X_train: pd.DataFrame,
    contamination: float = 0.01,
    random_state: int = 42,
    n_estimators: int = 100,
) -> Pipeline:
    """
    Constructs and fits an Isolation Forest pipeline.
    
    Includes StandardScaler fitted strictly on X_train.
    While decision trees are theoretically scale-invariant for axis-aligned splits,
    standardization provides consistent numerical range and stabilizes any multi-model pipelines.
    """
    iso_forest = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", iso_forest),
        ]
    )

    pipeline.fit(X_train)
    return pipeline


def evaluate_on_validation_normal(
    iso_pipeline: Pipeline,
    baseline_model: StatisticalDistanceBaseline,
    X_val: pd.DataFrame,
) -> dict:
    """
    Evaluates detectors on held-out NORMAL validation data to verify False Alarm Rate.
    Because validation data is 100% normal, any positive prediction is a False Positive.
    """
    # Isolation Forest: predict() returns 1 (inlier) and -1 (outlier)
    iso_raw_pred = iso_pipeline.predict(X_val)
    iso_binary_pred = (iso_raw_pred == -1).astype(int)
    iso_fpr = float(np.mean(iso_binary_pred == 1))

    # Baseline Model
    baseline_binary_pred = baseline_model.predict(X_val)
    baseline_fpr = float(np.mean(baseline_binary_pred == 1))

    return {
        "val_samples": len(X_val),
        "iso_val_false_positives": int(np.sum(iso_binary_pred == 1)),
        "iso_val_fpr": round(iso_fpr, 4),
        "baseline_val_false_positives": int(np.sum(baseline_binary_pred == 1)),
        "baseline_val_fpr": round(baseline_fpr, 4),
    }


def run_training_experiment(
    data_dir: Path,
    output_model_dir: Path,
    train_ratio: float = 0.8,
    contamination: float = 0.01,
    random_state: int = 42,
) -> dict:
    normal_csv = data_dir / "anomaly-free" / "anomaly-free.csv"
    print(f"Loading normal data from: {normal_csv}")
    df_train, df_val = load_normal_data(normal_csv, train_ratio=train_ratio)

    print(f"Train split (Normal): {len(df_train)} rows ({df_train['datetime'].min()} to {df_train['datetime'].max()})")
    print(f"Validation split (Normal): {len(df_val)} rows ({df_val['datetime'].min()} to {df_val['datetime'].max()})")

    X_train = df_train[SELECTED_FEATURES]
    X_val = df_val[SELECTED_FEATURES]

    # 1. Train Isolation Forest
    print("\nFitting Isolation Forest pipeline on training data...")
    iso_pipeline = build_and_train_isolation_forest(
        X_train, contamination=contamination, random_state=random_state
    )

    # 2. Train Statistical Baseline
    print("Fitting Mahalanobis Statistical Baseline on training data...")
    baseline = StatisticalDistanceBaseline(alpha=contamination)
    baseline.fit(X_train)

    # 3. Validate on held-out normal observations (Calibrate False Alarm Rate)
    print("\nEvaluating on unseen normal validation set...")
    val_metrics = evaluate_on_validation_normal(iso_pipeline, baseline, X_val)
    print(f"Validation Results (Checking False Alarm Rate on Unseen Normal Data):")
    print(f"  Isolation Forest FPR on unseen normal: {val_metrics['iso_val_fpr'] * 100:.2f}% ({val_metrics['iso_val_false_positives']} / {val_metrics['val_samples']})")
    print(f"  Statistical Baseline FPR on unseen normal: {val_metrics['baseline_val_fpr'] * 100:.2f}% ({val_metrics['baseline_val_false_positives']} / {val_metrics['val_samples']})")

    # 4. Save Models and Metadata
    output_model_dir.mkdir(parents=True, exist_ok=True)
    iso_model_path = output_model_dir / "isolation_forest_pipeline.joblib"
    baseline_model_path = output_model_dir / "baseline_model.joblib"

    joblib.dump(iso_pipeline, iso_model_path)
    joblib.dump(baseline, baseline_model_path)
    print(f"\nSaved Isolation Forest to: {iso_model_path}")
    print(f"Saved Baseline Model to: {baseline_model_path}")

    metadata = {
        "training_timestamp": datetime.now().isoformat(),
        "model_type": "IsolationForest",
        "features": SELECTED_FEATURES,
        "n_features": len(SELECTED_FEATURES),
        "random_state": random_state,
        "contamination": contamination,
        "train_samples": len(df_train),
        "val_samples": len(df_val),
        "validation_metrics": val_metrics,
        "data_source": "SKAB anomaly-free/anomaly-free.csv",
        "split_strategy": f"Strict chronological split (first {int(train_ratio*100)}% train, last {int((1-train_ratio)*100)}% val)",
    }

    metadata_path = output_model_dir / "model_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved Metadata to: {metadata_path}")

    return metadata


if __name__ == "__main__":
    base_path = Path(__file__).resolve().parent.parent
    data_dir = base_path / "data" / "raw" / "SKAB"
    model_dir = base_path / "ml" / "saved_models"

    metadata = run_training_experiment(data_dir, model_dir)
    print("\nTraining workflow completed successfully.")
