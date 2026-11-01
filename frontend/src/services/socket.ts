import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      // Connects to proxy /socket.io in Vite or direct host
      this.socket = io({
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
