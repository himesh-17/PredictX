import os
from pathlib import Path
from datetime import datetime
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.image as mpimg

BASE_DIR = Path(__file__).resolve().parent.parent
FIG_DIR = BASE_DIR / "reports" / "figures"
OUTPUT_PDF = BASE_DIR / "reports" / "MotorGuard_AI_Complete_Summary.pdf"

def draw_header_footer(ax, page_num, total_pages, title="MotorGuard AI — Executive Engineering Report"):
    ax.text(0.05, 0.96, title, fontsize=9, fontweight="bold", color="#334155", va="top")
    ax.text(0.95, 0.96, "IoT AC Induction Motor Predictive Maintenance", fontsize=8, color="#64748B", ha="right", va="top")
    ax.plot([0.05, 0.95], [0.945, 0.945], color="#CBD5E1", lw=0.75, transform=ax.transAxes)

    ax.plot([0.05, 0.95], [0.045, 0.045], color="#CBD5E1", lw=0.75, transform=ax.transAxes)
    ax.text(0.05, 0.03, "CONFIDENTIAL & PROPRIETARY — ACADEMIC / IOT ENGINEERING PROJECT", fontsize=7.5, color="#94A3B8", va="bottom")
    ax.text(0.95, 0.03, f"Page {page_num} of {total_pages}", fontsize=8, color="#64748B", ha="right", va="bottom")


def create_page_1(pdf):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    draw_header_footer(ax, 1, 5)

    # Document Header Title
    ax.text(0.05, 0.90, "MotorGuard AI: Intelligent Predictive Maintenance", fontsize=18, fontweight="bold", color="#0F172A")
    ax.text(0.05, 0.865, "Comprehensive Engineering Report: Machine Learning Anomaly Detection & Full-Stack IoT Architecture", fontsize=9.5, color="#2563EB", fontweight="semibold")
    ax.text(0.05, 0.84, f"Author: IoT Engineering Team & ML Mentor | Date: {datetime.now().strftime('%B %d, %Y')} | Version: 1.0.0-Release", fontsize=8, color="#64748B")

    # Section 1: Executive Summary Callout
    rect = plt.Rectangle((0.05, 0.69), 0.90, 0.13, facecolor="#F1F5F9", edgecolor="#CBD5E1", lw=1, transform=ax.transAxes, zorder=1)
    ax.add_patch(rect)
    ax.text(0.07, 0.80, "EXECUTIVE SUMMARY", fontsize=9, fontweight="bold", color="#1E293B")
    summary_text = (
        "This project presents an end-to-end, industrial-grade Predictive Maintenance platform for a 3-Phase AC Induction\n"
        "Motor. The system integrates an unsupervised machine learning model (Isolation Forest pipeline trained on the\n"
        "Skoltech Anomaly Benchmark), an independent deterministic standards assessment engine (IEC 60034-1 & vibration\n"
        "envelopes), a Node.js/TypeScript backend with a realistic physics simulator, and a single-page React/Vite dashboard.\n"
        "Rigorous auditing proved zero data leakage, verified a 90.27% anomaly recall on held-out tests, and revealed critical\n"
        "operating-condition mismatch (domain shift) essential for physical laboratory deployment."
    )
    ax.text(0.07, 0.705, summary_text, fontsize=8, color="#334155", va="top", linespacing=1.35)

    # Section 2: Key Benchmark Performance Metrics
    ax.text(0.05, 0.655, "1. Core Model Performance Metrics (Held-Out Benchmark)", fontsize=11, fontweight="bold", color="#0F172A")
    
    col_labels = ["Evaluation Metric", "Isolation Forest", "Statistical Baseline", "Engineering Meaning"]
    table_data = [
        ["Recall (Sensitivity)", "90.27%", "98.94%", "Detected 90.3% of true anomaly episodes"],
        ["Precision", "35.91%", "35.71%", "Fraction of alarms corresponding to real faults"],
        ["F1-Score", "0.5138", "0.5248", "Harmonic balance between precision & recall"],
        ["Validation Normal FPR", "2.18%", "58.16%", "False alarm rate on unseen healthy data"],
        ["Held-Out Test FPR", "88.07%", "97.39%", "Surge caused by domain shift / flow mismatch"],
        ["Inference Latency (CPU)", "0.0106 ms/sample", "0.0001 ms/sample", "Fast enough for real-time edge streaming"],
    ]

    table = ax.table(
        cellText=table_data,
        colLabels=col_labels,
        loc="center",
        bbox=[0.05, 0.44, 0.90, 0.20],
        cellLoc="left",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(7.8)
    for (row, col), cell in table.get_celld().items():
        cell.set_edgecolor("#CBD5E1")
        if row == 0:
            cell.set_facecolor("#1E293B")
            cell.set_text_props(color="white", weight="bold")
        else:
            if col == 1:
                cell.set_text_props(weight="bold", color="#0F172A")
            cell.set_facecolor("#FFFFFF" if row % 2 == 1 else "#F8FAFC")

    # Section 3: High-Level Architecture
    ax.text(0.05, 0.40, "2. System Architectural Highlights", fontsize=11, fontweight="bold", color="#0F172A")
    arch_bullets = [
        ("Decoupled Design: ", "Engineering standards (deterministic thresholds) operate independently from AI heuristics."),
        ("Feature Safeguard: ", "The AI service strictly checks feature contracts and rejects 4-channel telemetry with MODEL_INPUT_INCOMPATIBLE."),
        ("Physics Simulator: ", "Generates realistic 1Hz voltage, current, temp, and vibration with triggerable disturbances (overheating, surge)."),
        ("Zero-Crash Persistence: ", "Backend connects to MongoDB if available, automatically falling back to an in-memory repository."),
        ("Live React Dashboard: ", "Real-time WebSocket streaming with Recharts rolling time-series, KPI sparklines, and acknowledgeable alerts.")
    ]
    y_pos = 0.365
    for title, desc in arch_bullets:
        ax.text(0.07, y_pos, "• " + title, fontsize=8.5, fontweight="bold", color="#1E293B")
        ax.text(0.24, y_pos, desc, fontsize=8.5, color="#475569")
        y_pos -= 0.035

    # Section 4: Hardware Target
    rect_hw = plt.Rectangle((0.05, 0.08), 0.90, 0.09, facecolor="#EFF6FF", edgecolor="#BFDBFE", lw=1, transform=ax.transAxes)
    ax.add_patch(rect_hw)
    ax.text(0.07, 0.145, "HARDWARE DEPLOYMENT TARGET: ESP32 + 3-PHASE AC INDUCTION MOTOR", fontsize=8.5, fontweight="bold", color="#1E40AF")
    ax.text(0.07, 0.095, "Target Motor: 0.75kW (400V/230V, 3.2A rated, 4-pole, Class F insulation, frame 80M).\nPlanned Sensors: Non-invasive Current Transformer (Phase A), ZMPT101B Voltage, DS18B20 Temp, MPU6050 Vibration.\nMicrocontroller: ESP32 dual-core Xtensa running true RMS windowing and transmitting 1Hz telemetry via JSON REST/WebSocket.", fontsize=7.5, color="#1E3A8A", linespacing=1.3)

    pdf.savefig(fig)
    plt.close()


def create_page_2(pdf):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    draw_header_footer(ax, 2, 5)

    ax.text(0.05, 0.90, "3. Dataset Audit, Preprocessing & Experimental Design", fontsize=14, fontweight="bold", color="#0F172A")
    
    # Audit Table
    ax.text(0.05, 0.865, "A. SKAB Benchmark Inventory (All 35 CSV Files Verified)", fontsize=10, fontweight="bold", color="#334155")
    audit_cols = ["Folder Name", "Files", "Total Observations", "Null Values", "Duplicate TS", "Median dt", "Mean Anomaly %"]
    audit_data = [
        ["anomaly-free/", "1", "9,401 rows", "0", "0", "1.00 s", "0.0% (Healthy Baseline)"],
        ["other/", "14", "14,985 rows", "0", "0", "1.00 s", "36.4% (Multi-faults)"],
        ["valve1/", "16", "18,162 rows", "0", "0", "1.00 s", "34.7% (Valve 1 tests)"],
        ["valve2/", "4", "4,312 rows", "0", "0", "1.00 s", "35.3% (Valve 2 tests)"],
        ["Total Benchmark", "35", "46,860 rows", "0", "0", "1.00 s", "35.6% Active Anomaly"],
    ]
    t_audit = ax.table(cellText=audit_data, colLabels=audit_cols, loc="center", bbox=[0.05, 0.71, 0.90, 0.14], cellLoc="left")
    t_audit.auto_set_font_size(False)
    t_audit.set_fontsize(7.5)
    for (r, c), cell in t_audit.get_celld().items():
        cell.set_edgecolor("#CBD5E1")
        if r == 0:
            cell.set_facecolor("#1E293B")
            cell.set_text_props(color="white", weight="bold")
        elif r == 5:
            cell.set_facecolor("#E2E8F0")
            cell.set_text_props(weight="bold")
        else:
            cell.set_facecolor("#FFFFFF" if r % 2 == 1 else "#F8FAFC")

    # Features Selection Box
    ax.text(0.05, 0.675, "B. Selected Features vs Excluded Variables", fontsize=10, fontweight="bold", color="#334155")
    feat_text = (
        "• Selected 6 Features (Model Input): Accelerometer1RMS (g), Accelerometer2RMS (g), Current (A), Temperature (°C),\n"
        "  Thermocouple (°C), Voltage (V). Sourced strictly from motor-mounted electromechanical transducers.\n"
        "• Excluded Variables: Pressure & Volume Flow RateRMS (fluid hydraulics, not on direct motor sensor pod); datetime\n"
        "  (retained for tracking and gap analysis but excluded from features); anomaly & changepoint (strictly isolated labels)."
    )
    ax.text(0.05, 0.615, feat_text, fontsize=8, color="#334155", linespacing=1.35)

    # Zero-Leakage Split Strategy
    ax.text(0.05, 0.58, "C. Zero-Leakage Chronological & Experiment-Level Splitting", fontsize=10, fontweight="bold", color="#334155")
    split_desc = (
        "Random row shuffling (train_test_split(shuffle=True)) creates catastrophic temporal leakage in sensor telemetry because sample t\n"
        "and sample t+1 share high autocorrelation. To eliminate leakage, the following strict architectural split was enforced:\n"
        "1. Training Set (N = 7,520, 80% of anomaly-free.csv): Chronological window 13:30:47 to 15:43:57. Fits scaler and trees.\n"
        "2. Normal Validation Set (N = 1,881, 20% of anomaly-free.csv): Chronological window 15:43:58 to 16:16:47. Held out to measure FPR.\n"
        "3. Held-Out Test Set (34 Files, N = 37,459 across valve1, valve2, other): Entirely separate physical experiment runs."
    )
    ax.text(0.05, 0.495, split_desc, fontsize=8, color="#334155", linespacing=1.35)

    # Core Engineering Discovery: The Domain Shift
    rect_ds = plt.Rectangle((0.05, 0.12), 0.90, 0.35, facecolor="#FEF2F2", edgecolor="#FECACA", lw=1, transform=ax.transAxes)
    ax.add_patch(rect_ds)
    ax.text(0.07, 0.435, "THE CRITICAL SCIENTIFIC DISCOVERY: OPERATING MODE MISMATCH (DOMAIN SHIFT)", fontsize=9, fontweight="bold", color="#991B1B")
    ds_text = (
        "A central question arose during evaluation: Why did Isolation Forest achieve a low 2.18% False Positive Rate on the\n"
        "unseen normal validation set, but surged to 88.07% False Positive Rate on the held-out test experiments?\n\n"
        "ROOT-CAUSE PHYSICAL ANALYSIS:\n"
        "• In anomaly-free.csv (Training Data), the testbed operated at a high hydraulic flow rate (~122 L/h), producing motor\n"
        "  RMS vibration of 0.20 to 0.28 g and fluid temperature around 90.2°C.\n"
        "• In the valve1 experiments (Held-Out Test Data), the loop operated at a low hydraulic flow rate (~32 L/h), producing\n"
        "  baseline vibration of 0.026 to 0.040 g and operating temperature of 79.5°C.\n"
        "• Because the model was trained exclusively on the high-flow run, the entire nominal pre-fault region of valve1 was\n"
        "  statistically distant from the training support envelope. The model classified normal low-flow operation as an anomaly!\n\n"
        "CRITICAL LESSON FOR MOTOR PREDICTIVE MAINTENANCE:\n"
        "An unsupervised anomaly detector cannot distinguish between a mechanical fault and a different operational load state\n"
        "(e.g., motor at 25% load vs 100% load) unless healthy baseline data from all operating modes is collected during training."
    )
    ax.text(0.07, 0.14, ds_text, fontsize=8, color="#7F1D1D", va="bottom", linespacing=1.3)

    pdf.savefig(fig)
    plt.close()


def create_page_3(pdf):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    draw_header_footer(ax, 3, 5)

    ax.text(0.05, 0.90, "4. Benchmark Evaluation & Anomaly Score Distributions", fontsize=14, fontweight="bold", color="#0F172A")
    ax.text(0.05, 0.865, "Side-by-side comparison of Isolation Forest vs. Mahalanobis Statistical Baseline across 37,459 observations", fontsize=8.5, color="#64748B")

    # Embed Confusion Matrices Plot
    cm_path = FIG_DIR / "04_confusion_matrices.png"
    if cm_path.exists():
        img_cm = mpimg.imread(str(cm_path))
        ax_img1 = fig.add_axes([0.05, 0.53, 0.90, 0.31])
        ax_img1.imshow(img_cm)
        ax_img1.axis("off")
        ax.text(0.05, 0.845, "A. Confusion Matrix Comparison (Statistical Baseline vs Isolation Forest)", fontsize=9.5, fontweight="bold", color="#334155")

    # Embed Anomaly Score Distribution Plot
    dist_path = FIG_DIR / "05_anomaly_score_distribution.png"
    if dist_path.exists():
        img_dist = mpimg.imread(str(dist_path))
        ax_img2 = fig.add_axes([0.05, 0.14, 0.90, 0.33])
        ax_img2.imshow(img_dist)
        ax_img2.axis("off")
        ax.text(0.05, 0.49, "B. Continuous Isolation Forest Score Distribution (Normal vs Injected Anomaly)", fontsize=9.5, fontweight="bold", color="#334155")

    ax.text(0.05, 0.09, "Figure Notes: Panel A shows true positive detections (TP=11,952) and false alarms (FP=21,329) on test sets.\nPanel B illustrates decision boundary score density: nominal inliers peak above -0.50, while anomalies exhibit negative tail scores.", fontsize=7.5, color="#64748B", linespacing=1.3)

    pdf.savefig(fig)
    plt.close()


def create_page_4(pdf):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    draw_header_footer(ax, 4, 5)

    ax.text(0.05, 0.90, "5. Telemetry Diagnostics & Time-Series Anomaly Detection", fontsize=14, fontweight="bold", color="#0F172A")
    ax.text(0.05, 0.865, "Visualizing multi-channel sensor signals and ground-truth vs model prediction alignment", fontsize=8.5, color="#64748B")

    # Embed Labelled Sensor Time Series
    ts_path = FIG_DIR / "02_labelled_sensor_timeseries.png"
    if ts_path.exists():
        img_ts = mpimg.imread(str(ts_path))
        ax_img1 = fig.add_axes([0.05, 0.52, 0.90, 0.32])
        ax_img1.imshow(img_ts)
        ax_img1.axis("off")
        ax.text(0.05, 0.845, "A. 6-Channel Telemetry Stream with Anomaly Window (valve1/0.csv)", fontsize=9.5, fontweight="bold", color="#334155")

    # Embed Predictions Comparison
    pred_path = FIG_DIR / "03_ground_truth_vs_predictions.png"
    if pred_path.exists():
        img_pred = mpimg.imread(str(pred_path))
        ax_img2 = fig.add_axes([0.05, 0.14, 0.90, 0.33])
        ax_img2.imshow(img_pred)
        ax_img2.axis("off")
        ax.text(0.05, 0.485, "B. Prediction Tracking: Ground Truth vs Isolation Forest vs Baseline Model", fontsize=9.5, fontweight="bold", color="#334155")

    ax.text(0.05, 0.09, "Diagnostic Insight: In Panel B, false positives (orange dots) occur prior to the fault because the pre-fault vibration baseline\n(0.03 g) differed from training (0.25 g). The model successfully flagged the entire active disturbance window with high recall.", fontsize=7.5, color="#64748B", linespacing=1.3)

    pdf.savefig(fig)
    plt.close()


def create_page_5(pdf):
    fig, ax = plt.subplots(figsize=(8.5, 11), dpi=200)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    draw_header_footer(ax, 5, 5)

    ax.text(0.05, 0.90, "6. Full-Stack Application Architecture & Hardware Roadmap", fontsize=14, fontweight="bold", color="#0F172A")

    # Architecture Breakdown
    ax.text(0.05, 0.865, "A. Full-Stack Software Implementation Details", fontsize=10, fontweight="bold", color="#334155")
    software_rows = [
        ["Subsystem", "Technologies", "Key Engineering Responsibilities"],
        ["AI Service", "FastAPI, scikit-learn, joblib", "Enforces feature contract. Rejects 4-channel input with MODEL_INPUT_INCOMPATIBLE. Provides /test-fixture."],
        ["Backend", "Node.js, Express, Socket.IO, Zod", "Realistic physics generator (1Hz). Evaluates standards. Dual MongoDB/In-memory store. 15s alert cooldown."],
        ["Standards Engine", "limits.json, Python & TS", "Deterministic limit evaluation against IEC 60034-1 & vibration envelopes. Independent of ML heuristics."],
        ["React Frontend", "React 18, Vite, Recharts, Tailwind", "Single-page dashboard. 4 sensor KPI cards, 4 live animated Recharts streams, alert acknowledge UI."],
    ]
    t_soft = ax.table(cellText=software_rows[1:], colLabels=software_rows[0], loc="center", bbox=[0.05, 0.69, 0.90, 0.16], cellLoc="left")
    t_soft.auto_set_font_size(False)
    t_soft.set_fontsize(7.5)
    for (r, c), cell in t_soft.get_celld().items():
        cell.set_edgecolor("#CBD5E1")
        if r == 0:
            cell.set_facecolor("#1E293B")
            cell.set_text_props(color="white", weight="bold")
        else:
            if c == 0:
                cell.set_text_props(weight="bold")
            cell.set_facecolor("#FFFFFF" if r % 2 == 1 else "#F8FAFC")

    # Hardware Implementation Roadmap
    ax.text(0.05, 0.655, "B. Physical AC Induction Motor & ESP32 Integration Plan", fontsize=10, fontweight="bold", color="#334155")
    hw_text = (
        "1. Multi-Condition Healthy Baseline Collection:\n"
        "   Before deploying anomaly detection to the physical laboratory motor, healthy baseline recordings MUST be gathered across\n"
        "   multiple operating states: uncoupled idle, 25%, 50%, 75%, and 100% rated mechanical load, cold startup, and thermal equilibrium.\n"
        "   This prevents the operating-mode mismatch discovered during SKAB benchmark analysis.\n\n"
        "2. Operational Invariant Feature Engineering:\n"
        "   Instead of feeding raw amplitude vibration and current into the AI detector, extract operational invariants:\n"
        "   • Vibration Crest Factor (Peak / RMS) and Spectral Kurtosis (impacting indicator independent of load speed).\n"
        "   • Current Total Harmonic Distortion (THD) and Phase Balance ratio.\n"
        "   • Temperature rise relative to ambient (Delta T = T_motor - T_ambient).\n\n"
        "3. ESP32 Edge Preprocessing Firmware:\n"
        "   • Sample accelerometer at 1000 Hz into 1-second rolling circular buffer.\n"
        "   • Compute true RMS acceleration on-device in fixed-point / single-precision floating point.\n"
        "   • Transmit 1 Hz preprocessed feature packets over HTTP REST or WebSocket to the backend."
    )
    ax.text(0.05, 0.445, hw_text, fontsize=8, color="#334155", linespacing=1.35)

    # Verification Sign-off Box
    rect_sign = plt.Rectangle((0.05, 0.08), 0.90, 0.33, facecolor="#F8FAFC", edgecolor="#CBD5E1", lw=1, transform=ax.transAxes)
    ax.add_patch(rect_sign)
    ax.text(0.07, 0.38, "PROJECT VERIFICATION & QUALITY AUDIT SIGN-OFF", fontsize=9, fontweight="bold", color="#0F172A")
    sign_text = (
        "[x] Dataset Audit: Verified 35 SKAB CSV files (46,860 rows, 0 nulls, 0 duplicate timestamps, 1.00s sampling).\n"
        "[x] Data Leakage Audit: Chronological train/val splitting enforced; no test target leakage into feature space.\n"
        "[x] ML Model Artifacts: Trained StandardScaler + IsolationForest pipeline saved via joblib (1.39 MB).\n"
        "[x] Automated Test Suite: 6 pytest unit tests passed (test_pipeline.py: 100% pass rate in 8.88s).\n"
        "[x] Feature Compatibility Guard: API rejects incompatible physical telemetry with MODEL_INPUT_INCOMPATIBLE.\n"
        "[x] Standards Assessment: Configured in limits.json with clear demo notice; independent of AI heuristics.\n"
        "[x] Full-Stack Codebase: Python FastAPI (port 8000), Node.js backend (port 5000), React Vite dashboard (port 3000).\n"
        "[x] Zero-Crash Resilience: Backend verified running with in-memory persistence fallback when MongoDB is offline."
    )
    ax.text(0.07, 0.10, sign_text, fontsize=8, color="#1E293B", linespacing=1.45)

    pdf.savefig(fig)
    plt.close()


def generate_pdf():
    print(f"Generating Executive PDF Summary to: {OUTPUT_PDF}")
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    with PdfPages(OUTPUT_PDF) as pdf:
        create_page_1(pdf)
        create_page_2(pdf)
        create_page_3(pdf)
        create_page_4(pdf)
        create_page_5(pdf)
    print(f"PDF Successfully Generated! Size: {OUTPUT_PDF.stat().st_size} bytes")


if __name__ == "__main__":
    generate_pdf()
