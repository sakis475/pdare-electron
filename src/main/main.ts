import { app, BrowserWindow, dialog, powerSaveBlocker } from "electron";
import * as path from "path";
import { autoUpdater } from "electron-updater";
import { NODE_ENV } from "../../env";
import {
  disconnectSocket,
  getConnectionStatusSocket,
  setupSocketBridge,
} from "./utils/socket";
import {
  clearConnectionBridge,
  fetchAndStoreConnectionBridge,
  getStoredConnectionBridge,
} from "./storage/StorageUtil";

const id = powerSaveBlocker.start("prevent-display-sleep");

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      devTools: false,
    },
    icon: path.join(__dirname, "../../../build/servetablogopurple.png"),
  });

  // Enable remote debugging in development
  if (NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
}

app.whenReady().then(() => {
  getConnectionStatusSocket();
  setupSocketBridge();
  disconnectSocket();
  fetchAndStoreConnectionBridge();
  getStoredConnectionBridge();
  clearConnectionBridge();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    powerSaveBlocker.stop(id);
    // Give time for the update to install
    setTimeout(() => {
      app.quit();
    }, 1000);
  }
});
