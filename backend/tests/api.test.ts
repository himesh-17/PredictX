import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("MotorGuard Backend API", () => {
  it("GET /api/v1/health should return system status", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBeDefined();
    expect(res.body.simulation).toBeDefined();
  });

  it("GET /api/v1/motors should return configured motor", async () => {
    const res = await request(app).get("/api/v1/motors");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].motorId).toBe("MOTOR-001");
  });

  it("GET /api/v1/standards/config should return limits configuration", async () => {
    const res = await request(app).get("/api/v1/standards/config");
    expect(res.status).toBe(200);
    expect(res.body.limits).toBeDefined();
  });

  it("POST /api/v1/readings should reject malformed payload", async () => {
    const res = await request(app).post("/api/v1/readings").send({
      motorId: "MOTOR-001",
      current: "invalid", // should be object
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid sensor payload");
  });

  it("POST /api/v1/readings should accept valid sensor reading", async () => {
    const res = await request(app).post("/api/v1/readings").send({
      motorId: "MOTOR-001",
      source: "hardware_esp32",
      quality: "valid",
      current: { value: 3.2, unit: "A" },
      voltage: { value: 230, unit: "V" },
      temperature: { value: 45.0, unit: "degC" },
      vibration: { value: 0.12, unit: "g_rms", axis: "X" },
    });
    expect(res.status).toBe(201);
    expect(res.body.motorId).toBe("MOTOR-001");
    expect(res.body.current.value).toBe(3.2);
  });

  it("POST /api/v1/simulation/disturbance should accept valid disturbance", async () => {
    const res = await request(app).post("/api/v1/simulation/disturbance").send({
      type: "OVERHEATING",
      durationSec: 15,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status.activeDisturbance).toBe("OVERHEATING");
  });
});
