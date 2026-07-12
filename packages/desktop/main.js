const { app, BrowserWindow, shell } = require("electron");

const START_URL = process.env.BEEAR_URL || "http://127.0.0.1:8860";

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    title: "BeeAR",
    backgroundColor: "#0b1020",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.removeMenu();
  win.loadURL(START_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
