# Model Card: SKAB Isolation Forest Anomaly Detector

## 1. Model Details
- **Architecture:** `sklearn.ensemble.IsolationForest` wrapped in a `Pipeline` with `StandardScaler`
- **Parameters:** `n_estimators=100`, `contamination=0.01`, `random_state=42`, `n_jobs=-1`
- **Artifact:** `ml/saved_models/isolation_forest_pipeline.joblib`
- **Artifact Size:** 1.39 MB

## 2. Intended Use & Features
- **Task:** Unsupervised time-series anomaly detection on multivariate equipment telemetry.
- **Input Features (Strict Contract):**
  1. `Accelerometer1RMS` (Axis 1 acceleration RMS, $g$)
  2. `Accelerometer2RMS` (Axis 2 acceleration RMS, $g$)
  3. `Current` (Amperes)
  4. `Temperature` (Process fluid temperature, $^\circ\text{C}$)
  5. `Thermocouple` (Machine surface temperature, $^\circ\text{C}$)
  6. `Voltage` (Volts)

## 3. Training & Evaluation Data
- **Training Source:** SKAB `anomaly-free/anomaly-free.csv` (First 80% chronological split, $N = 7,520$).
- **Validation Source:** SKAB `anomaly-free/anomaly-free.csv` (Remaining 20% chronological split, $N = 1,881$).
- **Test Source:** 34 independent experiment recordings from SKAB `valve1/`, `valve2/`, `other/` ($N = 37,459$).

## 4. Evaluated Performance Metrics (Held-Out Benchmark)
| Metric | Isolation Forest | Baseline (Mahalanobis) |
| :--- | :---: | :---: |
| **Precision** | 0.3591 | 0.3571 |
| **Recall (Sensitivity)** | **0.9027** | 0.9894 |
| **F1-Score** | 0.5138 | 0.5248 |
| **Test False Positive Rate** | **0.8807 (88.1%)** | 0.9739 (97.4%) |
| **Normal Validation FPR** | **0.0218 (2.18%)** | 0.5816 (58.2%) |

## 5. Known Limitations & Caveats
1. **Domain Shift:** The 88.07% test false positive rate is caused by testbed operating mode mismatch: `anomaly-free.csv` was recorded at high flow rate (122 L/h) while `valve1` was recorded at low flow rate (32 L/h).
2. **Specific Fault Diagnosis:** Does not classify bearing inner/outer race faults, eccentricity, or rotor bar breakage.
3. **Prognostics:** Does not predict remaining useful life (RUL).
4. **Safety Verification:** A normal prediction does not prove equipment is safe.
