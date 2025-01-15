import { io, Socket } from "socket.io-client";
import {
  ConnectionBridge,
  StoredConnectionData,
} from "../../main/bridges/ConnectionBridge";
import { BASE_DOMAIN } from "../../../env";

const bridge = new ConnectionBridge();

interface PrintOrderData {
  timestamp: number;
  restaurantId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private debugMode = true;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private connectionData: StoredConnectionData | undefined;
  constructor() {
    this.initializeSocket();
  }

  private debugLog(...args: any[]) {
    if (this.debugMode) {
      console.log("[SocketService Debug]", ...args);
    }
  }

  private async initializeSocket() {
    if (this.isConnecting) {
      this.debugLog("Already connecting, skipping...");
      return;
    }

    try {
      this.isConnecting = true;
      this.connectionData = bridge.getStoredConnection();

      if (!this.connectionData?.data?.connectionCode) {
        this.debugLog("No connection code available");
        return;
      }

      this.debugLog("Initializing socket connection...");
      this.debugLog("Connection data:", this.connectionData.data);

      this.socket = io(BASE_DOMAIN, {
        forceNew: true,
        // transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        auth: {
          token: this.connectionData.data.token,
        },
      });

      this.setupListeners();
    } catch (error) {
      console.error("Socket initialization error:", error);
    } finally {
      this.isConnecting = false;
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.debugLog("Socket connected successfully");
      this.joinRestaurantRoom(this.connectionData?.data.user.restaurant.id);
    });

    this.socket.on("connect_error", (error) => {
      this.debugLog("Connection error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      this.debugLog("Socket disconnected:", reason);
    });

    // Add room join confirmation listener
    this.socket.on("roomJoined", (data: { room: string }) => {
      this.debugLog("Successfully joined room:", data.room);
    });

    this.socket.on("roomLeft", (data: { room: string }) => {
      this.debugLog("Successfully left room:", data.room);
    });
  }

  public joinRestaurantRoom(restaurantId: string) {
    this.debugLog("Attempting to join room:", restaurantId);

    if (!this.socket?.connected) {
      this.debugLog("Socket not connected, queueing room join");
      return;
    }

    this.debugLog("Joining room:", restaurantId);
    this.socket.emit("joinRestaurant", restaurantId, (response: any) => {
      this.debugLog("Join room response:", response);
    });
  }

  public leaveRestaurantRoom(restaurantId: string) {
    if (!this.socket?.connected) {
      this.debugLog("Socket not connected, cannot leave room");
      return;
    }
    this.socket.emit("leaveRestaurant", restaurantId, (response: any) => {
      this.debugLog("Leave room response:", response);
    });
  }

  public onPrintOrder(
    restaurantId: string,
    callback: (data: PrintOrderData) => void
  ) {
    if (!this.socket) return;

    const printOrderEvent = `printOrder:${restaurantId}`;
    this.debugLog("Setting up print order listener for:", printOrderEvent);
    this.socket.on(printOrderEvent, (data: PrintOrderData) => {
      this.debugLog("Received print order:", data);
      callback(data);
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
      return;
    }

    this.debugLog("Sending hello message");
    this.socket.emit(
      "client:hello",
      "Hello World from Client!",
      (response: any) => {
        this.debugLog("Hello message response:", response);
      }
    );
  }

  public disconnect() {
    this.debugLog("Disconnecting socket");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public reconnect() {
    if (this.socket?.connected) {
      this.debugLog("Already connected, skipping reconnect");
      return;
    }
    this.debugLog("Reconnecting socket");
    this.disconnect();
    setTimeout(() => {
      this.initializeSocket();
    }, 500);
  }
}

export const socketService = new SocketService();
