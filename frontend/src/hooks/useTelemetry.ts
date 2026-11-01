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
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
      setAlerts(alertList || []);
      setModelCard(card);
      setStandardsConfig(stdCfg);
    } catch {
      setBackendConnected(false);
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
