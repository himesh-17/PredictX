import axios from "axios";
import { config } from "../config/index";
import { AIPredictionResult, SensorReading } from "../types/index";
import { logger } from "../utils/logger";

export class AIClientService {
  private baseUrl = config.aiServiceUrl;
  private lastWarnTime = 0;
  private lastHealthTime = 0;
  private cachedHealth: { isOnline: boolean; details?: any } | null = null;
  private lastPredictTime = 0;
  private cachedPrediction: AIPredictionResult | null = null;
  private cachedModelCard: any = null;

  constructor() {
    // Keep-alive ping every 9 minutes to keep Render Free tier container awake
    if (this.baseUrl.startsWith("https://")) {
      setInterval(() => {
        axios.get(`${this.baseUrl}/health`, { timeout: 15000 }).catch(() => {});
      }, 9 * 60 * 1000);
    }
  }

  async getHealth(): Promise<{ isOnline: boolean; details?: any }> {
    const now = Date.now();
    // Cache health status for 20 seconds to prevent rapid polling rate-limits (HTTP 429)
    if (this.cachedHealth && now - this.lastHealthTime < 20000) {
      return this.cachedHealth;
    }

    try {
      const res = await axios.get(`${this.baseUrl}/health`, { timeout: 8000 });
      this.cachedHealth = { isOnline: res.status === 200, details: res.data };
      this.lastHealthTime = now;
      return this.cachedHealth;
    } catch (err: any) {
      // HTTP 429 Too Many Requests indicates the AI microservice is alive and active behind the reverse proxy
      if (err.response?.status === 429) {
        this.cachedHealth = {
          isOnline: true,
          details: { status: "online", rateLimited: true, note: "AI Engine active (request throttled)" },
        };
        this.lastHealthTime = now;
        return this.cachedHealth;
      }
      return { isOnline: false, details: { error: err.message } };
    }
  }

  async getModelCard(): Promise<any> {
    if (this.cachedModelCard) return this.cachedModelCard;
    try {
      const res = await axios.get(`${this.baseUrl}/model-card`, { timeout: 8000 });
      this.cachedModelCard = res.data;
      return this.cachedModelCard;
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
    const now = Date.now();
    // Throttle automated predictions: during steady-state simulation, evaluate every 4 seconds to eliminate 429 rate limiting
    if (!reading.syntheticDisturbance && this.cachedPrediction && now - this.lastPredictTime < 4000) {
      return this.cachedPrediction;
    }

    try {
      const res = await axios.post(`${this.baseUrl}/predict`, reading, { timeout: 8000 });
      this.cachedPrediction = res.data as AIPredictionResult;
      this.lastPredictTime = now;
      return this.cachedPrediction;
    } catch (err: any) {
      // If rate limited by proxy, gracefully return the latest valid cached prediction
      if (err.response?.status === 429 && this.cachedPrediction) {
        return this.cachedPrediction;
      }

      const nowWarn = Date.now();
      if (nowWarn - this.lastWarnTime > 30000) {
        logger.warn({ err: err.message, target: this.baseUrl }, "AI inference service is offline or unreachable. Telemetry running with fallback.");
        this.lastWarnTime = nowWarn;
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
