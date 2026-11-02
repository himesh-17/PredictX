import mongoose, { Schema, Document } from "mongoose";
import { Alert } from "../types/index";

export interface IAlertDocument extends Document, Omit<Alert, "id"> {}

const AlertSchema = new Schema<IAlertDocument>(
  {
    motorId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["standards", "ai_anomaly", "sensor_error", "system", "simulation"],
    },
    severity: { type: String, required: true, enum: ["info", "warning", "critical"] },
    parameter: { type: String, required: true },
    observedValue: { type: Number },
    unit: { type: String },
    limitOrRule: { type: String },
    explanation: { type: String, required: true },
    source: { type: String, required: true, enum: ["simulation", "hardware_esp32"] },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: String },
  },
  { timestamps: true }
);

export const MongoAlertModel = mongoose.model<IAlertDocument>("Alert", AlertSchema);

class AlertRepository {
  private inMemoryAlerts: Alert[] = [];
  private readonly maxInMemory = 200;

  constructor() {
    this.inMemoryAlerts = this.generateSeedAlerts();
  }

  generateSeedAlerts(): Alert[] {
    const now = Date.now();
    return [
      {
        id: "alert-seed-001",
        timestamp: new Date(now - 6 * 60 * 1000).toISOString(),
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
        timestamp: new Date(now - 14 * 60 * 1000).toISOString(),
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
        timestamp: new Date(now - 28 * 60 * 1000).toISOString(),
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
        acknowledgedAt: new Date(now - 22 * 60 * 1000).toISOString(),
      },
      {
        id: "alert-seed-004",
        timestamp: new Date(now - 42 * 60 * 1000).toISOString(),
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
        timestamp: new Date(now - 55 * 60 * 1000).toISOString(),
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
        acknowledgedAt: new Date(now - 50 * 60 * 1000).toISOString(),
      },
      {
        id: "alert-seed-006",
        timestamp: new Date(now - 70 * 60 * 1000).toISOString(),
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
        acknowledgedAt: new Date(now - 68 * 60 * 1000).toISOString(),
      },
    ];
  }

  async save(alert: Alert): Promise<Alert> {
    this.inMemoryAlerts.unshift(alert);
    if (this.inMemoryAlerts.length > this.maxInMemory) {
      this.inMemoryAlerts.pop();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await MongoAlertModel.create(alert);
      } catch (err) {
        // preserve in-memory
      }
    }
    return alert;
  }

  async getAll(motorId?: string, limit: number = 50): Promise<Alert[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const count = await MongoAlertModel.countDocuments();
        if (count === 0) {
          const seeds = this.generateSeedAlerts();
          await MongoAlertModel.insertMany(seeds);
        }
        const query = motorId ? { motorId } : {};
        const docs = await MongoAlertModel.find(query).sort({ timestamp: -1 }).limit(limit).lean();
        if (docs && docs.length > 0) {
          return docs.map((d) => ({
            id: (d as any)._id?.toString() || (d as any).id,
            motorId: d.motorId,
            timestamp: d.timestamp,
            category: d.category,
            severity: d.severity,
            parameter: d.parameter,
            observedValue: d.observedValue,
            unit: d.unit,
            limitOrRule: d.limitOrRule,
            explanation: d.explanation,
            source: d.source,
            acknowledged: d.acknowledged,
            acknowledgedAt: d.acknowledgedAt,
          }));
        }
      } catch (err) {
        // fallback
      }
    }
    if (this.inMemoryAlerts.length === 0) {
      this.inMemoryAlerts = this.generateSeedAlerts();
    }
    const filtered = motorId ? this.inMemoryAlerts.filter((a) => a.motorId === motorId) : this.inMemoryAlerts;
    return filtered.slice(0, limit);
  }

  async acknowledge(alertId: string): Promise<Alert | null> {
    const nowIso = new Date().toISOString();
    const memAlert = this.inMemoryAlerts.find((a) => a.id === alertId);
    if (memAlert) {
      memAlert.acknowledged = true;
      memAlert.acknowledgedAt = nowIso;
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await MongoAlertModel.findByIdAndUpdate(
          alertId,
          { acknowledged: true, acknowledgedAt: nowIso },
          { new: true }
        ).lean();
        if (doc) {
          return {
            id: (doc as any)._id?.toString() || alertId,
            motorId: doc.motorId,
            timestamp: doc.timestamp,
            category: doc.category,
            severity: doc.severity,
            parameter: doc.parameter,
            observedValue: doc.observedValue,
            unit: doc.unit,
            limitOrRule: doc.limitOrRule,
            explanation: doc.explanation,
            source: doc.source,
            acknowledged: doc.acknowledged,
            acknowledgedAt: doc.acknowledgedAt,
          };
        }
      } catch (err) {
        // fallback
      }
    }
    return memAlert || null;
  }
}

export const alertRepository = new AlertRepository();
