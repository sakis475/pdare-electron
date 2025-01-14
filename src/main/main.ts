import { app, BrowserWindow } from "electron";
import * as path from "path";

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

  // Fix path to index.html
  mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
  mainWindow.webContents.openDevTools();
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
