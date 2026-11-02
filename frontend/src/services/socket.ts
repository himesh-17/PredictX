import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      const backendBase = import.meta.env.VITE_BACKEND_URL || "";
      this.socket = io(backendBase || undefined, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });
    }
    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
