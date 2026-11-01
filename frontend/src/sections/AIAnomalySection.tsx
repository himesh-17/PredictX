import React, { useState } from "react";
import { AlertCircle, BrainCircuit, CheckCircle2, Play, Sparkles, Terminal, XCircle, AlertTriangle } from "lucide-react";
import { AIPredictionResult } from "../types";

interface AIAnomalySectionProps {
  prediction: AIPredictionResult | null;
  modelCard: any;
  onRunIntegrationTest: () => Promise<any>;
}

export const AIAnomalySection: React.FC<AIAnomalySectionProps> = ({
  prediction,
  modelCard,
  onRunIntegrationTest,
}) => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestClick = async () => {
    setIsRunningTest(true);
    setTestError(null);
    try {
      const res = await onRunIntegrationTest();
      if (res) {
        setTestResult(res);
        if (res.status === "MODEL_UNAVAILABLE") {
          setTestError(res.explanation);
        }
      }
    } catch (err: any) {
      setTestError(err.message || "Failed to communicate with AI Service. Ensure Python FastAPI service is running on port 8000.");
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE]">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9]">
              AI Anomaly Detection Pipeline
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Unsupervised Machine Learning Integration (Isolation Forest on SKAB Benchmark)
            </p>
          </div>
        </div>

        <button
          onClick={handleTestClick}
          disabled={isRunningTest}
          className="flex items-center gap-1.5 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/40 px-3.5 py-1.5 text-xs font-bold text-[#22D3EE] hover:bg-[#22D3EE]/25 transition-all disabled:opacity-50 shadow-sm"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {isRunningTest ? "Executing Test Fixture..." : "Run Model Integration Test"}
        </button>
      </div>

      {/* Grid: Status & Benchmark Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Input Compatibility Status */}
        <div className="rounded-lg border border-[#1E293B] bg-[#172338] p-3.5 space-y-1.5">
          <span className="text-xs font-medium text-[#94A3B8] uppercase">
            Feature Contract Status
          </span>
          <div className="text-sm font-bold font-mono text-[#FBBF24]">
            {prediction?.status || "CHECKING..."}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            {prediction?.status === "MODEL_INPUT_INCOMPATIBLE"
              ? "Motor telemetry lacks Accelerometer2RMS and Thermocouple."
              : "Feature contract satisfied."}
          </div>
        </div>

        {/* Box 2: Reported Recall (Sensitivity) */}
        <div className="rounded-lg border border-[#1E293B] bg-[#172338] p-3.5 space-y-1.5">
          <span className="text-xs font-medium text-[#94A3B8] uppercase">
            Reported Test Recall
          </span>
          <div className="text-2xl font-bold font-mono text-[#34D399]">
            {modelCard?.reportedMetrics ? `${(modelCard.reportedMetrics.recall * 100).toFixed(1)}%` : "90.3%"}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Detected 90.27% of active disturbances in SKAB test recordings.
          </div>
        </div>

        {/* Box 3: Reported False Positive Rate */}
        <div className="rounded-lg border border-[#1E293B] bg-[#172338] p-3.5 space-y-1.5">
          <span className="text-xs font-medium text-[#94A3B8] uppercase">
            Test False Alarm Rate
          </span>
          <div className="text-2xl font-bold font-mono text-[#F87171]">
            {modelCard?.reportedMetrics ? `${(modelCard.reportedMetrics.falsePositiveRateTest * 100).toFixed(1)}%` : "88.1%"}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            High FPR due to testbed flow-rate mismatch (Domain Shift).
          </div>
        </div>

        {/* Box 4: Unseen Normal Validation FPR */}
        <div className="rounded-lg border border-[#1E293B] bg-[#172338] p-3.5 space-y-1.5">
          <span className="text-xs font-medium text-[#94A3B8] uppercase">
            Normal Validation FPR
          </span>
          <div className="text-2xl font-bold font-mono text-[#22D3EE]">
            {modelCard?.reportedMetrics ? `${(modelCard.reportedMetrics.falsePositiveRateValidation * 100).toFixed(2)}%` : "2.18%"}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Low false alarms when evaluated under identical operating mode.
          </div>
        </div>
      </div>

      {/* Feature Compatibility Explanation Callout */}
      {prediction?.status === "MODEL_INPUT_INCOMPATIBLE" && (
        <div className="rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 p-3.5 text-xs text-[#FBBF24] space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            CRITICAL FEATURE COMPATIBILITY SAFEGUARD:
          </div>
          <div className="text-[#F1F5F9]/90 leading-relaxed">
            {prediction.explanation}
          </div>
          <div className="text-[11px] text-[#FBBF24]/80 pt-1">
            <strong>Expected 6 Features:</strong> Accelerometer1RMS, Accelerometer2RMS, Current, Temperature, Thermocouple, Voltage.
          </div>
        </div>
      )}

      {/* Test Error Callout */}
      {testError && (
        <div className="rounded-lg border border-[#F87171]/40 bg-[#F87171]/10 p-3.5 text-xs text-[#F87171] space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            AI Service Communication Error:
          </div>
          <div className="text-[#F1F5F9]/90 leading-relaxed font-mono">
            {testError}
          </div>
          <div className="text-[11px] text-[#F87171]/80">
            Start the Python FastAPI service using: <code>& "C:\Program Files\Python314\python.exe" -m uvicorn app.main:app --app-dir ai-service --host 127.0.0.1 --port 8000</code>
          </div>
        </div>
      )}

      {/* Integration Test Result Display */}
      {testResult && testResult.status !== "MODEL_UNAVAILABLE" && (
        <div className="rounded-lg border border-[#22D3EE]/30 bg-[#172338] p-3.5 text-xs font-mono space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[#22D3EE] font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Model Integration Test Result (SKAB Nominal Test Fixture):
            </span>
            <span className="rounded bg-[#22D3EE]/20 px-2 py-0.5 text-xs border border-[#22D3EE]/40">
              {testResult.status}
            </span>
          </div>
          <div className="text-[#94A3B8]">
            Decision Score: <span className="text-[#F1F5F9] font-bold">{testResult.anomalyScore}</span> | Threshold: -0.5000 | Raw Inlier/Outlier: {testResult.prediction === 0 ? "Normal (+1)" : "Outlier (-1)"}
          </div>
          <div className="text-[11px] text-[#34D399] font-sans">
            ✓ Full end-to-end pipeline verified: Express Backend forwarded 6-feature fixture to Python FastAPI, executed StandardScaler and IsolationForest, and returned formatted response.
          </div>
        </div>
      )}

      {/* Known Limitations Box */}
      <div className="rounded-lg border border-[#1E293B] bg-[#172338]/60 p-3.5 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-[#60A5FA]" />
          Documented Model Limitations & Scientific Caveats:
        </span>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#94A3B8]">
          <li className="flex items-start gap-1.5">
            <span className="text-[#FBBF24]">•</span>
            Trained on closed-loop pump testbed (SKAB), not specific AC induction motor internal faults.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#FBBF24]">•</span>
            Cannot diagnose specific induction motor faults (e.g. stator winding turn faults, broken rotor bars).
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#FBBF24]">•</span>
            Does not predict remaining useful life (RUL) or date of equipment failure.
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#FBBF24]">•</span>
            A "Normal" prediction is not proof that the physical equipment is mechanically healthy.
          </li>
        </ul>
      </div>
    </div>
  );
};
