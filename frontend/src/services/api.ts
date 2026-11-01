import axios from "axios";
import { Alert, SensorReading } from "../types";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 5000,
});

export const fetchHealth = async () => (await api.get("/health")).data;
export const fetchMotorInfo = async (motorId = "MOTOR-001") => (await api.get(`/motors/${motorId}`)).data;
export const fetchLatestReading = async (motorId = "MOTOR-001", source?: string) => 
  (await api.get(`/readings/latest?motorId=${motorId}${source ? `&source=${source}` : ""}`)).data;
export const fetchHistory = async (motorId = "MOTOR-001", limit = 60, source?: string) => 
  (await api.get(`/readings/history?motorId=${motorId}&limit=${limit}${source ? `&source=${source}` : ""}`)).data;
export const fetchStandardsConfig = async () => (await api.get("/standards/config")).data;
export const updateStandardsConfigApi = async (limits: any[], notice?: string) => 
  (await api.put("/standards/config", { limits, notice })).data;
export const fetchLatestAssessment = async (motorId = "MOTOR-001", source?: string) => 
  (await api.get(`/standards/assessment/latest?motorId=${motorId}${source ? `&source=${source}` : ""}`)).data;
export const fetchAlerts = async (motorId?: string) => (await api.get(`/alerts${motorId ? `?motorId=${motorId}` : ""}`)).data;
export const acknowledgeAlertApi = async (id: string) => (await api.patch(`/alerts/${id}/acknowledge`)).data;
export const startSimulationApi = async () => (await api.post("/simulation/start")).data;
export const stopSimulationApi = async () => (await api.post("/simulation/stop")).data;
export const injectDisturbanceApi = async (type: string, durationSec = 20) => (await api.post("/simulation/disturbance", { type, durationSec })).data;
export const fetchAIStatus = async () => (await api.get("/ai/status")).data;
export const fetchAIModelCard = async () => (await api.get("/ai/model-card")).data;
export const runAIIntegrationTestApi = async () => (await api.post("/ai/test-fixture")).data;

export default api;
