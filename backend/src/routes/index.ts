import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { config } from "../config/index";
import { alertRepository } from "../models/Alert";
import { readingRepository } from "../models/Reading";
import { aiClientService } from "../services/aiClientService";
import { standardsService } from "../services/standardsService";
import { motorSimulator } from "../simulators/motorSimulator";
import { MotorInfo, SensorReading } from "../types/index";

export const apiRouter = Router();

// Default Motor Info
const DEFAULT_MOTOR: MotorInfo = {
  motorId: "MOTOR-001",
  name: "Lab AC Induction Motor #1",
  model: "3-Phase Squirrel Cage Induction Motor",
  type: "IEC Frame 80M, TEFC",
  ratedPowerKw: 0.75,
  ratedVoltageV: 400.0,
  ratedCurrentA: 3.2,
  ratedSpeedRpm: 1420,
  poles: 4,
  insulationClass: "Class F",
  mounting: "Horizontal Foot Mounted (B3)",
  sensorsInstalled: ["Current CT (Phase A)", "Voltage Divider/ZMPT", "DS18B20 Temp", "MPU6050 Accelerometer"],
};

// 1. HEALTH ENDPOINT
apiRouter.get("/health", async (req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  const isAtlas = config.mongoUri.includes("mongodb+srv") || config.mongoUri.includes(".mongodb.net");
  const dbStatus = isConnected ? "connected" : "in_memory_fallback";
  const aiHealth = await aiClientService.getHealth();
  const simStatus = motorSimulator.getStatus();

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.2.0-IoT",
    database: {
      status: dbStatus,
      engine: isConnected ? (isAtlas ? "MongoDB Atlas (Cloud)" : "MongoDB (Local)") : "InMemoryRepository",
      cloudAtlas: isAtlas,
      databaseName: mongoose.connection.name || "predict_x",
    },
    aiService: {
      status: aiHealth.isOnline ? "online" : "offline",
      details: aiHealth.details,
    },
    simulation: simStatus,
  });
});

// 2. MOTOR CONFIGURATION
apiRouter.get("/motors", (req: Request, res: Response) => {
  res.json([DEFAULT_MOTOR]);
});

apiRouter.get("/motors/:motorId", (req: Request, res: Response) => {
  if (req.params.motorId === DEFAULT_MOTOR.motorId) {
    res.json(DEFAULT_MOTOR);
  } else {
    res.status(404).json({ error: "Motor not found" });
  }
});

// 3. READINGS
const IngestionSchema = z.object({
  motorId: z.string().default("MOTOR-001"),
  source: z.enum(["simulation", "hardware_esp32"]).default("hardware_esp32"),
  quality: z.enum(["valid", "degraded", "invalid"]).default("valid"),
  current: z.object({ value: z.number(), unit: z.string().default("A") }),
  voltage: z.object({ value: z.number(), unit: z.string().default("V") }),
  temperature: z.object({ value: z.number(), unit: z.string().default("degC") }),
  vibration: z.object({ value: z.number(), unit: z.string().default("g_rms"), axis: z.string().default("X") }),
});

apiRouter.post("/readings", async (req: Request, res: Response) => {
  try {
    const parsed = IngestionSchema.parse(req.body);
    const reading: SensorReading = {
      ...parsed,
      timestamp: new Date().toISOString(),
    };
    const saved = await readingRepository.save(reading);

    // If real hardware reading arrived, evaluate standards & emit to frontend immediately
    const standardsResult = standardsService.evaluateReading(saved);
    const io = (req.app.get("io") || motorSimulator["io"]);
    if (io) {
      if (saved.source === "hardware_esp32") {
        io.emit("telemetry:esp32", saved);
        io.emit("standards:esp32", standardsResult);
      } else {
        io.emit("telemetry:new", saved);
        io.emit("standards:update", standardsResult);
      }
    }

    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: "Invalid sensor payload", details: err.errors || err.message });
  }
});

apiRouter.get("/readings/latest", async (req: Request, res: Response) => {
  const motorId = (req.query.motorId as string) || "MOTOR-001";
  const source = req.query.source ? (req.query.source as string) : undefined;
  const latest = await readingRepository.getLatest(motorId, source);
  if (!latest) {
    return res.status(404).json({ error: "No readings available yet" });
  }
  res.json(latest);
});

apiRouter.get("/readings/history", async (req: Request, res: Response) => {
  const motorId = (req.query.motorId as string) || "MOTOR-001";
  const limit = Math.min(parseInt((req.query.limit as string) || "60", 10), 200);
  const source = req.query.source ? (req.query.source as string) : undefined;
  const history = await readingRepository.getHistory(motorId, limit, source);
  res.json(history);
});

// 4. STANDARDS ASSESSMENT & CONFIGURATION MANAGEMENT
apiRouter.get("/standards/config", (req: Request, res: Response) => {
  res.json(standardsService.getConfig());
});

apiRouter.put("/standards/config", (req: Request, res: Response) => {
  try {
    const { limits, notice } = req.body;
    if (!Array.isArray(limits)) {
      return res.status(400).json({ error: "Limits must be an array of limit rules" });
    }
    const result = standardsService.updateLimits(limits, notice);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/standards/assessment/latest", async (req: Request, res: Response) => {
  const motorId = (req.query.motorId as string) || "MOTOR-001";
  const source = req.query.source ? (req.query.source as string) : undefined;
  const latest = await readingRepository.getLatest(motorId, source);
  if (!latest) {
    return res.status(404).json({ error: "No readings available to assess" });
  }
  const assessment = standardsService.evaluateReading(latest);
  res.json(assessment);
});

// 5. ALERTS
apiRouter.get("/alerts", async (req: Request, res: Response) => {
  const motorId = (req.query.motorId as string) || undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);
  const alerts = await alertRepository.getAll(motorId, limit);
  res.json(alerts);
});

apiRouter.patch("/alerts/:id/acknowledge", async (req: Request, res: Response) => {
  const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const acked = await alertRepository.acknowledge(alertId);
  if (!acked) {
    return res.status(404).json({ error: "Alert not found" });
  }
  res.json(acked);
});

// 6. SIMULATION CONTROLS
apiRouter.get("/simulation/status", (req: Request, res: Response) => {
  res.json(motorSimulator.getStatus());
});

apiRouter.post("/simulation/start", (req: Request, res: Response) => {
  motorSimulator.start();
  res.json({ success: true, status: motorSimulator.getStatus() });
});

apiRouter.post("/simulation/stop", (req: Request, res: Response) => {
  motorSimulator.stop();
  res.json({ success: true, status: motorSimulator.getStatus() });
});

apiRouter.post("/simulation/disturbance", (req: Request, res: Response) => {
  const { type, durationSec } = req.body;
  if (!["NONE", "CURRENT_SURGE", "OVERHEATING", "HIGH_VIBRATION", "VOLTAGE_SAG"].includes(type)) {
    return res.status(400).json({ error: "Invalid disturbance type" });
  }
  motorSimulator.injectDisturbance(type, durationSec || 20);
  res.json({ success: true, status: motorSimulator.getStatus() });
});

// 7. AI SERVICE INTEGRATION
apiRouter.get("/ai/status", async (req: Request, res: Response) => {
  const health = await aiClientService.getHealth();
  res.json(health);
});

apiRouter.get("/ai/model-card", async (req: Request, res: Response) => {
  const card = await aiClientService.getModelCard();
  res.json(card);
});

apiRouter.post("/ai/predict", async (req: Request, res: Response) => {
  const result = await aiClientService.predict(req.body);
  res.json(result);
});

apiRouter.post("/ai/test-fixture", async (req: Request, res: Response) => {
  const result = await aiClientService.runIntegrationTest();
  res.json(result);
});
