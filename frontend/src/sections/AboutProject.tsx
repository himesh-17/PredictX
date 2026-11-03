import React from "react";
import {
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Thermometer,
  ShieldAlert,
  Server,
  Database,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Radio,
  Clock,
  Eye,
  FileCode,
} from "lucide-react";

export const AboutProject: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn text-[#F1F5F9]">
      {/* 1. Hero / Project Overview Header */}
      <div className="rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#111B2E] via-[#0B1220] to-[#172338] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-64 w-64 rounded-full bg-[#3B82F6]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-3 py-1 text-xs font-bold font-mono text-[#22D3EE]">
              AIoT PREDICTIVE MAINTENANCE PLATFORM
            </span>
            <span className="rounded-md bg-[#34D399]/15 border border-[#34D399]/30 px-3 py-1 text-xs font-bold font-mono text-[#34D399]">
              AC INDUCTION MOTOR
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F1F5F9]">
            Intelligent Condition Monitoring & AI Anomaly Detection System
          </h2>

          <p className="text-sm text-[#94A3B8] leading-relaxed">
            A comprehensive, end-to-end AIoT engineering project designed for real-time health assessment of 
            three-phase AC induction motors. The platform combines high-frequency edge sensing on an 
            <strong> ESP32 DevKit V1</strong>, deterministic <strong>engineering standards evaluation</strong> (IEC 60034-1 & vibration velocity envelopes), 
            and an unsupervised <strong>Isolation Forest Machine Learning pipeline</strong> with a real-time reactive React dashboard.
          </p>
        </div>
      </div>

      {/* 2. Architecture Visuals: Block Diagram & Circuit Diagram */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
          <Layers className="h-5 w-5 text-[#22D3EE]" />
          <h3 className="text-lg font-bold text-[#F1F5F9]">
            System Architecture & Electrical Hardware Diagrams
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: System Block Diagram */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono uppercase text-[#22D3EE] flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> System Block Diagram
                </span>
                <span className="text-[11px] text-[#94A3B8] font-mono">End-to-End Flow</span>
              </div>
              <p className="text-xs text-[#94A3B8] mb-3">
                Information pipeline from the physical AC motor and transducers through the ESP32 edge layer, 
                backend persistence, Python ML inference, to the live React interface.
              </p>
            </div>

            <div className="rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B1220] flex items-center justify-center p-2 group">
              <img
                src="/images/system_block_diagram.jpg"
                alt="AIoT Predictive Maintenance System Block Diagram"
                className="w-full h-auto object-contain rounded transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="text-[11px] text-[#64748B] font-mono text-center pt-1">
              Figure 1: AIoT Predictive Maintenance Architecture (Sensors → ESP32 → API → ML → Dashboard)
            </div>
          </div>

          {/* Card B: Electrical Circuit Diagram */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono uppercase text-[#34D399] flex items-center gap-1.5">
                  <Zap className="h-4 w-4" /> Electrical Circuit Diagram
                </span>
                <span className="text-[11px] text-[#94A3B8] font-mono">ESP32 Pinout</span>
              </div>
              <p className="text-xs text-[#94A3B8] mb-3">
                Isolated monitoring circuit wiring diagram showing sensor connections (CT clamp on GPIO 32, 
                DS18B20 on GPIO 4, MPU-6500 I2C on GPIO 21/22, and galvanic separation from high-voltage motor mains).
              </p>
            </div>

            <div className="rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B1220] flex items-center justify-center p-2 group">
              <img
                src="/images/electrical_circuit_diagram.jpg"
                alt="ESP32 DevKit V1 with Sensors Electrical Circuit Diagram"
                className="w-full h-auto object-contain rounded transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="text-[11px] text-[#64748B] font-mono text-center pt-1">
              Figure 2: Electrical Interfacing of Monitoring Node (Galvanically Isolated from AC Power)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep-Dive Architecture Layers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
          <Cpu className="h-5 w-5 text-[#60A5FA]" />
          <h3 className="text-lg font-bold text-[#F1F5F9]">
            Technical Deep-Dive: The 5 System Layers
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Layer 1: Sensor & Physical Motor */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#22D3EE]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22D3EE]/20 text-xs font-mono">1</span>
              Condition Monitoring Sensors
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Monitors critical electromechanical indicators without physical invasion of motor windings:
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li><strong>AC Current Sensor (CT):</strong> Non-invasive clamp on Phase A to detect mechanical overload and unbalanced draw.</li>
              <li><strong>MPU-6500 (I2C):</strong> 6-axis high-bandwidth motion sensor bolted to bearing cap measuring dynamic impact vibration acceleration RMS.</li>
              <li><strong>DS18B20 (1-Wire):</strong> Digital thermal sensor measuring frame surface temperature rise.</li>
            </ul>
          </div>

          {/* Layer 2: ESP32 Edge Computing */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#34D399]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#34D399]/20 text-xs font-mono">2</span>
              ESP32 Edge Microcontroller
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Acts as the real-time embedded edge processor running on-chip digital signal processing:
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li>Samples analog ADC & I2C at <strong>1 kHz</strong> inside a 1-second rolling circular buffer.</li>
              <li>Computes <strong>True RMS</strong> on-device, compressing raw kilohertz streams into 1 Hz feature packets.</li>
              <li>Transmits structured JSON payloads over WiFi HTTP POST to the backend with automatic reconnection logic.</li>
            </ul>
          </div>

          {/* Layer 3: Backend & Dual Persistence */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#FBBF24]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FBBF24]/20 text-xs font-mono">3</span>
              Node.js Express & Persistence
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              High-throughput asynchronous telemetry broker and standards evaluation service:
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li>REST endpoints under <code>/api/v1</code> and sub-second WebSocket broadcasting via <strong>Socket.IO</strong>.</li>
              <li><strong>Dual-mode persistence:</strong> Mongoose MongoDB connection with zero-crash automatic in-memory fallback.</li>
              <li>Realistic multi-mode physics simulator providing fallback streams and triggerable synthetic disturbances.</li>
            </ul>
          </div>

          {/* Layer 4: Independent Standards Engine */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#60A5FA]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#60A5FA]/20 text-xs font-mono">4</span>
              Standards Assessment Engine
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Evaluates incoming telemetry deterministically against engineering rules (independent of ML heuristics):
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li>Applies rated motor current limits (e.g. 3.2A rated, 5.0A trip ceiling) and thermal boundary envelopes.</li>
              <li>Applies IEC 60034-1 voltage tolerance limits (±10%, 207V–253V).</li>
              <li>Enables operators to dynamically adjust and persist limits directly via the dashboard Limit Manager.</li>
            </ul>
          </div>

          {/* Layer 5: AI Anomaly Detection */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F87171]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F87171]/20 text-xs font-mono">5</span>
              Python FastAPI AI Inference
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Microservice executing the trained Isolation Forest pipeline:
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li>Enforces strict <strong>Feature Contract Validation</strong> to protect against fake data fabrication.</li>
              <li>Rejects 4-sensor hardware payloads with <code>MODEL_INPUT_INCOMPATIBLE</code> instead of guessing values.</li>
              <li>Provides verified test fixture execution demonstrating instantaneous scikit-learn anomaly scoring.</li>
            </ul>
          </div>

          {/* Layer 6: React Dashboard */}
          <div className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#22D3EE]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22D3EE]/20 text-xs font-mono">6</span>
              Reactive Industrial Dashboard
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Industrial monitoring single-page application built with React, Vite, and Tailwind:
            </p>
            <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
              <li>Smooth rolling Recharts animated time-series (30s, 60s, 90s history).</li>
              <li>Instantaneous sensor KPI cards with previous-second delta (Δ) tracking and mini sparklines.</li>
              <li>Filterable alerts history table with persistent two-way acknowledgement.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Engineering Pros & Cons (Balanced Evaluation) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
          <ShieldAlert className="h-5 w-5 text-[#FBBF24]" />
          <h3 className="text-lg font-bold text-[#F1F5F9]">
            Engineering Analysis: Advantages (Pros) vs Limitations (Cons)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADVANTAGES (PROS) */}
          <div className="rounded-xl border border-[#34D399]/40 bg-[#34D399]/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#34D399]">
              <CheckCircle2 className="h-5 w-5" />
              SYSTEM ADVANTAGES (PROS)
            </div>

            <div className="space-y-3 text-xs text-[#CBD5E1]">
              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">1. Non-Invasive & High Safety</span>
                The sensor monitoring unit is completely galvanically isolated from the high-voltage motor mains circuit. CT clamps and surface RTDs eliminate direct electrical contact risks.
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">2. On-Device Edge Compression (True RMS)</span>
                Instead of burdening local Wi-Fi networks by sending raw kilohertz ADC arrays, the ESP32 performs edge True RMS integration, reducing telemetry transmission bandwidth by 99.9%.
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">3. Dual Operational Safeguards (AI + Standards)</span>
                A mechanical anomaly that the ML model might miss will still be flagged deterministically by the standards assessment engine if current, temperature, or vibration exceed safe thresholds.
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">4. Scientific Rigor & No Data Fabrication</span>
                Unlike generic demos, the system contains a strict Feature Compatibility Guard that transparently refuses to feed mismatched sensor dimensions into the SKAB Isolation Forest model.
              </div>

              <div>
                <span className="font-bold text-[#F1F5F9] block mb-0.5">5. Zero-Crash Dual Persistence & Fallback</span>
                The Node.js backend handles missing MongoDB connections seamlessly with an in-memory repository, and the frontend provides simulated streams if hardware is disconnected.
              </div>
            </div>
          </div>

          {/* LIMITATIONS (CONS) */}
          <div className="rounded-xl border border-[#F87171]/40 bg-[#F87171]/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F87171]">
              <AlertTriangle className="h-5 w-5" />
              SYSTEM LIMITATIONS & CHALLENGES (CONS)
            </div>

            <div className="space-y-3 text-xs text-[#CBD5E1]">
              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">1. Operating Mode Mismatch (Domain Shift)</span>
                Unsupervised anomaly models trained on a single baseline speed/load will trigger false alarms if the motor operates at different load points (e.g. 25% load vs 100% load).
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">2. Thermal Lag of Surface Temperature</span>
                The DS18B20 sensor measures external frame temperature. Thermal capacitance causes a delay before internal stator winding hotspot rises register on the external housing.
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">3. General Anomaly vs Root-Cause Diagnosis</span>
                The initial Isolation Forest flags general out-of-distribution events but cannot independently distinguish between bearing raceway spalls, rotor bar breakage, or supply phase unbalance without spectral FFT classification.
              </div>

              <div className="border-b border-[#1E293B]/70 pb-2">
                <span className="font-bold text-[#F1F5F9] block mb-0.5">4. No Remaining Useful Life (RUL) Prognostics</span>
                The current anomaly pipeline determines current machine health condition; it does not predict exact time-to-failure or remaining operating hours.
              </div>

              <div>
                <span className="font-bold text-[#F1F5F9] block mb-0.5">5. Accelerometer Bandwidth Limitations</span>
                The MPU-6500 sampling over standard I2C provides excellent low-frequency vibration monitoring (unbalance, misalignment), but lacks the multi-kilohertz bandwidth of industrial piezo accelerometers for microscopic bearing defect frequencies.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Next Steps for Hardware Laboratory Deployment */}
      <div className="rounded-xl border border-[#22D3EE]/30 bg-[#172338]/60 p-5 space-y-3">
        <h4 className="text-sm font-bold text-[#22D3EE] flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Recommended Next Steps for Laboratory Deployment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#94A3B8]">
          <div className="bg-[#111B2E] p-3 rounded-lg border border-[#1E293B]">
            <span className="font-bold text-[#F1F5F9] block mb-1">Step 1: Multi-Load Baseline</span>
            Collect baseline healthy motor recordings under idle, 25%, 50%, 75%, and 100% load before deploying the final anomaly detector.
          </div>
          <div className="bg-[#111B2E] p-3 rounded-lg border border-[#1E293B]">
            <span className="font-bold text-[#F1F5F9] block mb-1">Step 2: Invariant Features</span>
            Compute vibration crest factor and current total harmonic distortion (THD) on the ESP32 to eliminate load sensitivity.
          </div>
          <div className="bg-[#111B2E] p-3 rounded-lg border border-[#1E293B]">
            <span className="font-bold text-[#F1F5F9] block mb-1">Step 3: Supervised Classification</span>
            Once real motor baseline data is logged, train a supervised multiclass classifier (e.g. Random Forest / 1D-CNN) for specific fault diagnosis.
          </div>
        </div>
      </div>
    </div>
  );
};
