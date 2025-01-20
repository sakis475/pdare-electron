import { io, Socket } from "socket.io-client";
import { BASE_DOMAIN, BASE_URL } from "../../../env";
import { getHealthCheck, postPrinterAppDiscovered } from "./requests";
import { findPrinters } from "../../main/printers/PrinterScan/printersUtil";

import { ipcMain } from "electron";

import { getStoredConnection } from "../../main/storage/StorageUtil";
import { printOrder } from "../printers/Print/printerHelpers";

interface PrintOrderData {
  timestamp: number;
  restaurantId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private debugMode = true;
  private isConnecting: boolean = false;
  private connectionData: StoredConnectionData | undefined;

  private periodicReconnectTimer: NodeJS.Timeout | null = null;
  private periodicReconnectInterval: number = 1 * 15 * 1000;

  private isReconnecting: boolean = false;

  private healthCheckTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSocket();
    this.startPeriodicReconnectCheck();
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
      this.connectionData = await getStoredConnection();
      if (!this.connectionData?.data?.connectionCode) {
        this.debugLog("No connection code available");
        return;
      }

      this.debugLog("Initializing socket connection...");
      console.log(this.connectionData, "this.connectionData");
      this.socket = io(BASE_DOMAIN, {
        forceNew: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        auth: {
          token: this.connectionData.data.connectionCode,
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
      this.subscribePrintOrderSocket();
      this.subscribeRequestPrinterScan();
      this.joinRestaurantRoom(this.connectionData?.data.user.restaurant.id);
    });

    this.socket.on("connect_error", (error) => {
      this.debugLog("Connection error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      this.debugLog("Socket disconnected:", reason);
    });

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

  public getConnectionStatus(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect() {
    this.debugLog("Disconnecting socket");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public async reconnect(): Promise<void> {
    if (this.socket?.connected) {
      this.debugLog("Already connected, skipping reconnect");
      return;
    }

    this.debugLog("Reconnecting socket");
    this.disconnect();

    // Return a promise that resolves after initialization
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          this.initializeSocket();
          this.subscribePrintOrderSocket();
          this.subscribeRequestPrinterScan();
          resolve();
        } catch (error) {
          this.debugLog("Reconnection failed:", error);
          resolve(); // Resolve anyway to ensure finally block executes
        }
      }, 500);
    });
  }

  private handleReconnection() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.debugLog("Starting reconnection process");

    // Clear any existing health check timeout
    if (this.healthCheckTimeout) {
      clearTimeout(this.healthCheckTimeout);
      this.healthCheckTimeout = null;
    }

    this.reconnect().finally(() => {
      this.isReconnecting = false;
    });
  }

  //--PERIODIC HEALTH CHECK!

  private startPeriodicReconnectCheck(): void {
    if (this.periodicReconnectTimer) {
      clearInterval(this.periodicReconnectTimer);
    }

    this.periodicReconnectTimer = setInterval(async () => {
      const isConnected = this.getConnectionStatus();

      if (!isConnected && !this.isConnecting) {
        console.log("Socket disconnected, triggering reconnection...");
        this.handleReconnection();
      } else {
        await this.performHealthCheck();
      }
    }, this.periodicReconnectInterval);

    console.log(
      `Periodic health check started - interval: ${this.periodicReconnectInterval}ms`
    );
  }

  private async subscribeRequestPrinterScan(): Promise<void> {
    if (!this.socket?.connected || !this.connectionData) {
      this.debugLog(
        "Cannot subscribe to printer scan - not connected or no connection data"
      );
      return;
    }

    const printerDiscoveredEvent = `requestPrinterScan:${this.connectionData.data.user.restaurant.id}`;
    this.socket.off(printerDiscoveredEvent);

    this.socket.on(printerDiscoveredEvent, async () => {
      const printers = await findPrinters();
      const printersArr = printers ? Object.values(printers) : [];
      await postPrinterAppDiscovered(
        printersArr,
        this.connectionData?.data.connectionCode
      );
    });

    this.debugLog(`Subscribed to ${printerDiscoveredEvent}`);
  }

  private async subscribePrintOrderSocket(): Promise<void> {
    if (!this.socket?.connected || !this.connectionData) {
      this.debugLog(
        "Cannot subscribe to print order socket - not connected or no connection data"
      );
      return;
    }

    const printOrderEvent = `printOrder:${this.connectionData.data.user.restaurant.id}`;
    this.socket.off(printOrderEvent);

    this.socket.on(printOrderEvent, async (order: OrderIO) => {
      await printOrder(order);
    });

    this.debugLog(`Subscribed to ${printOrderEvent}`);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.socket || !this.connectionData) return;

    return new Promise<void>((resolve) => {
      let healthCheckReceived = false;

      // Setup socket event listener before making HTTP request
      const healthCheckEvent = `healthCheck:${this.connectionData?.data.user.restaurant.id}`;

      const handleSocketHealthCheck = (data: PrintOrderData) => {
        this.debugLog("Received Health Check Socket Event:", data);
        healthCheckReceived = true;
        if (this.healthCheckTimeout) {
          clearTimeout(this.healthCheckTimeout);
          this.healthCheckTimeout = null;
        }
        this.socket?.off(healthCheckEvent, handleSocketHealthCheck);
        resolve();
      };

      // Add socket event listener
      this.socket!.on(healthCheckEvent, handleSocketHealthCheck);

      // Set timeout for health check
      this.healthCheckTimeout = setTimeout(() => {
        if (!healthCheckReceived && !this.isReconnecting) {
          this.debugLog("Health check timeout - triggering reconnection");
          this.socket?.off(healthCheckEvent, handleSocketHealthCheck);
          this.handleReconnection();
        }
        resolve();
      }, 5000);

      // Make HTTP request
      getHealthCheck(this.connectionData?.data.connectionCode).catch(
        (error: any) => {
          this.debugLog("Health check HTTP request failed:", error);
          if (this.healthCheckTimeout) {
            clearTimeout(this.healthCheckTimeout);
            this.healthCheckTimeout = null;
          }
          this.socket?.off(healthCheckEvent, handleSocketHealthCheck);
          if (!this.isReconnecting) {
            this.handleReconnection();
          }
          resolve();
        }
      );
    });
  }

  private stopPeriodicReconnectCheck(): void {
    if (this.periodicReconnectTimer) {
      clearInterval(this.periodicReconnectTimer);
      this.periodicReconnectTimer = null;
    }
  }
}

export const getConnectionStatusSocket = () => {
  ipcMain.handle("get-connection-status-socket", (event) => {
    return socketService.getConnectionStatus();
  });
};

export const setupSocketBridge = () => {
  ipcMain.handle("reconnect-socket", (event) => {
    socketService.reconnect();
  });
};
export const disconnectSocket = () => {
  ipcMain.handle("disconnect-socket", (event) => {
    socketService.disconnect();
  });
};

export const socketService = new SocketService();
