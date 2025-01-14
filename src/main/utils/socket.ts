import { io, Socket } from "socket.io-client";
import { ConnectionBridge } from "../../main/bridges/ConnectionBridge";
import { BASE_DOMAIN } from "../../../env";

const bridge = new ConnectionBridge();

class SocketService {
  private socket: Socket | null = null;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      const connectionData = bridge.getStoredConnection();
      if (!connectionData?.data?.token) {
        console.log("No token available, cannot connect to socket");
        return;
      }

      this.socket = io(BASE_DOMAIN, {
        auth: {
          token: connectionData.data.token,
        },
      });

      this.setupListeners();
    } catch (error) {
      console.error("Socket initialization error:", error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    this.socket.on("server:hello", (message: string) => {
      console.log("Received from server:", message);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  public sendHello() {
    if (!this.socket?.connected) {
      console.log("Socket not connected, cannot send message");
      return;
    }

    console.log("Sending hello to server...");
    this.socket.emit("client:hello", "Hello World from Client!");
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public reconnect() {
    this.disconnect();
    this.initializeSocket();
  }
}

export const socketService = new SocketService();
