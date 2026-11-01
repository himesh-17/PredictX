import { Server as SocketIOServer, Socket } from "socket.io";
import { motorSimulator } from "../simulators/motorSimulator";
import { logger } from "../utils/logger";

export function initializeSockets(io: SocketIOServer) {
  motorSimulator.setSocketIO(io);

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Client connected to real-time telemetry socket");

    // Immediately emit current simulation status upon connection
    socket.emit("simulation:status", motorSimulator.getStatus());

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected from socket");
    });
  });
}
