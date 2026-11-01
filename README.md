# AI-Based Predictive Maintenance for an AC Induction Motor
## Task 1: Baseline Anomaly Detection Pipeline (SKAB Benchmark)

This repository contains the complete end-to-end anomaly detection pipeline developed as Task 1 of the IoT Predictive Maintenance project for an AC induction motor.

---

### Project Architecture & Structure

```text
Cornerstone/
│
├── data/
│   ├── raw/
│   │   └── SKAB/                       # Raw Skoltech Anomaly Benchmark CSV files
│   │       ├── anomaly-free/
│   │       ├── other/
│   │       ├── valve1/
│   │       └── valve2/
│   └── processed/
│       └── skab_dataset_audit.csv      # Generated dataset audit summary table
│
├── ml/
│   ├── data_loader.py                  # Leak-free chronological data loading and splitting
│   ├── baseline_model.py               # Multivariate Mahalanobis statistical baseline
│   ├── dataset_audit.py                # Automated dataset audit across all 35 files
│   ├── train_anomaly_model.py          # Isolation Forest pipeline training and calibration
│   ├── evaluate_anomaly_model.py       # Full benchmark evaluation, metrics, and visualization
│   └── saved_models/
│       ├── isolation_forest_pipeline.joblib
│       ├── baseline_model.joblib
│       └── model_metadata.json
│
├── notebooks/
│   ├── 01_dataset_exploration.ipynb    # Interactive audit & visual telemetry exploration
│   └── 02_isolation_forest_training.ipynb # Interactive training, validation, and benchmarking
│
├── reports/
│   ├── figures/                        # High-resolution diagnostic plots
│   │   ├── 01_normal_sensor_timeseries.png
│   │   ├── 02_labelled_sensor_timeseries.png
│   │   ├── 03_ground_truth_vs_predictions.png
│   │   ├── 04_confusion_matrices.png
│   │   └── 05_anomaly_score_distribution.png
│   ├── benchmark_metrics.csv           # Final computed metrics table across all 34 test files
│   ├── per_file_metrics.csv            # Breakdown of F1 scores across every test file
│   └── evaluation_report.md            # Comprehensive scientific evaluation report
│
├── tests/
│   └── test_pipeline.py                # Automated unit tests (schema, mapping, metrics, determinism)
│
├── requirements.txt                    # Python package dependencies
└── README.md
```

---

### Quickstart & Execution

#### 1. Run the Automated Dataset Audit
Audits all 35 CSV files for schema signatures, nulls, sampling intervals, and label conventions:
```bash
python ml/dataset_audit.py
```

#### 2. Train and Calibrate Models
Trains the Isolation Forest and Mahalanobis baseline strictly on the normal training split and evaluates false alarm rates on unseen normal validation data:
```bash
python ml/train_anomaly_model.py
```

#### 3. Run Benchmark Evaluation & Generate Plots
Evaluates both models across all 34 held-out test files and exports diagnostic figures and metrics:
```bash
python ml/evaluate_anomaly_model.py
```

#### 4. Run Automated Unit Tests
Runs 6 automated unit tests verifying schema integrity, prediction mapping, metrics, and model reload determinism:
```bash
pytest tests/
```

---

### Model Inputs (6 Selected Channels)
- `Accelerometer1RMS`: RMS of acceleration along axis 1 ($g$ or $\text{m/s}^2$)
- `Accelerometer2RMS`: RMS of acceleration along axis 2 ($g$ or $\text{m/s}^2$)
- `Current`: Motor phase current ($\text{A}$)
- `Temperature`: Process loop fluid temperature ($^\circ\text{C}$)
- `Thermocouple`: Machine surface/ambient temperature ($^\circ\text{C}$)
- `Voltage`: Line supply voltage ($\text{V}$)

*Note:* Process hydraulic channels (`Pressure`, `Volume Flow RateRMS`) are strictly excluded as model features.

---

### Key Experimental Results (Held-Out Benchmark)

| Metric | Statistical Baseline (Mahalanobis) | Isolation Forest |
| :--- | :---: | :---: |
| **Precision** | 0.3571 | **0.3591** |
| **Recall** | 0.9894 | **0.9027** |
| **F1-Score** | 0.5248 | **0.5138** |
| **False Positive Rate (FPR)** | 0.9739 | **0.8807** |
| **FPR on Unseen Normal Data** | 0.5816 | **0.0218 (2.18%)** |
| **Latency (CPU)** | 0.0001 ms/sample | 0.0106 ms/sample |

See [`reports/evaluation_report.md`](file:///c:/Users/himes/Desktop/Cornerstone/reports/evaluation_report.md) for the complete scientific error analysis and domain shift discussion.
