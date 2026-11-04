import mongoose, { Schema, Document } from "mongoose";
import { SensorReading } from "../types/index";

export interface IReadingDocument extends Document, Omit<SensorReading, "id"> {}

const ReadingSchema = new Schema<IReadingDocument>(
  {
    motorId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    source: { type: String, required: true, enum: ["simulation", "hardware_esp32"] },
    quality: { type: String, required: true, enum: ["valid", "degraded", "invalid", "partial"] },
    current: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    voltage: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    temperature: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    vibration: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
      axis: { type: String, default: "X" },
    },
    syntheticDisturbance: { type: String },
  },
  { timestamps: true }
);

export const MongoReadingModel = mongoose.model<IReadingDocument>("Reading", ReadingSchema);

// In-Memory Fallback Repository
class ReadingRepository {
  private inMemoryReadings: SensorReading[] = [];
  private readonly maxInMemory = 500;

  async save(reading: SensorReading): Promise<SensorReading> {
    const withId = { ...reading, id: reading.id || `read_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` };
    this.inMemoryReadings.push(withId);
    if (this.inMemoryReadings.length > this.maxInMemory) {
      this.inMemoryReadings.shift();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await MongoReadingModel.create(reading);
      } catch (err) {
        // Silently preserve in-memory
      }
    }
    return withId;
  }

  async getLatest(motorId: string, source?: string): Promise<SensorReading | null> {
    if (mongoose.connection.readyState === 1) {
      try {
        const query: any = { motorId };
        if (source) query.source = source;
        const doc = await MongoReadingModel.findOne(query).sort({ timestamp: -1 }).lean();
        if (doc) return doc as unknown as SensorReading;
      } catch (err) {
        // fallback
      }
    }
    const matching = this.inMemoryReadings.filter((r) => r.motorId === motorId && (!source || r.source === source));
    return matching.length > 0 ? matching[matching.length - 1] : null;
  }

  async getHistory(motorId: string, limit: number = 60, source?: string): Promise<SensorReading[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const query: any = { motorId };
        if (source) query.source = source;
        const docs = await MongoReadingModel.find(query).sort({ timestamp: -1 }).limit(limit).lean();
        if (docs && docs.length > 0) return (docs as unknown as SensorReading[]).reverse();
      } catch (err) {
        // fallback
      }
    }
    const matching = this.inMemoryReadings.filter((r) => r.motorId === motorId && (!source || r.source === source));
    return matching.slice(-limit);
  }
}

export const readingRepository = new ReadingRepository();
