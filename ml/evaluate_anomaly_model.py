"""
Comprehensive Model Evaluation and Visualization Module
Evaluates Isolation Forest vs Statistical Baseline on held-out SKAB test recordings.
Generates metrics table and publication-quality diagnostic plots.
"""

import os
import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    average_precision_score,
    recall_score,
)

# Use headless matplotlib backend
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from data_loader import SELECTED_FEATURES, load_benchmark_test_recordings, load_normal_data
from baseline_model import StatisticalDistanceBaseline


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, scores: np.ndarray | None = None) -> dict:
    """
    Computes all standard anomaly detection metrics.
    Handles zero-division edge cases gracefully.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    precision = precision_score(y_true, y_pred, zero_division=0.0)
    recall = recall_score(y_true, y_pred, zero_division=0.0)
    f1 = f1_score(y_true, y_pred, zero_division=0.0)
    accuracy = accuracy_score(y_true, y_pred)
    bal_acc = balanced_accuracy_score(y_true, y_pred)
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    metrics = {
        "TP": int(tp),
        "TN": int(tn),
        "FP": int(fp),
        "FN": int(fn),
        "Precision": round(float(precision), 4),
        "Recall": round(float(recall), 4),
        "F1-score": round(float(f1), 4),
        "Accuracy": round(float(accuracy), 4),
        "Balanced Accuracy": round(float(bal_acc), 4),
        "False Positive Rate": round(float(fpr), 4),
    }

    if scores is not None:
        try:
            ap = average_precision_score(y_true, scores)
            metrics["Average Precision"] = round(float(ap), 4)
        except Exception:
            metrics["Average Precision"] = None
    else:
        metrics["Average Precision"] = None

    return metrics


def measure_inference_speed(model, X_sample: pd.DataFrame, n_runs: int = 10) -> float:
    """
    Measures average inference time per sample in milliseconds.
    """
    times = []
    for _ in range(n_runs):
        start = time.perf_counter()
        _ = model.predict(X_sample)
        elapsed = time.perf_counter() - start
        times.append(elapsed)
    avg_total_sec = np.median(times)
    ms_per_sample = (avg_total_sec / len(X_sample)) * 1000.0
    return round(ms_per_sample, 4)


def plot_sensor_timeseries(df: pd.DataFrame, title: str, save_path: Path):
    """
    Plots the 6 sensor channels over time.
    """
    fig, axes = plt.subplots(6, 1, figsize=(14, 12), sharex=True)
    timestamps = pd.to_datetime(df["datetime"])

    for i, col in enumerate(SELECTED_FEATURES):
        axes[i].plot(timestamps, df[col], color="navy", lw=1.2, label=col)
        axes[i].set_ylabel(col, fontsize=9)
        axes[i].grid(True, linestyle="--", alpha=0.5)

        # Highlight ground truth anomaly regions if present
        if "anomaly" in df.columns and df["anomaly"].sum() > 0:
            anomaly_mask = df["anomaly"] == 1.0
            axes[i].fill_between(
                timestamps,
                df[col].min(),
                df[col].max(),
                where=anomaly_mask,
                color="crimson",
                alpha=0.15,
                label="Ground Truth Anomaly" if i == 0 else "",
            )

    axes[0].set_title(title, fontsize=12, fontweight="bold")
    axes[-1].set_xlabel("Timestamp", fontsize=10)
    if "anomaly" in df.columns and df["anomaly"].sum() > 0:
        axes[0].legend(loc="upper right")

    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=200)
    plt.close()


def plot_predictions_comparison(
    df: pd.DataFrame,
    y_true: np.ndarray,
    iso_pred: np.ndarray,
    baseline_pred: np.ndarray,
    save_path: Path,
    recording_name: str,
):
    """
    Plots ground truth labels alongside Isolation Forest and Baseline predictions,
    highlighting True Positives, False Positives, and False Negatives.
    """
    timestamps = pd.to_datetime(df["datetime"])
    fig, (ax1, ax2, ax3, ax4) = plt.subplots(4, 1, figsize=(14, 10), sharex=True)

    # 1. Primary sensor signal (Current)
    ax1.plot(timestamps, df["Current"], color="black", lw=1.2, label="Current (A)")
    ax1.set_ylabel("Current (A)")
    ax1.set_title(f"Diagnostic Analysis for Test Recording: {recording_name}", fontweight="bold")
    ax1.grid(True, linestyle="--", alpha=0.5)

    # 2. Ground Truth Anomaly
    ax2.plot(timestamps, y_true, color="red", lw=1.5, drawstyle="steps-post", label="Ground Truth (1=Anomaly)")
    ax2.fill_between(timestamps, 0, y_true, color="red", alpha=0.2, step="post")
    ax2.set_ylabel("Ground Truth")
    ax2.set_ylim(-0.1, 1.2)
    ax2.set_yticks([0, 1])
    ax2.grid(True, linestyle="--", alpha=0.5)

    # 3. Isolation Forest Predictions (Highlight FP & FN)
    ax3.plot(timestamps, iso_pred, color="teal", lw=1.5, drawstyle="steps-post", label="Isolation Forest Pred")
    # Mark False Positives (Predicted 1, True 0)
    fp_mask = (iso_pred == 1) & (y_true == 0)
    if fp_mask.any():
        ax3.scatter(timestamps[fp_mask], iso_pred[fp_mask], color="orange", s=15, label="False Positive (FP)", zorder=4)
    # Mark False Negatives (Predicted 0, True 1)
    fn_mask = (iso_pred == 0) & (y_true == 1)
    if fn_mask.any():
        ax3.scatter(timestamps[fn_mask], iso_pred[fn_mask] + 0.05, color="magenta", marker="x", s=25, label="False Negative (FN)", zorder=4)

    ax3.set_ylabel("IsoForest")
    ax3.set_ylim(-0.1, 1.2)
    ax3.set_yticks([0, 1])
    ax3.legend(loc="upper right", fontsize=8)
    ax3.grid(True, linestyle="--", alpha=0.5)

    # 4. Baseline Model Predictions
    ax4.plot(timestamps, baseline_pred, color="darkorange", lw=1.5, drawstyle="steps-post", label="Baseline Pred")
    ax4.set_ylabel("Baseline")
    ax4.set_ylim(-0.1, 1.2)
    ax4.set_yticks([0, 1])
    ax4.set_xlabel("Timestamp")
    ax4.legend(loc="upper right", fontsize=8)
    ax4.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=200)
    plt.close()


def plot_confusion_matrices(
    y_true: np.ndarray,
    iso_pred: np.ndarray,
    baseline_pred: np.ndarray,
    save_path: Path,
):
    """
    Plots side-by-side confusion matrix heatmaps.
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))

    cm_iso = confusion_matrix(y_true, iso_pred, labels=[0, 1])
    cm_base = confusion_matrix(y_true, baseline_pred, labels=[0, 1])

    sns.heatmap(
        cm_base,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=False,
        ax=ax1,
        xticklabels=["Normal (0)", "Anomaly (1)"],
        yticklabels=["Normal (0)", "Anomaly (1)"],
    )
    ax1.set_title("Statistical Baseline (Mahalanobis)", fontweight="bold")
    ax1.set_xlabel("Predicted Label")
    ax1.set_ylabel("True Label")

    sns.heatmap(
        cm_iso,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=False,
        ax=ax2,
        xticklabels=["Normal (0)", "Anomaly (1)"],
        yticklabels=["Normal (0)", "Anomaly (1)"],
    )
    ax2.set_title("Isolation Forest Detector", fontweight="bold")
    ax2.set_xlabel("Predicted Label")
    ax2.set_ylabel("True Label")

    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=200)
    plt.close()


def plot_anomaly_score_distribution(
    y_true: np.ndarray,
    iso_scores: np.ndarray,
    save_path: Path,
):
    """
    Plots histogram and KDE of Isolation Forest continuous anomaly scores
    separated by ground-truth Normal vs Anomaly.
    Higher score in score_samples indicates higher inlier probability.
    """
    plt.figure(figsize=(9, 5))
    sns.kdeplot(
        iso_scores[y_true == 0],
        fill=True,
        color="royalblue",
        label="True Normal (0)",
        common_norm=False,
    )
    sns.kdeplot(
        iso_scores[y_true == 1],
        fill=True,
        color="crimson",
        label="True Anomaly (1)",
        common_norm=False,
    )
    plt.axvline(
        x=-0.5,
        color="black",
        linestyle="--",
        label="Nominal Decision Boundary (-0.5)",
    )
    plt.title("Isolation Forest Anomaly Score Distribution", fontweight="bold")
    plt.xlabel("Score (decision_function: higher = normal, lower = anomaly)")
    plt.ylabel("Density")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=200)
    plt.close()


def run_full_evaluation(
    model_dir: Path,
    skab_dir: Path,
    reports_dir: Path,
) -> pd.DataFrame:
    """
    Orchestrates the entire evaluation across the held-out test suite.
    """
    # Load trained models
    iso_pipeline = joblib.load(model_dir / "isolation_forest_pipeline.joblib")
    baseline = joblib.load(model_dir / "baseline_model.joblib")

    figures_dir = reports_dir / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)

    # 1. Plot Normal recording sensor readings
    normal_csv = skab_dir / "anomaly-free" / "anomaly-free.csv"
    df_normal = pd.read_csv(normal_csv, sep=";")
    plot_sensor_timeseries(
        df_normal.iloc[:1500],
        "Baseline Normal Operation Sensor Readings (anomaly-free.csv, 1500s excerpt)",
        figures_dir / "01_normal_sensor_timeseries.png",
    )

    # 2. Load held-out test recordings across valve1, valve2, and other
    print("Loading held-out test recordings...")
    test_dict = load_benchmark_test_recordings(skab_dir)
    print(f"Loaded {len(test_dict)} held-out test recordings.")

    # Aggregate evaluation over all test files
    all_y_true = []
    all_iso_pred = []
    all_baseline_pred = []
    all_iso_scores = []
    all_baseline_scores = []

    per_file_results = []

    for name, df_test in test_dict.items():
        X_test = df_test[SELECTED_FEATURES]
        y_test = df_test["anomaly"].astype(int).to_numpy()

        # Isolation Forest prediction
        # predict() returns 1 (inlier) and -1 (outlier) -> map to 0 (normal) and 1 (anomaly)
        raw_iso = iso_pipeline.predict(X_test)
        iso_pred = (raw_iso == -1).astype(int)
        iso_scores = iso_pipeline.decision_function(X_test)  # higher = normal, lower = anomaly

        # Baseline prediction
        baseline_pred = baseline.predict(X_test)
        baseline_scores = baseline.score_samples(X_test)  # distance: higher = anomaly

        all_y_true.append(y_test)
        all_iso_pred.append(iso_pred)
        all_baseline_pred.append(baseline_pred)
        all_iso_scores.append(iso_scores)
        all_baseline_scores.append(baseline_scores)

        # File-level metric summary
        iso_f1 = f1_score(y_test, iso_pred, zero_division=0.0)
        base_f1 = f1_score(y_test, baseline_pred, zero_division=0.0)
        per_file_results.append(
            {
                "file": name,
                "rows": len(df_test),
                "anomaly_ratio_pct": round(float(np.mean(y_test) * 100), 2),
                "iso_f1": round(float(iso_f1), 4),
                "baseline_f1": round(float(base_f1), 4),
            }
        )

    # Concatenate all test observations for aggregate benchmark evaluation
    y_true_all = np.concatenate(all_y_true)
    iso_pred_all = np.concatenate(all_iso_pred)
    base_pred_all = np.concatenate(all_baseline_pred)
    iso_scores_all = np.concatenate(all_iso_scores)
    # For average precision, invert iso_score so higher = anomaly
    iso_anomaly_scores = -iso_scores_all
    base_scores_all = np.concatenate(all_baseline_scores)

    # Calculate aggregate metrics
    iso_metrics = calculate_metrics(y_true_all, iso_pred_all, iso_anomaly_scores)
    base_metrics = calculate_metrics(y_true_all, base_pred_all, base_scores_all)

    # Measure runtime latency on desktop
    sample_df = list(test_dict.values())[0][SELECTED_FEATURES]
    iso_latency_ms = measure_inference_speed(iso_pipeline, sample_df)
    base_latency_ms = measure_inference_speed(baseline, sample_df)
    iso_metrics["Latency (ms/sample)"] = iso_latency_ms
    base_metrics["Latency (ms/sample)"] = base_latency_ms

    comparison_df = pd.DataFrame(
        [
            {"Model": "Statistical Baseline (Mahalanobis)", **base_metrics},
            {"Model": "Isolation Forest", **iso_metrics},
        ]
    ).set_index("Model")

    # 3. Generate detailed visual plots for representative files (e.g. valve1/0.csv and other/11.csv)
    rep_key = "valve1/0.csv"
    rep_df = test_dict[rep_key]
    rep_y_true = rep_df["anomaly"].astype(int).to_numpy()
    rep_iso = (iso_pipeline.predict(rep_df[SELECTED_FEATURES]) == -1).astype(int)
    rep_base = baseline.predict(rep_df[SELECTED_FEATURES])

    plot_sensor_timeseries(
        rep_df,
        f"Held-Out Experiment Sensor Readings ({rep_key}) with Anomaly Window",
        figures_dir / "02_labelled_sensor_timeseries.png",
    )

    plot_predictions_comparison(
        rep_df,
        rep_y_true,
        rep_iso,
        rep_base,
        figures_dir / "03_ground_truth_vs_predictions.png",
        rep_key,
    )

    plot_confusion_matrices(
        y_true_all,
        iso_pred_all,
        base_pred_all,
        figures_dir / "04_confusion_matrices.png",
    )

    plot_anomaly_score_distribution(
        y_true_all,
        iso_scores_all,
        figures_dir / "05_anomaly_score_distribution.png",
    )

    print("\n" + "=" * 65)
    print("FINAL BENCHMARK EVALUATION RESULTS (ALL 34 HELD-OUT TEST FILES):")
    print("=" * 65)
    print(comparison_df.T.to_string())

    # Save metrics table to CSV
    metrics_csv = reports_dir / "benchmark_metrics.csv"
    comparison_df.to_csv(metrics_csv)
    print(f"\nSaved metrics table to: {metrics_csv}")

    # Save per-file summary
    per_file_df = pd.DataFrame(per_file_results)
    per_file_csv = reports_dir / "per_file_metrics.csv"
    per_file_df.to_csv(per_file_csv, index=False)
    print(f"Saved per-file metrics to: {per_file_csv}")

    return comparison_df


if __name__ == "__main__":
    base_path = Path(__file__).resolve().parent.parent
    model_dir = base_path / "ml" / "saved_models"
    skab_dir = base_path / "data" / "raw" / "SKAB"
    reports_dir = base_path / "reports"

    run_full_evaluation(model_dir, skab_dir, reports_dir)
    print("\nEvaluation pipeline finished successfully.")
