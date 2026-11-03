import axios from "axios";
import { config } from "../config/index";
import { AIPredictionResult, SensorReading } from "../types/index";
import { logger } from "../utils/logger";

export class AIClientService {
  private baseUrl = config.aiServiceUrl;
  private lastWarnTime = 0;

  constructor() {
    // Keep-alive ping every 9 minutes to keep Render Free tier container awake
    if (this.baseUrl.startsWith("https://")) {
      setInterval(() => {
        axios.get(`${this.baseUrl}/health`, { timeout: 15000 }).catch(() => {});
      }, 9 * 60 * 1000);
    }
  }

  async getHealth(): Promise<{ isOnline: boolean; details?: any }> {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 8000 });
      return { isOnline: res.status === 200, details: res.data };
    } catch (err: any) {
      return { isOnline: false, details: { error: err.message } };
    }
  }

  async getModelCard(): Promise<any> {
    try {
      const res = await axios.get(`${this.baseUrl}/model-card`, { timeout: 8000 });
      return res.data;
    } catch (err: any) {
      return {
        modelName: "Isolation Forest Anomaly Detector",
        version: "1.0.0",
        serviceStatus: "UNAVAILABLE",
        error: err.message,
      };
    }
  }

  async predict(reading: SensorReading): Promise<AIPredictionResult> {
    try {
      const res = await axios.post(`${this.baseUrl}/predict`, reading, { timeout: 8000 });
      return res.data as AIPredictionResult;
    } catch (err: any) {
      const now = Date.now();
      if (now - this.lastWarnTime > 30000) {
        logger.warn({ err: err.message, target: this.baseUrl }, "AI inference service is offline or unreachable. Telemetry running with fallback.");
        this.lastWarnTime = now;
      }
      return {
        status: "MODEL_UNAVAILABLE",
        prediction: null,
        anomalyScore: null,
        threshold: null,
        expectedFeatures: [
          "Accelerometer1RMS",
          "Accelerometer2RMS",
          "Current",
          "Temperature",
          "Thermocouple",
          "Voltage",
        ],
        missingFeatures: [],
        explanation: `AI service unreachable at ${this.baseUrl}: ${err.message}. Model predictions suspended.`,
        isIntegrationTest: false,
        isSimulated: reading.source === "simulation",
      };
    }
  }

  async runIntegrationTest(): Promise<AIPredictionResult> {
    try {
      const res = await axios.post(`${this.baseUrl}/test-fixture`, {}, { timeout: 3000 });
      return res.data as AIPredictionResult;
    } catch (err: any) {
      return {
        status: "MODEL_UNAVAILABLE",
        prediction: null,
        anomalyScore: null,
        threshold: null,
        expectedFeatures: [
          "Accelerometer1RMS",
          "Accelerometer2RMS",
          "Current",
          "Temperature",
          "Thermocouple",
          "Voltage",
        ],
        missingFeatures: [],
        explanation: `AI service unavailable to run test fixture: ${err.message}`,
        isIntegrationTest: true,
        isSimulated: false,
      };
    }
  }
}

export const aiClientService = new AIClientService();
