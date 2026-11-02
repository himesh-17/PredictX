import { io, Socket } from "socket.io-client";

// In production, fallback directly to the deployed Render backend if VITE_BACKEND_URL is not set
const BACKEND_PROD_URL = "https://predictx-backend-16j8.onrender.com";
const backendBase =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD ? BACKEND_PROD_URL : "");

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(backendBase || undefined, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
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
