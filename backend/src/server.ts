import http from "http";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app";
import { config } from "./config/index";
import { motorSimulator } from "./simulators/motorSimulator";
import { initializeSockets } from "./sockets/socketHandler";
import { logger } from "./utils/logger";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
});

app.set("io", io);
initializeSockets(io);

async function startServer() {
  // Sanitize URI for safe logging (masks Atlas passwords)
  const sanitizedUri = config.mongoUri.replace(/:([^:@]+)@/, ":****@");

  // MongoDB Connection Lifecycle Handlers (Supports MongoDB Atlas & Local)
  mongoose.connection.on("connected", () => {
    logger.info(`MongoDB connection established [${sanitizedUri}]`);
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err: err.message }, "MongoDB connection error occurred");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Telemetry and alerts will buffer in memory.");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB connection re-established. Synchronizing data persistence.");
  });

  // Attempt initial MongoDB connection
  try {
    logger.info(`Attempting connection to MongoDB [${sanitizedUri}]...`);
    await mongoose.connect(config.mongoUri, config.mongoOptions);
  } catch (err: any) {
    logger.warn(
      { err: err.message },
      "MongoDB unavailable initially. Running with in-memory persistence fallback (Zero-crash dev mode)"
    );
  }

  // Auto-start simulation if configured
  if (config.simulation.autoStart) {
    motorSimulator.start();
  }

  server.listen(config.port, () => {
    logger.info(`Predict X Backend Server running on http://localhost:${config.port}`);
    logger.info(`WebSocket Socket.IO server active on ws://localhost:${config.port}`);
  });
}

function handleShutdown() {
  logger.info("Shutting down backend server gracefully...");
  motorSimulator.stop();
  server.close(() => {
    mongoose.connection.close(false);
    logger.info("Server closed successfully");
    process.exit(0);
  });
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

startServer().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
