import { io, Socket } from "socket.io-client";
import { ConnectionBridge } from "../../main/bridges/ConnectionBridge";
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
  private pendingRoomJoins: Set<string> = new Set();

  constructor() {
    // this.debugLog("Initializing SocketService");
    // this.initializeSocket();
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
      const connectionData = bridge.getStoredConnection();

      if (!connectionData?.data?.connectionCode) {
        this.debugLog("No connection code available");
        return;
      }

      this.debugLog("Initializing socket connection...");
      this.debugLog("Connection data:", connectionData.data);

      this.socket = io(BASE_DOMAIN, {
        forceNew: true,
        // transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        auth: {
          token: connectionData.data.token,
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

      // Join any pending rooms
      this.pendingRoomJoins.forEach((roomId) => {
        this.debugLog("Joining pending room:", roomId);
        this.joinRestaurantRoom(roomId);
      });
      this.pendingRoomJoins.clear();
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
      this.pendingRoomJoins.add(restaurantId);
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
      this.pendingRoomJoins.clear();
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
