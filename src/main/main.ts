import { app, BrowserWindow, session, powerSaveBlocker } from "electron";
import * as path from "path";
import { NODE_ENV } from "../../env";

const userDataPath = app.getPath("userData");
console.log("User Data Path", userDataPath);

const id = powerSaveBlocker.start("prevent-display-sleep");

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Fix path to preload
      preload: path.join(__dirname, "../../src/preload/preload.js"),
      webSecurity: true,
    },
  });

  // Configure CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self';" +
              "script-src 'self';" +
              // Add both WS and HTTP endpoints
              "connect-src 'self' ws://localhost:8000 http://localhost:8000 wss://localhost:8000;" +
              "style-src 'self' 'unsafe-inline';",
          ],
        },
      });
    }
  );

  // Enable remote debugging in development
  if (NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
}

app.whenReady().then(() => {
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
    app.quit();
  }
});
