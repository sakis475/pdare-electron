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
import log from "electron-log";

const id = powerSaveBlocker.start("prevent-display-sleep");

// Configure logging immediately at the top
log.transports.file.level = "debug";
log.transports.console.level = "debug"; // Add this to see logs in console
autoUpdater.logger = log;

log.info("Application Starting..."); // Add this to verify logging works

function setupAutoUpdater() {
  if (!app.isPackaged) {
    log.info("Running in development mode - skipping auto-updates");
    return;
  }

  log.info("Initializing auto-updater");

  autoUpdater.setFeedURL({
    provider: "generic",
    url: "http://localhost:8000/public",
  });

  // Enable auto download and install
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.autoRunAppAfterInstall = false;

  // Add detailed logging
  log.info("Current version:", app.getVersion());
  log.info("Update feed URL:", autoUpdater.getFeedURL());
  log.info("Platform:", process.platform);

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    // Install immediately when update is downloaded
    autoUpdater.quitAndInstall(true, true);
  });

  autoUpdater.on("error", (error) => {
    log.error("Auto-updater error:", error);
  });

  // Initial check
  autoUpdater.checkForUpdates();

  // Check periodically (every hour)
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
}

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
    icon: path.join(__dirname, "../../../build/mywaitericon.png"),
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
  setupAutoUpdater(); // Initialize auto-updater after window creation

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
