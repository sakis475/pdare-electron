import { io, Socket } from "socket.io-client";
import { ConnectionBridge } from "../../main/bridges/ConnectionBridge";
import { BASE_DOMAIN } from "../../../env";

const bridge = new ConnectionBridge();

class SocketService {
  private socket: Socket | null = null;
  private debugMode = true;

  constructor() {
    this.debugLog("Initializing SocketService");
    this.initializeSocket();
  }

  private debugLog(...args: any[]) {
    if (this.debugMode) {
      console.log("[SocketService Debug]", ...args);
    }
  }

  private initializeSocket() {
    try {
      const connectionData = bridge.getStoredConnection();
      this.debugLog("Connection data:", connectionData);

      if (!connectionData?.data?.connectionCode) {
        this.debugLog("No connection code available");
        return;
      }

      const serverUrl = BASE_DOMAIN;
      this.debugLog("Normalized server URL:", serverUrl);

      this.socket = io(serverUrl, {
        auth: {
          token: connectionData.data.token,
        },
      });

      this.setupListeners();
    } catch (error) {
      this.debugLog("Socket initialization error:", error);
      console.error("Socket initialization error:", error);
    }
  }

  private setupListeners() {
    if (!this.socket) {
      this.debugLog("Cannot setup listeners - socket is null");
      return;
    }

    this.socket.on("connect", () => {
      this.debugLog("Socket connected successfully");
      console.log("Connected to socket server");
    });

    this.socket.on("connect_error", (error) => {
      this.debugLog("Connection error:", error);
      this.debugLog("Current socket state:", {
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected,
        id: this.socket?.id,
      });
      console.error("Socket connection error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      this.debugLog("Socket disconnected. Reason:", reason);
      console.log("Disconnected from socket server");
    });

    this.socket.on("error", (error) => {
      this.debugLog("Socket error:", error);
    });
  }

  public getConnectionStatus(): boolean {
    return this.socket?.connected || false;
  }

  public sendHello() {
    this.debugLog("Attempting to send hello message");
    this.debugLog("Current connection status:", this.getConnectionStatus());

    if (!this.socket?.connected) {
      this.debugLog("Cannot send message - socket not connected");
      console.log("Socket not connected, cannot send message");
      return;
    }

    this.debugLog("Sending hello message");
    this.socket.emit("client:hello", "Hello World from Client!");
  }

  public disconnect() {
    this.debugLog("Disconnecting socket");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public reconnect() {
    this.debugLog("Attempting to reconnect");
    this.disconnect();
    this.initializeSocket();
  }
}

export const socketService = new SocketService();
