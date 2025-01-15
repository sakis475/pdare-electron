import { app, BrowserWindow, session } from "electron";
import * as path from "path";
import { NODE_ENV } from "../../env";

const userDataPath = app.getPath("userData");
console.log("User Data Path", userDataPath);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Fix path to preload
      preload: path.join(__dirname, "../../src/preload/preload.js"),
    },
  });

  // Configure CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self';" +
            "connect-src 'self' http://localhost:8000 ws://localhost:8000 wss://localhost:8000 http://localhost:* ws://localhost:* wss://localhost:*;" +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
            "style-src 'self' 'unsafe-inline';" +
            "img-src 'self' data: http://localhost:*",
        ],
      },
    });
  });

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
    app.quit();
  }
});
