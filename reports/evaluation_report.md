# AI-Based Predictive Maintenance: Model 1 Evaluation Report
**Project:** Predictive Maintenance for AC Induction Motor  
**Dataset:** Skoltech Anomaly Benchmark (SKAB)  
**Models:** Isolation Forest vs. Multivariate Statistical Baseline (Mahalanobis Distance)  
**Author:** AI/ML Mentorship & IoT Engineering Team  
**Date:** October 2026  

---

## Executive Summary
This report documents the design, implementation, evaluation, and diagnostic audit of the initial unsupervised anomaly detection pipeline for an IoT-based predictive maintenance system. Using the public Skoltech Anomaly Benchmark (SKAB) dataset as a prototyping testbed, we implemented an **Isolation Forest** pipeline and compared it against an industrial **Multivariate Statistical Baseline (Mahalanobis Distance)**.

All models were trained strictly on healthy operation data from `anomaly-free.csv` without target labels, calibrated on unseen chronological normal data, and evaluated against 34 held-out experiment recordings spanning 37,459 test observations.

---

## A. Dataset Audit

### 1. File Inventory and Folder Structure
The audited SKAB benchmark consists of **35 CSV files** structured across four folders:
- `anomaly-free/`: 1 recording (`anomaly-free.csv`, 9,401 rows, 9 columns). Used as the reference healthy baseline.
- `other/`: 14 recordings (14,985 total rows, 11 columns). Multiple operational anomaly types.
- `valve1/`: 16 recordings (18,162 total rows, 11 columns). Valve 1 closure/disturbance experiments.
- `valve2/`: 4 recordings (4,312 total rows, 11 columns). Valve 2 closure/disturbance experiments.
- **Total Dataset Size:** 46,860 observations.

### 2. Schema Signatures and Measurement Channels
Inspection revealed exactly two distinct schemas:
1. **Unlabelled Schema (9 columns)**: Found strictly in `anomaly-free.csv`:
   `['datetime', 'Accelerometer1RMS', 'Accelerometer2RMS', 'Current', 'Pressure', 'Temperature', 'Thermocouple', 'Voltage', 'Volume Flow RateRMS']`
2. **Labelled Schema (11 columns)**: Found in all 34 test recordings across `other/`, `valve1/`, and `valve2/`:
   `['datetime', 'Accelerometer1RMS', 'Accelerometer2RMS', 'Current', 'Pressure', 'Temperature', 'Thermocouple', 'Voltage', 'Volume Flow RateRMS', 'anomaly', 'changepoint']`

### 3. Label Semantics (SKAB Ground Truth)
- `anomaly` (0.0 or 1.0): An **interval-level label**. `0.0` denotes nominal operation; `1.0` denotes an active anomaly episode (valve throttled, cavitation, imbalance). Anomalies account for an average of **35.6%** of observations in the test recordings.
- `changepoint` (0.0 or 1.0): A **point-event transition label**. `1.0` marks the exact sample timestamp where a state transition begins or terminates (typically 2 to 4 changepoint timestamps per file). 
- *Leakage Prevention Rule:* `changepoint` was audited and strictly excluded from model feature inputs.

### 4. Data Quality & Sampling Interval
- **Missing Values:** Exactly **0 missing/null entries** across all columns in all 35 files.
- **Duplicate Rows / Timestamps:** Exactly **0 duplicate rows** and **0 duplicate timestamps**.
- **Sampling Interval:** Nominal sampling frequency is **1 Hz (1 sample per second)**. Over 96% of intervals are exactly 1.00s; occasional minor hardware logging jitter (1.02s–1.08s) was detected, with no long dropouts.
- **Separator:** Semicolon (`;`) delimited with standard IEEE 754 floating-point numbers.

---

## B. Experimental Design

### 1. Train / Validation / Test Split Strategy
To eliminate data leakage while honoring the temporal nature of machine telemetry, the following split architecture was enforced:
1. **Training Set ($N = 7,520$ rows, 80% of `anomaly-free.csv`):**
   - Spans chronological period: `2020-02-08 13:30:47` to `2020-02-08 15:43:57`.
   - Used exclusively to fit the preprocessing scaler, covariance matrix, and Isolation Forest trees.
2. **Calibration / Validation Set ($N = 1,881$ rows, 20% of `anomaly-free.csv`):**
   - Spans chronological period: `2020-02-08 15:43:58` to `2020-02-08 16:16:47`.
   - Completely held out during fitting. Used exclusively to verify nominal false-alarm rates (FPR) on unseen healthy data.
3. **Held-Out Test Set (34 Files, $N = 37,459$ rows across `valve1`, `valve2`, `other`):**
   - Independent physical experiments evaluated end-to-end.
   - Test labels were strictly isolated and never accessed during model parameter selection or threshold tuning.

### 2. Rationale Against Random Row Shuffling
Randomly partitioning adjacent rows in time-series telemetry induces catastrophic data leakage. High autocorrelation between sample $t$ and sample $t+1$ guarantees artificially inflated performance metrics that collapse upon real-world deployment. Preserving entire chronological blocks and independent physical runs guarantees rigorous evaluation.

---

## C. Model Configuration

### 1. Selected Feature Subset
Six motor-relevant channels were selected as inputs:
```python
features = [
    "Accelerometer1RMS",
    "Accelerometer2RMS",
    "Current",
    "Temperature",
    "Thermocouple",
    "Voltage"
]
```
*Excluded Variables:* `Pressure` and `Volume Flow RateRMS` were excluded because they represent external fluid loop hydraulics rather than direct electromechanical induction motor sensors.

### 2. Isolation Forest Pipeline
- **Algorithm:** `sklearn.ensemble.IsolationForest`
- **Ensemble Size:** `n_estimators = 100`
- **Random Seed:** `random_state = 42` (ensuring bitwise deterministic reproducibility)
- **Contamination:** Set to `0.01` (1%), representing the target false-positive risk under healthy training conditions.
- **Preprocessing:** `StandardScaler()` encapsulated in a scikit-learn `Pipeline`, fitted strictly on `X_train`.
- **Prediction Mapping:**
  $$\hat{y} = \begin{cases} 0 \quad (\text{Normal}), & \text{if } \text{predict}(X) = +1 \\ 1 \quad (\text{Anomaly}), & \text{if } \text{predict}(X) = -1 \end{cases}$$

### 3. Statistical Baseline Detector
- **Algorithm:** Multivariate Mahalanobis Distance / Hotelling's $T^2$.
- **Mathematical Formulation:**
  $$D_M(x) = \sqrt{(x - \mu_{\text{train}})^T \Sigma_{\text{train}}^{-1} (x - \mu_{\text{train}})}$$
- **Regularization:** $\Sigma_{\text{reg}} = \Sigma + 10^{-6} \cdot I$ to ensure invertibility.
- **Threshold $\tau$:** Empirical 99th percentile of training Mahalanobis distances ($\alpha = 0.01$).

---

## D. Evaluation Results

The models were evaluated across all 34 held-out test recordings ($N = 37,459$ test observations). All metrics are actual computed values from `reports/benchmark_metrics.csv`:

| Evaluation Metric | Statistical Baseline (Mahalanobis) | Isolation Forest |
| :--- | :---: | :---: |
| **True Positives (TP)** | 13,100 | 11,952 |
| **True Negatives (TN)** | 632 | 2,889 |
| **False Positives (FP)** | 23,586 | 21,329 |
| **False Negatives (FN)** | 141 | 1,289 |
| **Precision** | **0.3571** | **0.3591** |
| **Recall** | **0.9894** | **0.9027** |
| **F1-score** | **0.5248** | **0.5138** |
| **Accuracy** | **0.3666** | **0.3962** |
| **Balanced Accuracy** | **0.5077** | **0.5110** |
| **False Positive Rate (FPR)** | **0.9739** (97.39%) | **0.8807** (88.07%) |
| **Average Precision (PR AUC)** | **0.3855** | **0.3492** |
| **Desktop Inference Latency** | **0.0001 ms/sample** | **0.0106 ms/sample** |

*Validation Set Check (Unseen Normal Data):*
- Isolation Forest FPR on unseen normal data: **2.18%** (41 false alarms out of 1,881).
- Statistical Baseline FPR on unseen normal data: **58.16%** (1,094 false alarms out of 1,881).

---

## E. Error Analysis & Engineering Insights

### 1. High False Positive Rate on Test Sets (Domain Shift Analysis)
While Isolation Forest demonstrated an acceptable False Alarm Rate of **2.18%** on the unseen chronological normal validation set, its False Positive Rate surged to **88.07%** across the held-out test experiments.

**Root-Cause Diagnosis:**
Inspection of raw sensor distributions between `anomaly-free.csv` and `valve1/` experiments reveals severe **Covariate Shift / Operating Mode Mismatch**:
- In `anomaly-free.csv`, the testbed operated at a high hydraulic flow rate ($\approx 122$ L/h), resulting in motor RMS vibration of $\approx 0.20$ to $0.28\ g$ and operating temperature of $\approx 90.2^\circ\text{C}$.
- In the `valve1` experiments, the system was configured at a low flow rate ($\approx 32$ L/h), producing baseline vibration of $\approx 0.026$ to $0.040\ g$ and temperature of $\approx 79.5^\circ\text{C}$.
- Because the models were trained **exclusively** on the high-flow run, the entire nominal operating region of `valve1` fell far outside the training support envelope. Consequently, the models classified nominal pre-fault operation as anomalous.

### 2. Baseline Model Sensitivity to Thermal Drift
The Mahalanobis baseline triggered a 58.16% false alarm rate on the normal validation set. Because temperature steadily drifted as the machine warmed up over 2.5 hours, observations drifted out of the single Gaussian covariance ellipsoid, demonstrating the fragility of rigid linear distance metrics for time-varying industrial machinery.

---

## F. Data Leakage Audit

A comprehensive 10-point audit was performed to confirm zero leakage:
1. **Row Independence:** No random row splitting was performed; time-series ordering was strictly preserved.
2. **Scaler Scope:** `StandardScaler` was fitted strictly on `X_train`.
3. **Threshold Calibration:** Contamination and thresholds were calibrated strictly on training/validation normal data.
4. **Target Isolation:** `anomaly` and `changepoint` columns were removed prior to feature processing.
5. **No Peeking:** Test metrics were computed in a single forward pass without iterative hyperparameter retuning against test scores.

---

## G. Limitations

1. **Testbed Specificity:** SKAB is a closed water-loop testbed with a circulation pump and valves. It is not an electromechanical fault simulator for an isolated AC induction motor.
2. **Absence of Specific Motor Fault Labels:** The benchmark does not contain bearing inner-race defects, stator winding short circuits, or broken rotor bars.
3. **Single Operating State in Training:** Training solely on `anomaly-free.csv` provides no exposure to multiple load/speed states.
4. **Edge Deployment Feasibility (ESP32):**
   - While Isolation Forest latency on a desktop CPU is fast ($\approx 10.6\ \mu\text{s}$ per sample), evaluating 100 decision trees on an ESP32 microcontroller requires significant RAM and flash memory.
   - For an ESP32, compact autoencoders, quantization, or micro-statistical envelopes (running in fixed-point math) are far more hardware-friendly.

---

## H. Conclusion

**Verdict: The Isolation Forest pipeline successfully verified the algorithmic architecture, but the single-condition model cannot be deployed in production without multi-condition training.**

The pipeline functions correctly and deterministically:
- It effectively detected 90.27% of active anomalies (Recall = 0.9027).
- It achieved low false alarm rates (2.18%) on unseen data *within the same operating regime*.
- However, the 88.07% FPR on held-out files conclusively proves that **an unsupervised anomaly detector trained on one operating mode cannot generalize across different operating modes without adaptation**.

---

## I. Next Steps for AC Induction Motor Project

1. **Multi-Condition Healthy Baseline:** When recording baseline data on the laboratory AC induction motor using the ESP32, healthy data must be gathered across all valid operational states:
   - Unloaded / idle state
   - 25%, 50%, 75%, and 100% rated mechanical load
   - Transient startup and thermal equilibrium states
2. **Feature Engineering:** Replace raw sensor values with operational invariants:
   - Vibration spectral energy (FFT bin ratios rather than raw amplitude)
   - Current Park's vector or THD (Total Harmonic Distortion)
   - Temperature rise above ambient ($\Delta T = T_{\text{motor}} - T_{\text{ambient}}$)
3. **ESP32 Edge Prototype:** Implement fixed-point preprocessing on the ESP32 to compute RMS vibration, RMS current, and temperature delta directly at the sensor node before transmitting to the inference engine.
