import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { socketManager } from "../Sockets/SocketManager";
import { BASE_DOMAIN } from "../../env";
import { socketEventSubscriber } from "../Sockets/SocketEventSubscriber";
import { setupStorageHandlers } from "../storage/mainStorage";
import { mainGetStorage } from "../storage/mainStore";

interface SocketStatus {
  initialized: boolean;
  connected: boolean;
  error?: string;
}

async function initializeSocket(mainWindow: BrowserWindow) {
  try {
    await socketManager.updateUserInstance();
    socketManager.connect(BASE_DOMAIN);
    socketEventSubscriber.initialize();

    const status: SocketStatus = {
      initialized: true,
      connected: true,
    };
    mainWindow.webContents.send("socket:status", status);

    // Notify renderer that socket is initialized
    mainWindow.webContents.send("socket:status", {
      initialized: true,
      connected: true,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Socket initialization error:", errorMessage);

    const status: SocketStatus = {
      initialized: false,
      connected: false,
      error: errorMessage,
    };
    mainWindow.webContents.send("socket:status", status);
  }
}

ipcMain.on("auth:login-success", async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    await initializeSocket(window);
  }
});

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  mainWindow.webContents.openDevTools();

  try {
    const user = mainGetStorage("currentUser");
    if (user && mainWindow) {
      await initializeSocket(mainWindow);
    }
  } catch (error) {
    console.error("Error checking user authentication:", error);
  }
}

app.whenReady().then(() => {
  setupStorageHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  socketManager.disconnect();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
