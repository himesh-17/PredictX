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
