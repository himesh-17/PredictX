import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  // Supports Local MongoDB or MongoDB Atlas (e.g. mongodb+srv://<user>:<password>@cluster.mongodb.net/predict_x)
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/predict_x",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1",
  simulation: {
    defaultIntervalMs: parseInt(process.env.SIMULATION_INTERVAL_MS || "1000", 10),
    autoStart: process.env.SIMULATION_AUTO_START !== "false",
  },
  corsOrigin: process.env.CORS_ORIGIN || "*",
  admin: {
    id: process.env.ADMIN_ID || "admin",
    password: process.env.ADMIN_PASSWORD || "predictx2026",
  },
  mongoOptions: {
    serverSelectionTimeoutMS: 8000, // 8-second timeout for Atlas DNS & TLS resolution
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  },
};
