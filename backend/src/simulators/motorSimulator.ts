import { Server as SocketIOServer } from "socket.io";
import { config } from "../config/index";
import { alertRepository } from "../models/Alert";
import { readingRepository } from "../models/Reading";
import { aiClientService } from "../services/aiClientService";
import { standardsService } from "../services/standardsService";
import { Alert, SensorReading } from "../types/index";
import { logger } from "../utils/logger";

export type DisturbanceType =
  | "NONE"
  | "CURRENT_SURGE"
  | "OVERHEATING"
  | "HIGH_VIBRATION"
  | "VOLTAGE_SAG";

export class MotorSimulator {
  private timer: NodeJS.Timeout | null = null;
  private io: SocketIOServer | null = null;
  private isRunning: boolean = false;
  private motorId: string = "MOTOR-001";
  private intervalMs: number = config.simulation.defaultIntervalMs;

  // Physical State Variables
  private timeStep: number = 0;
  private baseTemp: number = 25.5;
  private currentTemp: number = 25.5;
  private activeDisturbance: DisturbanceType = "NONE";
  private disturbanceDurationSec: number = 0;

  // Alert Cooldown Tracking
  private lastAlertTimes: Record<string, number> = {};
  private readonly alertCooldownMs = 15000; // 15s cooldown per parameter/type

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info({ intervalMs: this.intervalMs }, "Motor simulator started");

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);

    if (this.io) {
      this.io.emit("simulation:status", this.getStatus());
    }
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info("Motor simulator stopped");
    if (this.io) {
      this.io.emit("simulation:status", this.getStatus());
    }
  }

  injectDisturbance(type: DisturbanceType, durationSec: number = 20) {
    this.activeDisturbance = type;
    this.disturbanceDurationSec = durationSec;
    logger.warn({ type, durationSec }, "Synthetic disturbance injected into simulation");

    // Immediately create a simulation event alert
    const simAlert: Alert = {
      id: `alert_sim_${Date.now()}`,
      timestamp: new Date().toISOString(),
      motorId: this.motorId,
      category: "simulation",
      severity: "info",
      parameter: type,
      explanation: `User triggered synthetic disturbance: ${type} (duration: ${durationSec}s). Clearly labelled simulation event.`,
      source: "simulation",
      acknowledged: false,
    };
    alertRepository.save(simAlert);
    if (this.io) {
      this.io.emit("alert:new", simAlert);
      this.io.emit("simulation:status", this.getStatus());
    }
  }

  clearDisturbance() {
    this.activeDisturbance = "NONE";
    this.disturbanceDurationSec = 0;
    if (this.io) {
      this.io.emit("simulation:status", this.getStatus());
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      motorId: this.motorId,
      intervalMs: this.intervalMs,
      activeDisturbance: this.activeDisturbance,
      disturbanceRemainingSec: this.disturbanceDurationSec,
    };
  }

  private async tick() {
    this.timeStep += 1;

    // Handle disturbance countdown
    if (this.disturbanceDurationSec > 0) {
      this.disturbanceDurationSec -= 1;
      if (this.disturbanceDurationSec <= 0) {
        this.activeDisturbance = "NONE";
      }
    }

    // 1. Generate Realistic Physics Readings
    const t = this.timeStep;
    const rand = () => (Math.random() - 0.5) * 2; // -1 to 1

    // Voltage: nominal 230 V +/- 1.5 V jitter
    let voltageVal = 230.0 + Math.sin(t * 0.05) * 1.2 + rand() * 0.6;

    // Current: nominal 3.2 A +/- 0.15 A normal load variation
    let currentVal = 3.2 + Math.sin(t * 0.03) * 0.1 + rand() * 0.05;

    // Vibration: nominal 0.12 g_rms +/- 0.02
    let vibrationVal = 0.12 + Math.abs(Math.sin(t * 0.1)) * 0.02 + rand() * 0.015;

    // Temperature: continuous organic thermal oscillation around room temperature (~25.5°C)
    let tempVal = 25.5 + Math.sin(t * 0.12) * 0.45 + Math.cos(t * 0.07) * 0.25 + rand() * 0.1;

    // Apply Active Disturbance Effects
    switch (this.activeDisturbance) {
      case "CURRENT_SURGE":
        currentVal = 5.25 + rand() * 0.1; // Exceeds 5.0 A upper limit
        break;
      case "OVERHEATING":
        this.currentTemp = Math.min(93.0, this.currentTemp + 1.2);
        tempVal = this.currentTemp + rand() * 0.3; // Exceeds 90.0 °C upper limit
        break;
      case "HIGH_VIBRATION":
        vibrationVal = 0.52 + rand() * 0.06; // Exceeds 0.50 g_rms limit
        break;
      case "VOLTAGE_SAG":
        voltageVal = 198.0 + rand() * 1.5; // Below 207 V lower limit
        break;
      default:
        // Cooling recovery if overheating ended
        if (this.currentTemp > 47.0) {
          this.currentTemp -= 0.5;
        }
        break;
    }

    const reading: SensorReading = {
      motorId: this.motorId,
      timestamp: new Date().toISOString(),
      source: "simulation",
      quality: "valid",
      current: { value: parseFloat(currentVal.toFixed(3)), unit: "A" },
      voltage: { value: parseFloat(voltageVal.toFixed(2)), unit: "V" },
      temperature: { value: parseFloat(tempVal.toFixed(2)), unit: "degC" },
      vibration: { value: parseFloat(vibrationVal.toFixed(4)), unit: "g_rms", axis: "X" },
      syntheticDisturbance: this.activeDisturbance !== "NONE" ? this.activeDisturbance : undefined,
    };

    // 2. Persist Reading
    const savedReading = await readingRepository.save(reading);

    // 3. Evaluate Standards Limits
    const standardsResult = standardsService.evaluateReading(savedReading);

    // 4. Query AI Model Inference (Testing feature compatibility contract)
    const aiResult = await aiClientService.predict(savedReading);

    // 5. Generate Deduplicated Alerts on Out-Of-Limit / Warning conditions
    const now = Date.now();
    for (const ev of standardsResult.evaluations) {
      if (ev.status === "OUT_OF_LIMIT" || ev.status === "WARNING") {
        const alertKey = `std_${ev.parameter}_${ev.status}`;
        const lastTime = this.lastAlertTimes[alertKey] || 0;

        if (now - lastTime > this.alertCooldownMs) {
          this.lastAlertTimes[alertKey] = now;
          const alert: Alert = {
            id: `alert_std_${now}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: savedReading.timestamp,
            motorId: this.motorId,
            category: "standards",
            severity: ev.status === "OUT_OF_LIMIT" ? "critical" : "warning",
            parameter: ev.parameter,
            observedValue: ev.value,
            unit: ev.unit,
            limitOrRule: ev.limitConfig?.sourceTitle || "Configured Threshold",
            explanation: ev.explanation,
            source: "simulation",
            acknowledged: false,
          };
          await alertRepository.save(alert);
          if (this.io) {
            this.io.emit("alert:new", alert);
          }
        }
      }
    }

    // 6. Broadcast Real-Time Data via Socket.IO
    if (this.io) {
      this.io.emit("telemetry:new", savedReading);
      this.io.emit("standards:update", standardsResult);
      this.io.emit("ai:update", aiResult);
    }
  }
}

export const motorSimulator = new MotorSimulator();
