import { useState, useEffect, useCallback, useRef } from "react";
import {
  AIPredictionResult,
  Alert,
  ReadingAssessmentResult,
  SensorReading,
} from "../types";
import {
  acknowledgeAlertApi,
  fetchAIModelCard,
  fetchAlerts,
  fetchHealth,
  fetchHistory,
  fetchStandardsConfig,
  injectDisturbanceApi,
  runAIIntegrationTestApi,
  startSimulationApi,
  stopSimulationApi,
  updateStandardsConfigApi,
} from "../services/api";
import { socketService } from "../services/socket";

const DEFAULT_SEED_ALERTS: Alert[] = [
  {
    id: "alert-seed-001",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "standards",
    severity: "critical",
    parameter: "Current",
    observedValue: 5.68,
    unit: "A",
    limitOrRule: "IEC 60034-1 Thermal Overload Limit: 5.00 A",
    explanation: "Stator phase current exceeded rated full-load current (FLA) by +13.6%. Sustained operation triggers thermal overload trip.",
    source: "simulation",
    acknowledged: false,
  },
  {
    id: "alert-seed-002",
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "ai_anomaly",
    severity: "critical",
    parameter: "Multivariate AI Feature Vector",
    observedValue: -0.312,
    unit: "score",
    limitOrRule: "Isolation Forest Anomaly Threshold: -0.150",
    explanation: "Unsupervised Isolation Forest algorithm identified sensor divergence indicative of early bearing raceway spalling.",
    source: "simulation",
    acknowledged: false,
  },
  {
    id: "alert-seed-003",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "standards",
    severity: "warning",
    parameter: "Temperature",
    observedValue: 81.5,
    unit: "°C",
    limitOrRule: "NEMA Class B Winding/Frame Warning: 75.0 °C",
    explanation: "Motor surface temperature elevated above normal operating baseline. Cooling ventilation reduced or load duty cycle high.",
    source: "simulation",
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-seed-004",
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "standards",
    severity: "warning",
    parameter: "Vibration",
    observedValue: 0.412,
    unit: "g RMS",
    limitOrRule: "ISO 10816-3 Class I/II Boundary: 0.35 g RMS",
    explanation: "RMS vibration acceleration entered Zone B (Unrestricted Long-Term Operation Boundary). Early rotor unbalance detected.",
    source: "simulation",
    acknowledged: false,
  },
  {
    id: "alert-seed-005",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "standards",
    severity: "warning",
    parameter: "Voltage",
    observedValue: 197.8,
    unit: "V",
    limitOrRule: "IEC 60038 Supply Tolerance (-10%): 207.0 V",
    explanation: "Transient under-voltage sag detected on single-phase line input. Voltage recovered after 12 seconds.",
    source: "simulation",
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-seed-006",
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    motorId: "MOTOR-001",
    category: "system",
    severity: "info",
    parameter: "ESP32 Bus / Simulator",
    observedValue: 1,
    unit: "status",
    limitOrRule: "ISO 13373-1 Condition Monitoring Bus",
    explanation: "Predict X continuous condition monitoring engine initialized with active predictive models.",
    source: "hardware_esp32",
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
  },
];

export function useTelemetry() {
  // Simulated Stream State
  const [simHistory, setSimHistory] = useState<SensorReading[]>([]);
  const [latestSimReading, setLatestSimReading] = useState<SensorReading | null>(null);
  const [simAssessment, setSimAssessment] = useState<ReadingAssessmentResult | null>(null);

  // Live Hardware ESP32 Stream State
  const [hardwareHistory, setHardwareHistory] = useState<SensorReading[]>([]);
  const [latestHardwareReading, setLatestHardwareReading] = useState<SensorReading | null>(null);
  const [hardwareAssessment, setHardwareAssessment] = useState<ReadingAssessmentResult | null>(null);

  // AI & Standards & Alerts State
  const [aiPrediction, setAiPrediction] = useState<AIPredictionResult | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(DEFAULT_SEED_ALERTS);
  const [modelCard, setModelCard] = useState<any>(null);
  const [standardsConfig, setStandardsConfig] = useState<any>(null);

  // System & Connection States
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [aiServiceOnline, setAiServiceOnline] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [activeDisturbance, setActiveDisturbance] = useState<string>("NONE");
  const [disturbanceSeconds, setDisturbanceSeconds] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Initial Data Fetching
  const loadInitialData = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setBackendConnected(true);
      setAiServiceOnline(health.aiService?.status === "online");
      setSimulationRunning(health.simulation?.isRunning ?? true);
      setActiveDisturbance(health.simulation?.activeDisturbance ?? "NONE");

      const [sHist, hHist, alertList, card, stdCfg] = await Promise.all([
        fetchHistory("MOTOR-001", 60, "simulation"),
        fetchHistory("MOTOR-001", 60, "hardware_esp32"),
        fetchAlerts("MOTOR-001"),
        fetchAIModelCard(),
        fetchStandardsConfig(),
      ]);

      if (sHist && sHist.length > 0) {
        setSimHistory(sHist);
        setLatestSimReading(sHist[sHist.length - 1]);
        setLastUpdated(sHist[sHist.length - 1].timestamp);
      }
      if (hHist && hHist.length > 0) {
        setHardwareHistory(hHist);
        setLatestHardwareReading(hHist[hHist.length - 1]);
      }
      if (alertList && alertList.length > 0) {
        setAlerts(alertList);
      } else {
        setAlerts(DEFAULT_SEED_ALERTS);
      }
      setModelCard(card);
      setStandardsConfig(stdCfg);
    } catch {
      setBackendConnected(false);
      setAlerts((prev) => (prev.length > 0 ? prev : DEFAULT_SEED_ALERTS));
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Setup periodic health ping
    const pingTimer = setInterval(async () => {
      try {
        const h = await fetchHealth();
        setBackendConnected(true);
        setAiServiceOnline(h.aiService?.status === "online");
      } catch {
        setBackendConnected(false);
        setAiServiceOnline(false);
      }
    }, 5000);

    // Setup Socket.IO
    const socket = socketService.connect();

    socket.on("connect", () => {
      setBackendConnected(true);
    });

    socket.on("disconnect", () => {
      setBackendConnected(false);
    });

    // 1. Simulation Stream Socket Events
    socket.on("telemetry:new", (reading: SensorReading) => {
      if (isPausedRef.current) return;
      setLatestSimReading(reading);
      setLastUpdated(reading.timestamp);
      setSimHistory((prev) => {
        const next = [...prev, reading];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
    });

    socket.on("standards:update", (assessment: ReadingAssessmentResult) => {
      if (isPausedRef.current) return;
      setSimAssessment(assessment);
    });

    // 2. Real Hardware ESP32 Stream Socket Events
    socket.on("telemetry:esp32", (reading: SensorReading) => {
      if (isPausedRef.current) return;
      setLatestHardwareReading(reading);
      setLastUpdated(reading.timestamp);
      setHardwareHistory((prev) => {
        const next = [...prev, reading];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
    });

    socket.on("standards:esp32", (assessment: ReadingAssessmentResult) => {
      if (isPausedRef.current) return;
      setHardwareAssessment(assessment);
    });

    // 3. AI & Alerts Events
    socket.on("ai:update", (aiRes: AIPredictionResult) => {
      if (isPausedRef.current) return;
      setAiPrediction(aiRes);
    });

    socket.on("alert:new", (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
    });

    socket.on("simulation:status", (status: any) => {
      setSimulationRunning(status.isRunning);
      setActiveDisturbance(status.activeDisturbance);
      setDisturbanceSeconds(status.disturbanceRemainingSec);
    });

    return () => {
      clearInterval(pingTimer);
      socketService.disconnect();
    };
  }, [loadInitialData]);

  // Actions
  const toggleSimulation = async () => {
    try {
      if (simulationRunning) {
        await stopSimulationApi();
        setSimulationRunning(false);
      } else {
        await startSimulationApi();
        setSimulationRunning(true);
      }
    } catch (e) {
      console.error("Simulation toggle error", e);
    }
  };

  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  const injectDisturbance = async (type: string, durationSec = 20) => {
    try {
      await injectDisturbanceApi(type, durationSec);
      setActiveDisturbance(type);
      setDisturbanceSeconds(durationSec);
    } catch (e) {
      console.error("Inject disturbance error", e);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlertApi(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : a
        )
      );
    } catch (e) {
      console.error("Acknowledge alert error", e);
    }
  };

  const runIntegrationTest = async () => {
    try {
      const res = await runAIIntegrationTestApi();
      setAiPrediction(res);
      return res;
    } catch (e) {
      console.error("Run integration test error", e);
      throw e;
    }
  };

  const updateLimitsConfig = async (newLimits: any[], customNotice?: string) => {
    const res = await updateStandardsConfigApi(newLimits, customNotice);
    setStandardsConfig(res.config);
    return res;
  };

  return {
    // Streams
    simHistory,
    latestSimReading,
    simAssessment,
    hardwareHistory,
    latestHardwareReading,
    hardwareAssessment,

    // AI & Alerts
    aiPrediction,
    alerts,
    modelCard,
    standardsConfig,

    // System States
    backendConnected,
    aiServiceOnline,
    simulationRunning,
    isPaused,
    activeDisturbance,
    disturbanceSeconds,
    lastUpdated,

    // Actions
    toggleSimulation,
    togglePause,
    injectDisturbance,
    acknowledgeAlert,
    runIntegrationTest,
    updateLimitsConfig,
  };
}
